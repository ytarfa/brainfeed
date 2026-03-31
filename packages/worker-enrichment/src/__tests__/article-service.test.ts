import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  ArticleService,
  UnsupportedContentError,
  truncateContent,
} from "../services/article-service";

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ---------------------------------------------------------------------------
// Helpers — build HTML fixtures
// ---------------------------------------------------------------------------

function makeHtml(options: {
  title?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogSiteName?: string;
  author?: string;
  publishedTime?: string;
  lang?: string;
  body?: string;
  jsonLd?: Record<string, unknown>;
} = {}): string {
  const metaTags: string[] = [];

  if (options.ogTitle) {
    metaTags.push(`<meta property="og:title" content="${options.ogTitle}" />`);
  }
  if (options.ogDescription) {
    metaTags.push(`<meta property="og:description" content="${options.ogDescription}" />`);
  }
  if (options.ogImage) {
    metaTags.push(`<meta property="og:image" content="${options.ogImage}" />`);
  }
  if (options.ogSiteName) {
    metaTags.push(`<meta property="og:site_name" content="${options.ogSiteName}" />`);
  }
  if (options.author) {
    metaTags.push(`<meta name="author" content="${options.author}" />`);
  }
  if (options.publishedTime) {
    metaTags.push(`<meta property="article:published_time" content="${options.publishedTime}" />`);
  }

  let jsonLdScript = "";
  if (options.jsonLd) {
    jsonLdScript = `<script type="application/ld+json">${JSON.stringify(options.jsonLd)}</script>`;
  }

  // Build a body with enough content for isProbablyReaderable to return true
  // Readability checks for <p> tags with enough text content
  const body = options.body ?? `
    <article>
      <h1>${options.title ?? "Test Article"}</h1>
      ${"<p>This is a paragraph of test content that is long enough for Readability to consider this page as readable content. It contains multiple sentences and enough words to pass the threshold checks.</p>\n".repeat(10)}
    </article>
  `;

  return `<!DOCTYPE html>
<html lang="${options.lang ?? "en"}">
<head>
  <title>${options.title ?? "Test Article"}</title>
  ${metaTags.join("\n  ")}
  ${jsonLdScript}
</head>
<body>
  ${body}
</body>
</html>`;
}

