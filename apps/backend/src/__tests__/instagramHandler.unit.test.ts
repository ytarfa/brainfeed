import { describe, it, expect } from "vitest";

import { InstagramHandler } from "../services/urlHandlers/instagramHandler";
import { NULL_OG_METADATA } from "../services/urlHandlers/types";
import type { OgMetadata } from "../services/ogFetcher";

const handler = new InstagramHandler();

/** Helper to build OgMetadata with overrides. */
function og(overrides: Partial<OgMetadata> = {}): OgMetadata {
  return { ...NULL_OG_METADATA, ...overrides };
}

describe("InstagramHandler", () => {
  describe("sourceType", () => {
    it("is 'instagram'", () => {
      expect(handler.sourceType).toBe("instagram");
    });
  });

  describe("matches()", () => {
    it("matches instagram.com", () => {
      expect(handler.matches(new URL("https://instagram.com/p/ABC123/"), og())).toBe(true);
    });

    it("matches www.instagram.com", () => {
      expect(handler.matches(new URL("https://www.instagram.com/p/ABC123/"), og())).toBe(true);
    });

    it("matches m.instagram.com", () => {
      expect(handler.matches(new URL("https://m.instagram.com/p/ABC123/"), og())).toBe(true);
    });

    it("matches reel URL", () => {
      expect(handler.matches(new URL("https://www.instagram.com/reel/XYZ789/"), og())).toBe(true);
    });

    it("matches reels URL (plural)", () => {
      expect(handler.matches(new URL("https://www.instagram.com/reels/XYZ789/"), og())).toBe(true);
    });

    it("matches tv URL", () => {
      expect(handler.matches(new URL("https://www.instagram.com/tv/DEF456/"), og())).toBe(true);
    });

    it("does not match unrelated URL", () => {
      expect(handler.matches(new URL("https://example.com/page"), og())).toBe(false);
    });

    it("does not match youtube.com", () => {
      expect(handler.matches(new URL("https://youtube.com/watch?v=abc"), og())).toBe(false);
    });

    it("does not match github.com", () => {
      expect(handler.matches(new URL("https://github.com/user/repo"), og())).toBe(false);
    });
  });

  describe("resolve()", () => {
    it("returns og:image as thumbnailUrl when available", async () => {
      const result = await handler.resolve(
        new URL("https://www.instagram.com/p/ABC123/"),
        og({ image: "https://scontent-lax3-1.cdninstagram.com/v/image.jpg" }),
      );
      expect(result).toEqual({
        thumbnailUrl: "https://scontent-lax3-1.cdninstagram.com/v/image.jpg",
      });
    });

    it("returns empty object when og:image is null", async () => {
      const result = await handler.resolve(
        new URL("https://www.instagram.com/p/ABC123/"),
        og(),
      );
      expect(result).toEqual({});
    });

    it("returns empty object when og:image is empty string", async () => {
      const result = await handler.resolve(
        new URL("https://www.instagram.com/reel/XYZ789/"),
        og({ image: "" }),
      );
      expect(result).toEqual({});
    });
  });
});
