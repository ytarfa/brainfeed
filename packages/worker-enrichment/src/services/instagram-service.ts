/**
 * Instagram content extraction service.
 *
 * Fetches Instagram post/reel pages using a Googlebot User-Agent,
 * detects whether the response is SSR-rendered (vs. empty JS shell),
 * and extracts caption text, media metadata, and author information
 * from embedded JSON structures in the HTML.
 */

import * as cheerio from "cheerio";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const FETCH_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InstagramContentType = "post" | "reel";

export interface InstagramClassification {
  instagramType: InstagramContentType;
  shortcode: string;
}

export type MediaType = "image" | "video" | "carousel";

export interface InstagramExtractResult {
  caption: string;
  username: string | null;
  fullName: string | null;
  mediaType: MediaType | null;
  carouselMediaCount: number | null;
  accessibilityCaption: string | null;
  ogImage: string | null;
}

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------

export class InstagramSSRUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InstagramSSRUnavailableError";
  }
}

// ---------------------------------------------------------------------------
// URL classification
// ---------------------------------------------------------------------------

/**
 * URL patterns for Instagram content types.
 *
 * /p/{shortcode}       → post (also carousel — same URL structure)
 * /reel/{shortcode}    → reel
 * /reels/{shortcode}   → reel (alternate form)
 * /tv/{shortcode}      → reel (IGTV, treated as reel)
 *
 * Shortcodes are alphanumeric + hyphens + underscores, typically 11 chars.
 */
const URL_PATTERNS: Array<{
  pattern: RegExp;
  type: InstagramContentType;
}> = [
  { pattern: /^\/p\/([A-Za-z0-9_-]+)\/?$/, type: "post" },
  { pattern: /^\/reel\/([A-Za-z0-9_-]+)\/?$/, type: "reel" },
  { pattern: /^\/reels\/([A-Za-z0-9_-]+)\/?$/, type: "reel" },
  { pattern: /^\/tv\/([A-Za-z0-9_-]+)\/?$/, type: "reel" },
];

// ---------------------------------------------------------------------------
// SSR detection patterns
// ---------------------------------------------------------------------------

/**
 * Instagram embeds caption data in the SSR HTML as JSON inside script tags
 * or inline attributes. We look for `"caption":{"text":"` which is the
 * canonical marker of a server-rendered post page.
 */
