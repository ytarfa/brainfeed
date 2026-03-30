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
    ["https://twitter.com/user/status/123", "twitter"],
    ["https://x.com/user/status/123", "twitter"],
    ["https://www.reddit.com/r/programming/comments/abc", "reddit"],
    ["https://open.spotify.com/episode/abc", "spotify"],
    ["https://arxiv.org/abs/2301.00001", "paper"],
    ["https://scholar.google.com/scholar?q=test", "paper"],
  ];

  it.each(cases)("detects %s as %s", (url, expected) => {
    expect(detectRouteFromUrl(url)).toBe(expected);
  });

  it("returns null for unrecognized URLs", () => {
    expect(detectRouteFromUrl("https://example.com/some-article")).toBeNull();
    expect(detectRouteFromUrl("https://amazon.com/dp/B123")).toBeNull();
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
      ["twitter", "twitter"],
      ["reddit", "reddit"],
      ["spotify", "spotify"],
      ["paper", "paper"],
      ["news", "news"],
      ["note", "non_link"],
      ["image", "non_link"],
      ["pdf", "non_link"],
      ["file", "non_link"],
    ];

    it.each(sourceTypeCases)(
      "source_type=%s -> %s",
      (sourceType, expected) => {
        const bookmark = makeBookmark({ source_type: sourceType });
        expect(resolveRoute(bookmark)).toBe(expected);
      },
    );
  });

  describe("unmapped source_types fall through to URL detection", () => {
    it("amazon source_type with github URL routes to github", () => {
      const bookmark = makeBookmark({
        source_type: "amazon",
        url: "https://github.com/user/repo",
      });
      expect(resolveRoute(bookmark)).toBe("github");
    });

    it("generic source_type with youtube URL routes to youtube", () => {
      const bookmark = makeBookmark({
        source_type: "generic",
        url: "https://youtube.com/watch?v=abc",
      });
      expect(resolveRoute(bookmark)).toBe("youtube");
    });

    it("rss source_type with plain URL routes to generic", () => {
      const bookmark = makeBookmark({
        source_type: "rss",
        url: "https://example.com/feed",
      });
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

    it("detects twitter/x from URL", () => {
      const bookmark = makeBookmark({
        url: "https://x.com/elonmusk/status/12345",
      });
      expect(resolveRoute(bookmark)).toBe("twitter");
    });
  });

  describe("falls back to content_type for non-link types", () => {
    it("routes note content_type to non_link", () => {
      const bookmark = makeBookmark({
        content_type: "note",
        url: null,
      });
      expect(resolveRoute(bookmark)).toBe("non_link");
    });

    it("routes pdf content_type to non_link", () => {
      const bookmark = makeBookmark({
        content_type: "pdf",
        url: null,
      });
      expect(resolveRoute(bookmark)).toBe("non_link");
    });

    it("routes image content_type to non_link", () => {
      const bookmark = makeBookmark({
        content_type: "image",
        url: null,
      });
      expect(resolveRoute(bookmark)).toBe("non_link");
    });
  });

  describe("ultimate fallback to generic", () => {
    it("returns generic for a plain link with no source_type", () => {
      const bookmark = makeBookmark({
        url: "https://example.com/some-article",
        source_type: null,
      });
      expect(resolveRoute(bookmark)).toBe("generic");
    });

    it("returns generic for a link with null URL and null source_type", () => {
      const bookmark = makeBookmark({
        url: null,
        source_type: null,
        content_type: "link",
      });
      expect(resolveRoute(bookmark)).toBe("generic");
    });
  });

  describe("source_type takes priority over URL", () => {
    it("source_type=news overrides a github URL", () => {
      const bookmark = makeBookmark({
        source_type: "news",
        url: "https://github.com/user/repo",
      });
      expect(resolveRoute(bookmark)).toBe("news");
    });

    it("source_type=paper overrides a youtube URL", () => {
      const bookmark = makeBookmark({
        source_type: "paper",
        url: "https://youtube.com/watch?v=abc",
      });
      expect(resolveRoute(bookmark)).toBe("paper");
    });
  });
});
