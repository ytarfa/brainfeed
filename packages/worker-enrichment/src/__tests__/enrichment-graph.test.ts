import { describe, it, expect } from "vitest";
import { resolveRoute, detectRouteFromUrl } from "../enrichment-graph";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";
import type { EnrichmentRoute } from "../enrichment-graph";

// ---------------------------------------------------------------------------
// Helper to build a minimal bookmark for testing
// ---------------------------------------------------------------------------

function makeBookmark(
  overrides: Partial<BookmarkForProcessing> = {},
): BookmarkForProcessing {
  return {
    id: "bk-test",
    url: "https://example.com",
    title: "Test Bookmark",
    content_type: "link",
    source_type: null,
    raw_content: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// detectRouteFromUrl
// ---------------------------------------------------------------------------

describe("detectRouteFromUrl", () => {
  const cases: [string, EnrichmentRoute][] = [
    ["https://github.com/user/repo", "github"],
    ["https://www.github.com/user/repo/issues/42", "github"],
    ["https://youtube.com/watch?v=abc", "youtube"],
    ["https://www.youtube.com/watch?v=abc", "youtube"],
    ["https://youtu.be/abc", "youtube"],
  ];

  it.each(cases)("detects %s as %s", (url, expected) => {
    expect(detectRouteFromUrl(url)).toBe(expected);
  });

  it("returns null for unrecognized URLs", () => {
    expect(detectRouteFromUrl("https://example.com/some-article")).toBeNull();
    expect(detectRouteFromUrl("https://amazon.com/dp/B123")).toBeNull();
    expect(detectRouteFromUrl("https://twitter.com/user/status/123")).toBeNull();
    expect(detectRouteFromUrl("https://reddit.com/r/programming")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveRoute
// ---------------------------------------------------------------------------

describe("resolveRoute", () => {
  describe("routes by source_type when present", () => {
    const sourceTypeCases: [string, EnrichmentRoute][] = [
      ["github", "github"],
      ["youtube", "youtube"],
      ["article", "article"],
      ["generic", "generic"],
    ];

    it.each(sourceTypeCases)(
      "source_type=%s -> %s",
      (sourceType, expected) => {
        const bookmark = makeBookmark({ source_type: sourceType as BookmarkForProcessing["source_type"] });
        expect(resolveRoute(bookmark)).toBe(expected);
      },
    );
  });

  describe("generic source_type with platform URL falls through to URL detection", () => {
    it("generic source_type with github URL routes to youtube via source_type map", () => {
      const bookmark = makeBookmark({
        source_type: "generic",
        url: "https://github.com/user/repo",
      });
      // "generic" IS mapped in SOURCE_TYPE_TO_ROUTE -> "generic", so it won't fall through
      expect(resolveRoute(bookmark)).toBe("generic");
    });
  });

  describe("falls back to URL pattern matching when source_type is null", () => {
    it("detects github from URL", () => {
      const bookmark = makeBookmark({
        url: "https://github.com/langchain-ai/langgraph",
      });
      expect(resolveRoute(bookmark)).toBe("github");
    });

    it("detects youtube from URL", () => {
      const bookmark = makeBookmark({
        url: "https://youtu.be/dQw4w9WgXcQ",
      });
      expect(resolveRoute(bookmark)).toBe("youtube");
    });

    it("falls back to article for non-matching HTTP URL", () => {
      const bookmark = makeBookmark({
        url: "https://x.com/elonmusk/status/12345",
      });
      expect(resolveRoute(bookmark)).toBe("article");
    });
  });

  describe("HTTP URLs default to article enrichment", () => {
    it("routes plain HTTP URL to article", () => {
      const bookmark = makeBookmark({
        url: "https://example.com/some-article",
        source_type: null,
      });
      expect(resolveRoute(bookmark)).toBe("article");
    });

    it("routes http:// URL to article", () => {
      const bookmark = makeBookmark({
        url: "http://blog.example.com/post",
        source_type: null,
      });
      expect(resolveRoute(bookmark)).toBe("article");
    });
  });

  describe("ultimate fallback to generic (non-HTTP)", () => {
    it("returns generic for non-HTTP URL", () => {
      const bookmark = makeBookmark({
        url: "ftp://files.example.com/readme.txt",
        source_type: null,
      });
      expect(resolveRoute(bookmark)).toBe("generic");
    });

    it("returns generic for invalid URL", () => {
      const bookmark = makeBookmark({
        url: "not-a-valid-url",
        source_type: null,
      });
      expect(resolveRoute(bookmark)).toBe("generic");
    });

    it("returns generic when URL is empty string", () => {
      const bookmark = makeBookmark({
        url: "",
        source_type: null,
      });
      expect(resolveRoute(bookmark)).toBe("generic");
    });
  });

  describe("source_type takes priority over URL", () => {
    it("source_type=github overrides a youtube URL", () => {
      const bookmark = makeBookmark({
        source_type: "github",
        url: "https://youtube.com/watch?v=abc",
      });
      expect(resolveRoute(bookmark)).toBe("github");
    });

    it("source_type=youtube overrides a github URL", () => {
      const bookmark = makeBookmark({
        source_type: "youtube",
        url: "https://github.com/user/repo",
      });
      expect(resolveRoute(bookmark)).toBe("youtube");
    });
  });
});
