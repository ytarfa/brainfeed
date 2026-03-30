/**
 * LLM enrichment utility.
 *
 * Provides a shared model factory and a structured-output function that
 * extracts summaries, entities, topics, and tags from arbitrary content.
 *
 * Uses ChatOpenRouter which automatically reads OPENROUTER_API_KEY from
 * the environment — no explicit key passing required.
 */

import { ChatOpenRouter } from "@langchain/openrouter";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

// ---------------------------------------------------------------------------
// Zod schema for structured LLM output
// ---------------------------------------------------------------------------

export const enrichmentSchema = z.object({
  summary: z
    .string()
    .describe("A concise 2-4 sentence summary of the content."),
  entities: z
    .array(
      z.object({
        name: z.string().describe("Entity name"),
        type: z
          .string()
          .describe("Entity type, e.g. person, organization, technology, place"),
      }),
    )
    .describe("Named entities mentioned in the content."),
  topics: z
    .array(z.string())
    .describe("3-7 topic labels that categorize the content."),
  tags: z
    .array(z.string())
    .describe("5-10 short tags for discoverability and search."),
});

export type EnrichmentLLMOutput = z.infer<typeof enrichmentSchema>;

// ---------------------------------------------------------------------------
// Model factory
// ---------------------------------------------------------------------------

let cachedModel: ChatOpenRouter | null = null;

/**
 * Return a ChatOpenRouter instance. Re-uses a cached singleton per process.
 * The model identifier is read from ENRICHMENT_MODEL env var (defaults to
 * google/gemini-2.0-flash-001).
 */
export function getModel(): ChatOpenRouter {
  if (cachedModel) {
    return cachedModel;
  }
  const model = process.env.ENRICHMENT_MODEL ?? DEFAULT_MODEL;
  cachedModel = new ChatOpenRouter({ model });
  return cachedModel;
}

/**
 * Reset the cached model — useful for tests.
 */
export function resetModel(): void {
  cachedModel = null;
}

// ---------------------------------------------------------------------------
// Structured enrichment
// ---------------------------------------------------------------------------

/**
 * Enrich arbitrary content using the LLM with structured output.
 *
 * @param content     The text content to enrich (transcript, description, etc.)
 * @param contentType A label describing the content (e.g. "YouTube video
 *                    transcript", "YouTube channel description").
 * @returns Parsed enrichment result, or `null` fields / empty arrays when
 *          content is empty.
 */
export async function enrichContent(
  content: string,
  contentType: string,
): Promise<EnrichmentLLMOutput> {
  // Handle empty / whitespace content — skip LLM call entirely
  if (!content || !content.trim()) {
    return {
      summary: "",
      entities: [],
      topics: [],
      tags: [],
    };
  }

  const model = getModel();
  const structured = model.withStructuredOutput(enrichmentSchema);

  const prompt = [
    `You are analyzing the following ${contentType}.`,
    "Extract a concise summary, named entities, topic labels, and tags.",
    "",
    "Content:",
    "---",
    content,
    "---",
  ].join("\n");

  return structured.invoke(prompt);
}