function makeFetchResponse(
  html: string,
  contentType = "text/html; charset=utf-8",
  status = 200,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Not Found",
    headers: new Headers({ "content-type": contentType }),
    text: vi.fn().mockResolvedValue(html),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// truncateContent
// ---------------------------------------------------------------------------

describe("truncateContent", () => {
  it("returns content unchanged when under the limit", () => {
    const text = "Short content here.";
    expect(truncateContent(text, 1000)).toBe(text);
  });

  it("truncates at word boundary and appends marker", () => {
    const words = Array.from({ length: 100 }, (_, i) => `word${i}`);
    const text = words.join(" ");
    const result = truncateContent(text, 50);

    expect(result.length).toBeLessThanOrEqual(80); // content up to limit + truncation marker
    expect(result).toContain("[Content truncated]");
    // Should not end with a partial word before the marker
    const beforeMarker = result.split("\n[Content truncated]")[0];
    expect(beforeMarker).toMatch(/\w+$/); // ends with a complete word
  });

  it("handles text exactly at the limit", () => {
    const text = "A".repeat(100);
    expect(truncateContent(text, 100)).toBe(text);
  });
});

// ---------------------------------------------------------------------------
// ArticleService.extract — success scenarios
// ---------------------------------------------------------------------------

describe("ArticleService.extract", () => {
  describe("full extraction (readable article)", () => {
    it("extracts content with all OG metadata", async () => {
      const html = makeHtml({
        title: "My Great Article",
        ogTitle: "My Great Article (OG)",
        ogDescription: "A summary of the article.",
        ogImage: "https://example.com/image.jpg",
        ogSiteName: "Example Blog",
        author: "Jane Doe",
        publishedTime: "2024-01-15T10:00:00Z",
        lang: "en",
      });

      mockFetch.mockResolvedValueOnce(makeFetchResponse(html));

      const result = await ArticleService.extract("https://example.com/article");

      expect(result.title).toBeTruthy();
      expect(result.ogImage).toBe("https://example.com/image.jpg");
      expect(result.publishedTime).toBe("2024-01-15T10:00:00Z");
      expect(result.content).toBeTruthy();
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    });

    it("extracts author from JSON-LD when meta tag is missing", async () => {
      const html = makeHtml({
        title: "JSON-LD Article",
        jsonLd: {
          "@type": "Article",
          author: { name: "John Smith" },
        },
      });

      mockFetch.mockResolvedValueOnce(makeFetchResponse(html));

      const result = await ArticleService.extract("https://example.com/article");
      expect(result.byline).toBe("John Smith");
    });

    it("extracts author from JSON-LD when author is a string", async () => {
      const html = makeHtml({
        title: "JSON-LD Article",
        jsonLd: {
          "@type": "Article",
          author: "Jane Author",
        },
      });

      mockFetch.mockResolvedValueOnce(makeFetchResponse(html));

      const result = await ArticleService.extract("https://example.com/article");
      expect(result.byline).toBe("Jane Author");
    });

    it("sends request with correct User-Agent and Accept headers", async () => {
      const html = makeHtml();
      mockFetch.mockResolvedValueOnce(makeFetchResponse(html));

      await ArticleService.extract("https://example.com/article");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/article",
        expect.objectContaining({
          headers: expect.objectContaining({
            "User-Agent": expect.stringContaining("BrainFeedBot"),
            Accept: expect.stringContaining("text/html"),
          }),
        }),
      );
    });

    it("truncates long content at ARTICLE_MAX_CHARS", async () => {
      // Build a body with very long content
      const longParagraph = "A".repeat(1000) + " ";
      const longBody = `<article><h1>Long Article</h1>${("<p>" + longParagraph + "</p>").repeat(200)}</article>`;

      const html = makeHtml({ body: longBody });
      mockFetch.mockResolvedValueOnce(makeFetchResponse(html));

      const result = await ArticleService.extract("https://example.com/long");

      // Default ARTICLE_MAX_CHARS is 80000
      if (result.content && result.content.length > 80000) {
        expect(result.content).toContain("[Content truncated]");
      }
      // Content should exist either way
      expect(result.content).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Fallback scenarios
  // ---------------------------------------------------------------------------

  describe("thin extraction (not readable)", () => {
    it("falls back to OG metadata when content is not readable", async () => {
      // Minimal HTML that isProbablyReaderable will reject
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Login Page</title>
  <meta property="og:title" content="Login" />
  <meta property="og:description" content="Sign in to your account" />
  <meta property="og:site_name" content="MyApp" />
</head>
<body>
  <form><input type="text" /><button>Login</button></form>
</body>
</html>`;

      mockFetch.mockResolvedValueOnce(makeFetchResponse(html));

      const result = await ArticleService.extract("https://example.com/login");

      expect(result.title).toBe("Login");
      expect(result.excerpt).toBe("Sign in to your account");
      expect(result.siteName).toBe("MyApp");
      // Content should be thin (OG fallback)
      expect(result.content).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Error scenarios
  // ---------------------------------------------------------------------------

  describe("error handling", () => {
    it("throws UnsupportedContentError for non-HTML content", async () => {
      const response = makeFetchResponse("{}", "application/json");
      mockFetch.mockResolvedValueOnce(response);

      await expect(
        ArticleService.extract("https://example.com/api/data.json"),
      ).rejects.toThrow(UnsupportedContentError);
    });

    it("throws UnsupportedContentError for PDF content", async () => {
      const response = makeFetchResponse("%PDF-1.4", "application/pdf");
      mockFetch.mockResolvedValueOnce(response);

      await expect(
        ArticleService.extract("https://example.com/document.pdf"),
      ).rejects.toThrow(UnsupportedContentError);
    });

    it("throws on non-2xx HTTP responses", async () => {
      const response = makeFetchResponse("Not Found", "text/html", 404);
      mockFetch.mockResolvedValueOnce(response);

      await expect(
        ArticleService.extract("https://example.com/missing"),
      ).rejects.toThrow("Failed to fetch article: HTTP 404");
    });

    it("throws on network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        ArticleService.extract("https://unreachable.example.com"),
      ).rejects.toThrow("Network error");
    });

    it("accepts application/xhtml+xml content type", async () => {
      const html = makeHtml({ title: "XHTML Article" });
      mockFetch.mockResolvedValueOnce(
        makeFetchResponse(html, "application/xhtml+xml; charset=utf-8"),
      );

      const result = await ArticleService.extract("https://example.com/xhtml");
      expect(result.title).toBeTruthy();
      expect(result.content).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // OG meta edge cases
  // ---------------------------------------------------------------------------

  describe("OG meta edge cases", () => {
    it("handles missing OG tags gracefully", async () => {
      // HTML with no meta tags at all
      const html = `<!DOCTYPE html>
<html>
<head><title>Bare Page</title></head>
<body>
  <article>
    ${"<p>This is content that should be long enough for readability to parse it correctly and extract meaningful text from the page.</p>\n".repeat(10)}
  </article>
</body>
</html>`;

      mockFetch.mockResolvedValueOnce(makeFetchResponse(html));

      const result = await ArticleService.extract("https://example.com/bare");

      // Should still extract something via Readability
      expect(result.content).toBeTruthy();
      expect(result.ogImage).toBeNull();
      expect(result.publishedTime).toBeNull();
    });

    it("handles invalid JSON-LD gracefully", async () => {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Bad JSON-LD</title>
  <script type="application/ld+json">{ invalid json }</script>
</head>
<body>
  <article>
    ${"<p>Enough content for readability to consider this a real article with substantial text content.</p>\n".repeat(10)}
  </article>
</body>
</html>`;

      mockFetch.mockResolvedValueOnce(makeFetchResponse(html));

      // Should not throw — invalid JSON-LD is silently ignored
      const result = await ArticleService.extract("https://example.com/bad-jsonld");
      expect(result.content).toBeTruthy();
    });
  });
});
