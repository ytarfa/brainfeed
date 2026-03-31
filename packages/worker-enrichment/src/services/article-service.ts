/**
 * Article extraction service.
 *
 * Fetches a web page, extracts OG/meta tags via Cheerio, then uses
 * @mozilla/readability + jsdom to pull the article body. Returns a
 * structured result with content, metadata, and reading-time estimates.
 */

import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";

import { AppError } from "@brain-feed/error-types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const USER_AGENT =
  "Mozilla/5.0 (compatible; BrainFeedBot/1.0; +https://brain-feed.app)";

const FETCH_TIMEOUT_MS = 30_000;

/**
 * Maximum article content length (in characters) sent to the LLM.
 * Configurable via ARTICLE_MAX_CHARS env var. Defaults to 80 000.
 */
const ARTICLE_MAX_CHARS = parseInt(
  process.env.ARTICLE_MAX_CHARS ?? "80000",
  10,
);

// Average reading speed for reading-time estimate
const WORDS_PER_MINUTE = 238;

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------

export class UnsupportedContentError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 415, "UNSUPPORTED_CONTENT", context);
  }
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface ArticleExtractResult {
  title: string | null;
  byline: string | null;
  siteName: string | null;
  content: string | null;
  excerpt: string | null;
  lang: string | null;
  publishedTime: string | null;
  ogImage: string | null;
  wordCount: number;
  readingTimeMinutes: number;
}

// ---------------------------------------------------------------------------
// OG / meta tag extraction (Cheerio — fast, no full DOM needed)
// ---------------------------------------------------------------------------

interface OgMeta {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogSiteName: string | null;
  author: string | null;
  publishedTime: string | null;
  lang: string | null;
}

function extractOgMeta(html: string): OgMeta {
  const $ = cheerio.load(html);

  const meta = (name: string): string | null => {
    // Try property first (OpenGraph), then name (standard meta)
    const value =
      $(`meta[property="${name}"]`).attr("content") ??
      $(`meta[name="${name}"]`).attr("content");
    return value?.trim() || null;
  };

  // Attempt to extract author from JSON-LD
  let jsonLdAuthor: string | null = null;
  $('script[type="application/ld+json"]').each((_i, el) => {
    if (jsonLdAuthor) return;
    try {
      const data = JSON.parse($(el).text());
      const authorField = data?.author;
      if (typeof authorField === "string") {
        jsonLdAuthor = authorField;
      } else if (authorField?.name) {
        jsonLdAuthor = authorField.name;
      }
    } catch {
      // Invalid JSON-LD — skip
    }
  });

  return {
    ogTitle: meta("og:title"),
    ogDescription: meta("og:description"),
    ogImage: meta("og:image"),
    ogSiteName: meta("og:site_name"),
    author:
      meta("author") ??
      meta("article:author") ??
      jsonLdAuthor,
    publishedTime:
      meta("article:published_time") ??
      meta("date") ??
      meta("publication_date"),
    lang: $("html").attr("lang")?.trim() || null,
  };
}

// ---------------------------------------------------------------------------
// Content truncation (at word boundary)
// ---------------------------------------------------------------------------

export function truncateContent(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }

  // Find the last space before the limit to avoid splitting words
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  const cutPoint = lastSpace > maxChars * 0.8 ? lastSpace : maxChars;

  return text.slice(0, cutPoint) + "\n[Content truncated]";
}

// ---------------------------------------------------------------------------
// Article extraction
// ---------------------------------------------------------------------------

export class ArticleService {
  /**
   * Fetch a URL and extract its article content + metadata.
   *
   * @throws {UnsupportedContentError} if response is not HTML
   * @throws {Error} if fetch fails (network, timeout, non-2xx)
   */
  static async extract(url: string): Promise<ArticleExtractResult> {
    // ---- Fetch HTML ----
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
        redirect: "follow",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch article: HTTP ${response.status} ${response.statusText}`,
      );
    }

    // ---- Verify HTML content type ----
    const contentType = response.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      throw new UnsupportedContentError(
        `Non-HTML content type: ${contentType}`,
        { url, contentType },
      );
    }

    const html = await response.text();

    // ---- Phase 1: OG / meta extraction (Cheerio) ----
    const og = extractOgMeta(html);

    // ---- Phase 2: Readability extraction ----
    // Always attempt Readability parse. isProbablyReaderable is a heuristic
    // that rejects many real-world pages (e.g. Paul Graham's essays) that
    // actually parse perfectly. We fall back to OG metadata only when
    // Readability returns null or empty content.
    const dom = new JSDOM(html, { url });
    const readabilityResult = new Readability(dom.window.document).parse();

    // ---- Build result ----
    const rawText = readabilityResult?.textContent?.trim() ?? "";
    if (readabilityResult && rawText.length > 0) {
      // Full extraction succeeded
      const textContent = truncateContent(rawText, ARTICLE_MAX_CHARS);
      const wordCount = textContent.split(/\s+/).filter(Boolean).length;

      return {
        title: readabilityResult.title || og.ogTitle,
        byline: readabilityResult.byline ?? og.author,
        siteName: readabilityResult.siteName ?? og.ogSiteName,
        content: textContent,
        excerpt: readabilityResult.excerpt || og.ogDescription,
        lang: readabilityResult.lang ?? og.lang,
        publishedTime: og.publishedTime,
        ogImage: og.ogImage,
        wordCount,
        readingTimeMinutes: Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)),
      };
    }

    // Fallback: not readable or Readability returned empty
    // Use OG metadata for thin extraction
    const fallbackContent = [og.ogTitle, og.ogDescription]
      .filter(Boolean)
      .join(". ");
    const fallbackWordCount = fallbackContent
      .split(/\s+/)
      .filter(Boolean).length;

    return {
      title: og.ogTitle,
      byline: og.author,
      siteName: og.ogSiteName,
      content: fallbackContent || null,
      excerpt: og.ogDescription,
      lang: og.lang,
      publishedTime: og.publishedTime,
      ogImage: og.ogImage,
      wordCount: fallbackWordCount,
      readingTimeMinutes: Math.max(
        1,
        Math.ceil(fallbackWordCount / WORDS_PER_MINUTE),
      ),
    };
  }
}
