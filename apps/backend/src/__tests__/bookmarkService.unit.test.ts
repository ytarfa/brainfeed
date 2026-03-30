import { describe, it, expect } from "vitest";

import { BookmarkService } from "../services/bookmarkService";
import type { SourceTypeStrategy } from "../services/sourceTypeStrategy";
import { OgFetcher } from "../services/ogFetcher";
import type { OgMetadata } from "../services/ogFetcher";
import { OgTypeParser } from "../services/ogTypeParser";

/** Helper: creates a minimal OgMetadata with given overrides. */
function ogMeta(overrides: Partial<OgMetadata> = {}): OgMetadata {
  return {
    type: null,
    title: null,
    description: null,
    image: null,
    author: null,
    siteName: null,
    publishedAt: null,
    url: null,
    ...overrides,
  };
}

/** Helper: creates a mock OgFetcher that returns the given metadata. */
function mockOgFetcher(result: OgMetadata | null): OgFetcher {
  const fetcher = new OgFetcher({ fetchFn: async () => new Response("") });
  fetcher.fetch = async () => result;
  return fetcher;
}

describe("BookmarkService", () => {
  describe("detectSourceType — hostname fast path", () => {
    it("detects github.com URLs without OG fetch", async () => {
      const mockFetcher = mockOgFetcher(null);
      const service = new BookmarkService({ ogFetcher: mockFetcher });
      const result = await service.detectSourceType("https://github.com/user/repo");

      expect(result.sourceType).toBe("github");
      expect(result.ogMetadata).toBeNull();
    });

    it("detects youtube.com URLs without OG fetch", async () => {
      const service = new BookmarkService({ ogFetcher: mockOgFetcher(null) });
      const result = await service.detectSourceType("https://youtube.com/watch?v=abc");

      expect(result.sourceType).toBe("youtube");
      expect(result.ogMetadata).toBeNull();
    });

    it("detects youtu.be short URLs", async () => {
      const service = new BookmarkService({ ogFetcher: mockOgFetcher(null) });
      const result = await service.detectSourceType("https://youtu.be/abc123");

      expect(result.sourceType).toBe("youtube");
      expect(result.ogMetadata).toBeNull();
    });

    it("strips www. prefix before matching", async () => {
      const service = new BookmarkService({ ogFetcher: mockOgFetcher(null) });
      const result = await service.detectSourceType("https://www.github.com/user/repo");

      expect(result.sourceType).toBe("github");
      expect(result.ogMetadata).toBeNull();
    });
  });

  describe("detectSourceType — OG fallback path", () => {
    it("fetches OG data and detects article type", async () => {
      const articleMeta = ogMeta({ type: "article", title: "Test Article", author: "Jane" });
      const service = new BookmarkService({ ogFetcher: mockOgFetcher(articleMeta) });
      const result = await service.detectSourceType("https://example.com/post/123");

      expect(result.sourceType).toBe("article");
      expect(result.ogMetadata).toEqual(articleMeta);
    });

    it("returns 'generic' with OG metadata when og:type is unrecognized", async () => {
      const websiteMeta = ogMeta({ type: "website", title: "Example Site" });
      const service = new BookmarkService({ ogFetcher: mockOgFetcher(websiteMeta) });
      const result = await service.detectSourceType("https://example.com");

      expect(result.sourceType).toBe("generic");
      expect(result.ogMetadata).toEqual(websiteMeta);
    });

    it("returns 'generic' with no OG metadata when fetch fails", async () => {
      const service = new BookmarkService({ ogFetcher: mockOgFetcher(null) });
      const result = await service.detectSourceType("https://example.com/page");

      expect(result.sourceType).toBe("generic");
      expect(result.ogMetadata).toBeNull();
    });

    it("returns 'generic' for invalid URLs", async () => {
      const service = new BookmarkService({ ogFetcher: mockOgFetcher(null) });
      const result = await service.detectSourceType("not-a-url");

      expect(result.sourceType).toBe("generic");
      expect(result.ogMetadata).toBeNull();
    });
  });

  describe("custom strategy chain", () => {
    it("uses a custom hostname strategy that matches first", async () => {
      const customStrategy: SourceTypeStrategy = {
        detect: (hostname: string) => hostname === "custom.io" ? "github" : null,
      };
      const service = new BookmarkService({
        strategies: [customStrategy],
        ogFetcher: mockOgFetcher(null),
      });
      const result = await service.detectSourceType("https://custom.io/page");

      expect(result.sourceType).toBe("github");
      expect(result.ogMetadata).toBeNull();
    });

    it("falls through to OG path when hostname strategies return null", async () => {
      const noopStrategy: SourceTypeStrategy = { detect: () => null };
      const articleMeta = ogMeta({ type: "article" });
      const service = new BookmarkService({
        strategies: [noopStrategy],
        ogFetcher: mockOgFetcher(articleMeta),
      });
      const result = await service.detectSourceType("https://example.com");

      expect(result.sourceType).toBe("article");
      expect(result.ogMetadata).toEqual(articleMeta);
    });
  });

  describe("custom OgTypeParser", () => {
    it("uses an injected OgTypeParser for source type detection", async () => {
      const meta = ogMeta({ type: "custom-type" });
      const customParser = new OgTypeParser([
        { detect: (m: OgMetadata) => m.type === "custom-type" ? "article" : null },
      ]);
      const service = new BookmarkService({
        ogFetcher: mockOgFetcher(meta),
        ogTypeParser: customParser,
      });
      const result = await service.detectSourceType("https://example.com");

      expect(result.sourceType).toBe("article");
    });
  });

  describe("singleton export", () => {
    it("exports a pre-configured bookmarkService singleton", async () => {
      const { bookmarkService } = await import("../services/bookmarkService");
      expect(bookmarkService).toBeInstanceOf(BookmarkService);
    });
  });
});