const CAPTION_JSON_REGEX = /"caption"\s*:\s*\{\s*"text"\s*:\s*"/;

// ---------------------------------------------------------------------------
// Media type mapping
// ---------------------------------------------------------------------------

const MEDIA_TYPE_MAP: Record<number, MediaType> = {
  1: "image",
  2: "video",
  8: "carousel",
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class InstagramService {
  /**
   * Classify an Instagram URL into a content sub-type.
   *
   * Returns `null` for unrecognized URLs (profiles, stories, explore, etc.)
   */
  static classifyUrl(url: string): InstagramClassification | null {
    let pathname: string;
    try {
      pathname = new URL(url).pathname;
    } catch {
      return null;
    }

    for (const { pattern, type } of URL_PATTERNS) {
      const match = pathname.match(pattern);
      if (match) {
        return { instagramType: type, shortcode: match[1] };
      }
    }

    return null;
  }

  /**
   * Fetch an Instagram page and extract content from SSR HTML.
   *
   * @throws {InstagramSSRUnavailableError} if the page is a JS shell with
   *   no embedded content data.
   * @throws {Error} if the fetch fails (network, timeout, non-2xx).
   */
  static async extract(url: string): Promise<InstagramExtractResult> {
    const html = await InstagramService.fetchPage(url);

    if (!InstagramService.isSSR(html)) {
      throw new InstagramSSRUnavailableError(
        "Instagram returned empty JS shell — no SSR data available",
      );
    }

    return InstagramService.parseSSR(html);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Fetch an Instagram page using Googlebot UA.
   */
  static async fetchPage(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": GOOGLEBOT_UA,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
        redirect: "follow",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(
        `Instagram fetch failed: HTTP ${response.status} ${response.statusText}`,
      );
    }

    return response.text();
  }

  /**
   * Detect whether an Instagram HTML response is SSR-rendered (contains
   * embedded content data) vs. a client-side-only JS shell.
   */
  static isSSR(html: string): boolean {
    return CAPTION_JSON_REGEX.test(html);
  }

  /**
   * Parse SSR-rendered Instagram HTML and extract content + metadata.
   *
   * @throws {InstagramSSRUnavailableError} if no caption text is found
   *   in the HTML despite passing the SSR check.
   */
  static parseSSR(html: string): InstagramExtractResult {
    const $ = cheerio.load(html);

    // -- Caption text -------------------------------------------------------
    // The SSR HTML embeds JSON blobs with `"caption":{"text":"..."}` in
    // script tags or data attributes. We extract all caption texts and use
    // the first non-empty one (which corresponds to the bookmarked post).
    const caption = InstagramService.extractCaption(html);

    if (!caption) {
      throw new InstagramSSRUnavailableError(
        "SSR HTML detected but no caption text found — insufficient data for enrichment",
      );
    }

    // -- OG image -----------------------------------------------------------
    const ogImage =
      $('meta[property="og:image"]').attr("content")?.trim() || null;

    // -- Username / full name -----------------------------------------------
    const username = InstagramService.extractJsonField(html, "username");
    const fullName = InstagramService.extractJsonField(html, "full_name");

    // -- Media type ---------------------------------------------------------
    const mediaTypeRaw = InstagramService.extractJsonNumber(html, "media_type");
    const mediaType =
      mediaTypeRaw !== null ? (MEDIA_TYPE_MAP[mediaTypeRaw] ?? null) : null;

    // -- Carousel count -----------------------------------------------------
    const carouselMediaCount =
      mediaType === "carousel"
        ? InstagramService.extractJsonNumber(html, "carousel_media_count")
        : null;

    // -- Accessibility caption ----------------------------------------------
    const accessibilityCaption = InstagramService.extractJsonStringField(
      html,
      "accessibility_caption",
    );

    return {
      caption,
      username,
      fullName,
      mediaType,
      carouselMediaCount,
      accessibilityCaption,
      ogImage,
    };
  }

  // -------------------------------------------------------------------------
  // JSON field extraction helpers
  // -------------------------------------------------------------------------

  /**
   * Extract the first non-empty caption text from embedded JSON.
   *
   * Matches `"caption":{"text":"..."}` patterns. The caption text is
   * JSON-encoded so we parse it to unescape characters.
   */
  private static extractCaption(html: string): string | null {
    // Match "caption":{"text":"<captured>"  where captured is the JSON string
    // content (may contain escaped quotes, newlines, etc.)
    const regex = /"caption"\s*:\s*\{\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      try {
        // Unescape JSON string encoding (\\n → \n, \\\" → ", etc.)
        const text = JSON.parse(`"${match[1]}"`);
        if (typeof text === "string" && text.trim().length > 0) {
          return text.trim();
        }
      } catch {
        // Malformed JSON escape — try next match
      }
    }

    return null;
  }

  /**
   * Extract a simple string field value from embedded JSON.
   * Matches `"fieldName":"value"` patterns.
   */
  private static extractJsonField(
    html: string,
    field: string,
  ): string | null {
    const regex = new RegExp(
      `"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`,
    );
    const match = html.match(regex);
    if (!match) return null;

    try {
      const value = JSON.parse(`"${match[1]}"`);
      return typeof value === "string" && value.trim().length > 0
        ? value.trim()
        : null;
    } catch {
      return null;
    }
  }

  /**
   * Extract a string field value from embedded JSON, allowing for more
   * complex values (including spaces).
   */
  private static extractJsonStringField(
    html: string,
    field: string,
  ): string | null {
    const regex = new RegExp(
      `"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`,
    );
    const match = html.match(regex);
    if (!match) return null;

    try {
      const value = JSON.parse(`"${match[1]}"`);
      return typeof value === "string" && value.trim().length > 0
        ? value.trim()
        : null;
    } catch {
      return null;
    }
  }

  /**
   * Extract a numeric field value from embedded JSON.
   * Matches `"fieldName":123` patterns.
   */
  private static extractJsonNumber(
    html: string,
    field: string,
  ): number | null {
    const regex = new RegExp(`"${field}"\\s*:\\s*(\\d+)`);
    const match = html.match(regex);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    return Number.isFinite(value) ? value : null;
  }
}
