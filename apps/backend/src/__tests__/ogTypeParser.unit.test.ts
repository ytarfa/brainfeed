import { describe, it, expect } from "vitest";

import {
  ArticleOgTypeStrategy,
  OgTypeParser,
} from "../services/ogTypeParser";
import type { OgMetadata } from "../services/ogFetcher";

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

describe("ArticleOgTypeStrategy", () => {
  const strategy = new ArticleOgTypeStrategy();

  describe("primary detection: og:type", () => {
    it.each([
      "article",
      "blog",
      "newsarticle",
      "news article",
    ])("detects og:type '%s' as article", (type) => {
      expect(strategy.detect(ogMeta({ type }))).toBe("article");
    });

    it("is case-insensitive", () => {
      expect(strategy.detect(ogMeta({ type: "Article" }))).toBe("article");
      expect(strategy.detect(ogMeta({ type: "BLOG" }))).toBe("article");
    });

    it("trims whitespace from og:type", () => {
      expect(strategy.detect(ogMeta({ type: "  article  " }))).toBe("article");
    });
  });

  describe("secondary detection: article metadata", () => {
    it("detects as article when publishedAt is present", () => {
      expect(strategy.detect(ogMeta({ publishedAt: "2025-01-15" }))).toBe("article");
    });

    it("detects as article when author is present", () => {
      expect(strategy.detect(ogMeta({ author: "Jane Doe" }))).toBe("article");
    });

    it("detects as article when both are present", () => {
      expect(strategy.detect(ogMeta({ author: "Jane", publishedAt: "2025-01-15" }))).toBe("article");
    });
  });

  describe("non-matches", () => {
    it("returns null for og:type 'website' with no article metadata", () => {
      expect(strategy.detect(ogMeta({ type: "website" }))).toBeNull();
    });

    it("returns null for empty OgMetadata", () => {
      expect(strategy.detect(ogMeta())).toBeNull();
    });

    it("returns null for og:type 'product'", () => {
      expect(strategy.detect(ogMeta({ type: "product" }))).toBeNull();
    });

    it("returns null for og:type 'video.other'", () => {
      expect(strategy.detect(ogMeta({ type: "video.other" }))).toBeNull();
    });
  });
});

describe("OgTypeParser", () => {
  describe("with default strategies", () => {
    const parser = new OgTypeParser();

    it("detects article from og:type", () => {
      expect(parser.detectSourceType(ogMeta({ type: "article" }))).toBe("article");
    });

    it("detects article from publishedAt", () => {
      expect(parser.detectSourceType(ogMeta({ publishedAt: "2025-01-01" }))).toBe("article");
    });

    it("returns 'generic' for unrecognized OG metadata", () => {
      expect(parser.detectSourceType(ogMeta({ type: "website" }))).toBe("generic");
    });

    it("returns 'generic' for empty OG metadata", () => {
      expect(parser.detectSourceType(ogMeta())).toBe("generic");
    });
  });

  describe("custom strategy chain", () => {
    it("uses custom strategies in order", () => {
      const customStrategy = {
        detect: (meta: OgMetadata) => (meta.type === "video" ? "youtube" as const : null),
      };
      const parser = new OgTypeParser([customStrategy]);

      expect(parser.detectSourceType(ogMeta({ type: "video" }))).toBe("youtube");
      expect(parser.detectSourceType(ogMeta({ type: "article" }))).toBe("generic");
    });

    it("falls back to 'generic' when no strategy matches", () => {
      const parser = new OgTypeParser([]);
      expect(parser.detectSourceType(ogMeta({ type: "article" }))).toBe("generic");
    });
  });

  describe("module exports", () => {
    it("exports a singleton ogTypeParser instance", async () => {
      const { ogTypeParser } = await import("../services/ogTypeParser");
      expect(ogTypeParser).toBeInstanceOf(OgTypeParser);
    });
  });
});
