import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatOpenRouter } from "@langchain/openrouter";
import { z } from "zod";
import * as cheerio from "cheerio";
import type { EnrichedData } from "@brain-feed/types";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum characters of page text sent to the LLM. */
const MAX_CONTENT_LENGTH = 12_000;

/** Timeout for fetching a bookmark URL (ms). */
const FETCH_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Structured output schema
// ---------------------------------------------------------------------------

const SummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe("A concise 2-4 sentence summary of the content."),
  entities: z
    .array(
      z.object({
        name: z.string().describe("Entity name"),
        type: z
          .string()
          .describe(
            "Entity type, e.g. person, organization, technology, product",
          ),
      }),
    )
    .describe("Key entities mentioned in the content."),
  topics: z
    .array(z.string())
    .describe("3-6 short topic labels that categorize this content."),
});

// ---------------------------------------------------------------------------
// State schema for the enrichment pipeline
// ---------------------------------------------------------------------------

const EnrichmentState = Annotation.Root({
  bookmark: Annotation<BookmarkForProcessing>,
  /** Raw text extracted from the bookmark URL (populated by fetch node). */
  pageText: Annotation<string | null>,
  result: Annotation<EnrichedData | null>,
});

type EnrichmentStateType = typeof EnrichmentState.State;

// ---------------------------------------------------------------------------
// Node 1: Fetch — retrieve page content and extract text via cheerio
// ---------------------------------------------------------------------------

async function fetchNode(
  state: EnrichmentStateType,
): Promise<Partial<EnrichmentStateType>> {
  const { bookmark } = state;

  // If we already have raw_content (e.g. notes, pasted text), use it directly
  if (bookmark.raw_content) {
    return { pageText: bookmark.raw_content.slice(0, MAX_CONTENT_LENGTH) };
  }

  // If there's no URL, we can't fetch anything
  if (!bookmark.url) {
    return { pageText: null };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(bookmark.url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BrainFeedBot/1.0; +https://brainfeed.app)",
        Accept: "text/html,application/xhtml+xml,text/plain",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(
        `[fetch] HTTP ${response.status} for ${bookmark.url}`,
      );
      return { pageText: null };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove non-content elements
    $(
      "script, style, nav, footer, header, aside, iframe, noscript, svg, [role='navigation'], [role='banner'], [role='contentinfo']",
    ).remove();

    // Try to grab the main content area first, fall back to body
    let text = "";
    const mainSelectors = [
      "article",
      "[role='main']",
      "main",
      ".post-content",
      ".entry-content",
      ".article-body",
      "#content",
    ];

    for (const selector of mainSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        text = el.text();
        break;
      }
    }

    if (!text) {
      text = $("body").text();
    }

    // Normalize whitespace
    text = text.replace(/\s+/g, " ").trim();

    return { pageText: text.slice(0, MAX_CONTENT_LENGTH) || null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[fetch] Failed to fetch ${bookmark.url}: ${message}`);
    return { pageText: null };
  }
}

// ---------------------------------------------------------------------------
// Node 2: Summarize — call OpenRouter/Haiku to generate structured summary
// ---------------------------------------------------------------------------

async function summarizeNode(
  state: EnrichmentStateType,
): Promise<Partial<EnrichmentStateType>> {
  const { bookmark, pageText } = state;

  // If we have no text to summarize, return a minimal result
  if (!pageText) {
    const enriched: EnrichedData = {
      summary: null,
      entities: [],
      topics: [],
      metadata: null,
      processedAt: new Date().toISOString(),
    };
    return { result: enriched };
  }

  try {
    const llm = new ChatOpenRouter({
      model: "anthropic/claude-3.5-haiku",
      temperature: 0,
      maxTokens: 1024,
    });

    const structuredLlm = llm.withStructuredOutput(SummaryOutputSchema, {
      name: "bookmark_summary",
    });

    const titleContext = bookmark.title ? `Title: ${bookmark.title}\n` : "";
    const urlContext = bookmark.url ? `URL: ${bookmark.url}\n` : "";

    const result = await structuredLlm.invoke([
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes web content. " +
          "Produce a concise summary, extract key entities, and assign topic labels. " +
          "Be factual and objective. Do not hallucinate information not present in the content.",
      },
      {
        role: "user",
        content:
          `Summarize the following bookmarked content:\n\n${titleContext}${urlContext}\nContent:\n${pageText}`,
      },
    ]);

    const enriched: EnrichedData = {
      summary: result.summary,
      entities: result.entities,
      topics: result.topics,
      metadata: null,
      processedAt: new Date().toISOString(),
    };

    return { result: enriched };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[summarize] LLM call failed: ${message}`);

    // Return a partial result rather than crashing the pipeline
    const enriched: EnrichedData = {
      summary: null,
      entities: [],
      topics: [],
      metadata: null,
      processedAt: new Date().toISOString(),
    };
    return { result: enriched };
  }
}

// ---------------------------------------------------------------------------
// Build the LangGraph state graph
// ---------------------------------------------------------------------------

const graph = new StateGraph(EnrichmentState)
  .addNode("fetch", fetchNode)
  .addNode("summarize", summarizeNode)
  .addEdge("__start__", "fetch")
  .addEdge("fetch", "summarize")
  .addEdge("summarize", "__end__")
  .compile();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the enrichment pipeline on a bookmark.
 *
 * 1. **fetch** — retrieves page content from the bookmark URL using HTTP +
 *    cheerio text extraction (or uses `raw_content` if available).
 * 2. **summarize** — calls OpenRouter (Claude Haiku) to produce a structured
 *    summary with entities and topic labels.
 *
 * Returns a valid `EnrichedData` object.
 */
export async function runPipeline(
  bookmark: BookmarkForProcessing,
): Promise<EnrichedData> {
  const output = await graph.invoke({
    bookmark,
    pageText: null,
    result: null,
  });
  return output.result as EnrichedData;
}
