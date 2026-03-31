import { describe, it, expect } from "vitest";

import { ArticleHandler } from "../services/urlHandlers/articleHandler";
import { NULL_OG_METADATA } from "../services/urlHandlers/types";
import type { OgMetadata } from "../services/ogFetcher";

const handler = new ArticleHandler();

/** Helper to build OgMetadata with overrides. */
function og(overrides: Partial<OgMetadata> = {}): OgMetadata {
  return { ...NULL_OG_METADATA, ...overrides };
}

describe("ArticleHandler", () => {
  describe("sourceType", () => {
    it("is 'article'", () => {
      expect(handler.sourceType).toBe("article");
    });
  });

  describe("matches()", () => {
    it("matches when og:type is article", () => {
      expect(handler.matches(
        new URL("https://example.com/post"),
        og({ type: "article" }),
      )).toBe(true);
    });

    it("matches when author is present", () => {
      expect(handler.matches(
        new URL("https://example.com/post"),
        og({ author: "John Doe" }),
      )).toBe(true);
    });

    it("matches when publishedAt is present", () => {
      expect(handler.matches(
        new URL("https://example.com/post"),
        og({ publishedAt: "2024-01-15" }),
      )).toBe(true);
    });

    it("does not match when no article signals present", () => {
      expect(handler.matches(
        new URL("https://example.com/page"),
        og(),
      )).toBe(false);
    });

    it("does not match with non-article og:type", () => {
      expect(handler.matches(
        new URL("https://example.com/page"),
        og({ type: "website" }),
      )).toBe(false);
    });
  });

  describe("resolve()", () => {
    it("returns empty object (all metadata from OG base layer)", async () => {
      const result = await handler.resolve(
        new URL("https://example.com/post"),
        og({ type: "article", title: "My Article" }),
      );
      expect(result).toEqual({});
    });
  });
});
