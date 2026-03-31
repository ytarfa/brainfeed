import { describe, it, expect, vi } from "vitest";

import { UrlHandlerRegistry } from "../services/urlHandlers/registry";
import { NULL_OG_METADATA } from "../services/urlHandlers/types";
import type { UrlHandler, ResolvedBookmark } from "../services/urlHandlers/types";
import type { OgMetadata } from "../services/ogFetcher";
import { OgFetcher } from "../services/ogFetcher";

/** Helper: creates a mock OgFetcher that returns the given metadata. */
function mockOgFetcher(result: OgMetadata | null): OgFetcher {
  const fetcher = new OgFetcher({ fetchFn: async () => new Response("") });
  vi.spyOn(fetcher, "fetch").mockResolvedValue(result);
  return fetcher;
}

/** Helper: creates a mock handler. */
function mockHandler(
  sourceType: ResolvedBookmark["sourceType"],
  matchFn: (url: URL, og: OgMetadata) => boolean,
  resolveFn: (url: URL, og: OgMetadata) => Promise<Partial<ResolvedBookmark>>,
): UrlHandler {
  return {
    sourceType,
    matches: matchFn,
    resolve: resolveFn,
  };
}

const sampleOg: OgMetadata = {
  type: "website",
  title: "Example Title",
  description: "Example description",
  image: "https://example.com/og-image.jpg",
  author: "Jane Author",
  siteName: "Example Site",
  publishedAt: null,
  url: "https://example.com/page",
};

describe("UrlHandlerRegistry", () => {
  describe("resolve() with matched handler", () => {
    it("merges handler overrides over OG base", async () => {
      const handler = mockHandler(
        "youtube",
        () => true,
        async () => ({ thumbnailUrl: "https://img.youtube.com/vi/abc/hqdefault.jpg" }),
      );
      const registry = new UrlHandlerRegistry({
        handlers: [handler],
        ogFetcher: mockOgFetcher(sampleOg),
      });

      const result = await registry.resolve("https://www.youtube.com/watch?v=abc");

      expect(result).toEqual({
        sourceType: "youtube",
        thumbnailUrl: "https://img.youtube.com/vi/abc/hqdefault.jpg",
        title: "Example Title",
        description: "Example description",
        author: "Jane Author",
      });
    });

    it("sets sourceType from handler even when overrides are empty", async () => {
      const handler = mockHandler(
        "article",
        () => true,
        async () => ({}),
      );
      const registry = new UrlHandlerRegistry({
        handlers: [handler],
        ogFetcher: mockOgFetcher(sampleOg),
      });

      const result = await registry.resolve("https://blog.example.com/post");

      expect(result.sourceType).toBe("article");
      expect(result.title).toBe("Example Title");
    });
  });

  describe("resolve() with no handler match", () => {
    it("returns generic fallback from OG base", async () => {
      const handler = mockHandler(
        "youtube",
        () => false,
        async () => ({}),
      );
      const registry = new UrlHandlerRegistry({
        handlers: [handler],
        ogFetcher: mockOgFetcher(sampleOg),
      });

      const result = await registry.resolve("https://example.com/page");

      expect(result).toEqual({
        sourceType: "generic",
        thumbnailUrl: "https://example.com/og-image.jpg",
        title: "Example Title",
        description: "Example description",
        author: "Jane Author",
      });
    });
  });

  describe("resolve() with OG fetch failure", () => {
    it("uses NULL_OG_METADATA sentinel when OG returns null", async () => {
      const handler = mockHandler(
        "youtube",
        () => true,
        async () => ({ thumbnailUrl: "https://img.youtube.com/vi/abc/hqdefault.jpg" }),
      );
      const registry = new UrlHandlerRegistry({
        handlers: [handler],
        ogFetcher: mockOgFetcher(null),
      });

      const result = await registry.resolve("https://www.youtube.com/watch?v=abc");

      expect(result).toEqual({
        sourceType: "youtube",
        thumbnailUrl: "https://img.youtube.com/vi/abc/hqdefault.jpg",
        title: null,
        description: null,
        author: null,
      });
    });

    it("returns all-null generic when no handler matches and OG fails", async () => {
      const registry = new UrlHandlerRegistry({
        handlers: [],
        ogFetcher: mockOgFetcher(null),
      });

      const result = await registry.resolve("https://example.com/page");

      expect(result).toEqual({
        sourceType: "generic",
        thumbnailUrl: null,
        title: null,
        description: null,
        author: null,
      });
    });
  });

  describe("partial override merge", () => {
    it("only overrides fields that are defined", async () => {
      const handler = mockHandler(
        "github",
        () => true,
        async () => ({ thumbnailUrl: "https://opengraph.githubassets.com/1/fb/react" }),
      );
      const registry = new UrlHandlerRegistry({
        handlers: [handler],
        ogFetcher: mockOgFetcher(sampleOg),
      });

      const result = await registry.resolve("https://github.com/fb/react");

      expect(result.thumbnailUrl).toBe("https://opengraph.githubassets.com/1/fb/react");
      expect(result.title).toBe("Example Title");
      expect(result.description).toBe("Example description");
      expect(result.author).toBe("Jane Author");
      expect(result.sourceType).toBe("github");
    });

    it("does not override base when handler returns undefined fields", async () => {
      const handler = mockHandler(
        "github",
        () => true,
        async () => ({ thumbnailUrl: undefined }),
      );
      const registry = new UrlHandlerRegistry({
        handlers: [handler],
        ogFetcher: mockOgFetcher(sampleOg),
      });

      const result = await registry.resolve("https://github.com/fb/react");

      // undefined should NOT override the base
      expect(result.thumbnailUrl).toBe("https://example.com/og-image.jpg");
    });
  });

  describe("handler ordering (first-match-wins)", () => {
    it("uses the first matching handler and skips the rest", async () => {
      const youtubeHandler = mockHandler(
        "youtube",
        (url) => url.hostname.includes("youtube"),
        async () => ({ thumbnailUrl: "https://img.youtube.com/vi/abc/hqdefault.jpg" }),
      );
      const articleHandler = mockHandler(
        "article",
        () => true, // would match everything
        async () => ({}),
      );
      const registry = new UrlHandlerRegistry({
        handlers: [youtubeHandler, articleHandler],
        ogFetcher: mockOgFetcher(sampleOg),
      });

      const result = await registry.resolve("https://www.youtube.com/watch?v=abc");

      expect(result.sourceType).toBe("youtube");
      expect(result.thumbnailUrl).toBe("https://img.youtube.com/vi/abc/hqdefault.jpg");
    });

    it("falls through to later handler when earlier ones don't match", async () => {
      const youtubeHandler = mockHandler(
        "youtube",
        () => false,
        async () => ({}),
      );
      const articleHandler = mockHandler(
        "article",
        () => true,
        async () => ({}),
      );
      const registry = new UrlHandlerRegistry({
        handlers: [youtubeHandler, articleHandler],
        ogFetcher: mockOgFetcher(sampleOg),
      });

      const result = await registry.resolve("https://blog.example.com/post");

      expect(result.sourceType).toBe("article");
    });
  });

  describe("singleton export", () => {
    it("exports a default registry instance", async () => {
      const { registry } = await import("../services/urlHandlers/registry");
      expect(registry).toBeInstanceOf(UrlHandlerRegistry);
    });
  });
});
