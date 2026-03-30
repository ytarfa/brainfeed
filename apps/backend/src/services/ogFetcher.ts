import * as cheerio from "cheerio";

const OG_FETCH_TIMEOUT_MS = 5000;

/**
 * Structured representation of Open Graph metadata extracted from a page.
 * All fields are optional — pages may include any subset of OG tags.
 */
export interface OgMetadata {
  type: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  author: string | null;
  siteName: string | null;
  publishedAt: string | null;
  url: string | null;
}

/**
 * Fetches a URL and extracts Open Graph metadata from the HTML response.
 *
 * Parses og:type, og:title, og:description, og:image, og:site_name,
 * article:author, article:published_time, and og:url.
 *
 * Falls back to standard <meta> tags and <title> when OG tags are absent.
 */
export class OgFetcher {
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(options?: { timeoutMs?: number; fetchFn?: typeof fetch }) {
    this.timeoutMs = options?.timeoutMs ?? OG_FETCH_TIMEOUT_MS;
    this.fetchFn = options?.fetchFn ?? fetch;
  }

  /**
   * Fetch a URL and extract OG metadata.
   * Returns null if the page cannot be fetched or is not HTML.
   */
  async fetch(url: string): Promise<OgMetadata | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await this.fetchFn(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "BrainFeedBot/1.0 (+https://brainfeed.app)",
          "Accept": "text/html",
        },
        redirect: "follow",
      });

      clearTimeout(timeout);

      if (!response.ok) return null;

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) return null;

      const html = await response.text();
      return this.parse(html, url);
    } catch {
      return null;
    }
  }

  /**
   * Parse OG metadata from raw HTML. Exported for testing.
   */
  parse(html: string, baseUrl: string): OgMetadata {
    const $ = cheerio.load(html);

    const ogType = this.metaContent($, "og:type");
    const ogTitle = this.metaContent($, "og:title")
      ?? ($("title").first().text().trim() || null);
    const ogDescription = this.metaContent($, "og:description")
      ?? this.metaContent($, "description", "name");
    const ogImage = this.resolveUrl(
      this.metaContent($, "og:image")
        ?? this.metaContent($, "twitter:image")
        ?? this.metaContent($, "twitter:image", "name"),
      baseUrl,
    );
    const ogAuthor = this.metaContent($, "article:author")
      ?? this.metaContent($, "author", "name");
    const ogSiteName = this.metaContent($, "og:site_name");
    const ogPublishedAt = this.metaContent($, "article:published_time");
    const ogUrl = this.metaContent($, "og:url");

    return {
      type: ogType,
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
      author: ogAuthor,
      siteName: ogSiteName,
      publishedAt: ogPublishedAt,
      url: ogUrl,
    };
  }

  /**
   * Extract content from a <meta> tag by property or name attribute.
   */
  private metaContent(
    $: cheerio.CheerioAPI,
    value: string,
    attr: "property" | "name" = "property",
  ): string | null {
    const content = $(`meta[${attr}='${value}']`).attr("content")
      ?? $(`meta[${attr === "property" ? "name" : "property"}='${value}']`).attr("content");
    return content?.trim() || null;
  }

  /**
   * Resolve a potentially relative URL against the page URL.
   */
  private resolveUrl(imageUrl: string | null, baseUrl: string): string | null {
    if (!imageUrl) return null;
    try {
      return new URL(imageUrl, baseUrl).href;
    } catch {
      return imageUrl;
    }
  }
}

/** Default singleton instance. */
export const ogFetcher = new OgFetcher();
