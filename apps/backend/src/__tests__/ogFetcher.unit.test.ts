import { describe, it, expect } from "vitest";

import { OgFetcher } from "../services/ogFetcher";
import type { OgMetadata } from "../services/ogFetcher";

/** Helper: creates a minimal HTML page with the given meta tags. */
function html(metas: Record<string, string> = {}, titleText?: string): string {
  const metaTags = Object.entries(metas)
    .map(([key, value]) => {
      // Determine if this is a property-based or name-based meta
      const isNameAttr = key === "description" || key === "author";
      const attr = isNameAttr ? "name" : "property";
      return `<meta ${attr}="${key}" content="${value}">`;
    })
    .join("\n    ");

  return `<!DOCTYPE html>
<html>
  <head>
    ${titleText ? `<title>${titleText}</title>` : ""}
    ${metaTags}
  </head>
  <body></body>
</html>`;
}

/** Helper: creates a mock fetch that returns the given HTML. */
function mockFetch(responseHtml: string, options?: { status?: number; contentType?: string }) {
  return async (): Promise<Response> => {
    return new Response(responseHtml, {
      status: options?.status ?? 200,
      headers: { "Content-Type": options?.contentType ?? "text/html; charset=utf-8" },
    });
  };
}

describe("OgFetcher", () => {
  describe("parse (synchronous HTML parsing)", () => {
    it("extracts all standard OG tags", () => {
      const page = html({
        "og:type": "article",
        "og:title": "Test Article",
        "og:description": "A test description",
        "og:image": "https://example.com/image.jpg",
        "og:site_name": "Example Blog",
        "og:url": "https://example.com/article/1",
        "article:author": "Jane Doe",
        "article:published_time": "2025-01-15T10:00:00Z",
      });

      const fetcher = new OgFetcher();
      const result = fetcher.parse(page, "https://example.com/article/1");

      expect(result).toEqual<OgMetadata>({
        type: "article",
        title: "Test Article",
        description: "A test description",
        image: "https://example.com/image.jpg",
        author: "Jane Doe",
        siteName: "Example Blog",
        publishedAt: "2025-01-15T10:00:00Z",
        url: "https://example.com/article/1",
      });
    });

    it("falls back to <title> when og:title is missing", () => {
      const page = html({}, "Page Title");
      const fetcher = new OgFetcher();
      const result = fetcher.parse(page, "https://example.com");

      expect(result.title).toBe("Page Title");
    });

    it("falls back to meta name=description when og:description is missing", () => {
      const page = html({ description: "Meta description" });
      const fetcher = new OgFetcher();
      const result = fetcher.parse(page, "https://example.com");

      expect(result.description).toBe("Meta description");
    });

    it("falls back to meta name=author when article:author is missing", () => {
      const page = html({ author: "John Smith" });
      const fetcher = new OgFetcher();
      const result = fetcher.parse(page, "https://example.com");

      expect(result.author).toBe("John Smith");
    });

    it("falls back to twitter:image when og:image is missing", () => {
      const page = html({ "twitter:image": "https://example.com/tw-img.jpg" });
      const fetcher = new OgFetcher();
      const result = fetcher.parse(page, "https://example.com");

      expect(result.image).toBe("https://example.com/tw-img.jpg");
    });

    it("resolves relative og:image URLs against base URL", () => {
      const page = html({ "og:image": "/images/thumb.jpg" });
      const fetcher = new OgFetcher();
      const result = fetcher.parse(page, "https://example.com/page");

      expect(result.image).toBe("https://example.com/images/thumb.jpg");
    });

    it("returns null for all fields when HTML has no meta tags", () => {
      const page = "<!DOCTYPE html><html><head></head><body></body></html>";
      const fetcher = new OgFetcher();
      const result = fetcher.parse(page, "https://example.com");

      expect(result).toEqual<OgMetadata>({
        type: null,
        title: null,
        description: null,
        image: null,
        author: null,
        siteName: null,
        publishedAt: null,
        url: null,
      });
    });

    it("trims whitespace from meta content values", () => {
      const page = `<html><head>
        <meta property="og:title" content="  Spaced Title  ">
        <meta property="og:description" content="  Spaced Desc  ">
      </head></html>`;
      const fetcher = new OgFetcher();
      const result = fetcher.parse(page, "https://example.com");

      expect(result.title).toBe("Spaced Title");
      expect(result.description).toBe("Spaced Desc");
    });

    it("returns null for empty content values", () => {
      const page = `<html><head>
        <meta property="og:title" content="">
        <meta property="og:type" content="   ">
      </head></html>`;
      const fetcher = new OgFetcher();
      const result = fetcher.parse(page, "https://example.com");

      expect(result.title).toBeNull();
      expect(result.type).toBeNull();
    });
  });

  describe("fetch (async with injectable fetch)", () => {
    it("returns OgMetadata for a valid HTML response", async () => {
      const page = html({
        "og:type": "article",
        "og:title": "Fetched Article",
      });
      const fetcher = new OgFetcher({ fetchFn: mockFetch(page) });
      const result = await fetcher.fetch("https://example.com/article");

      expect(result).not.toBeNull();
      expect(result!.type).toBe("article");
      expect(result!.title).toBe("Fetched Article");
    });

    it("returns null for non-HTML response", async () => {
      const fetcher = new OgFetcher({
        fetchFn: mockFetch("{}", { contentType: "application/json" }),
      });
      const result = await fetcher.fetch("https://example.com/api");

      expect(result).toBeNull();
    });

    it("returns null for non-OK status", async () => {
      const fetcher = new OgFetcher({
        fetchFn: mockFetch("Not Found", { status: 404 }),
      });
      const result = await fetcher.fetch("https://example.com/missing");

      expect(result).toBeNull();
    });

    it("returns null when fetch throws (network error)", async () => {
      const fetcher = new OgFetcher({
        fetchFn: async () => { throw new Error("Network error"); },
      });
      const result = await fetcher.fetch("https://example.com");

      expect(result).toBeNull();
    });
  });

  describe("module exports", () => {
    it("exports a singleton ogFetcher instance", async () => {
      const { ogFetcher } = await import("../services/ogFetcher");
      expect(ogFetcher).toBeInstanceOf(OgFetcher);
    });
  });
});
