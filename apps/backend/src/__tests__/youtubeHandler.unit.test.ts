import { describe, it, expect } from "vitest";

import { YouTubeHandler } from "../services/urlHandlers/youtubeHandler";
import { NULL_OG_METADATA } from "../services/urlHandlers/types";
import type { OgMetadata } from "../services/ogFetcher";

const handler = new YouTubeHandler();

/** Helper to build OgMetadata with overrides. */
function og(overrides: Partial<OgMetadata> = {}): OgMetadata {
  return { ...NULL_OG_METADATA, ...overrides };
}

describe("YouTubeHandler", () => {
  describe("sourceType", () => {
    it("is 'youtube'", () => {
      expect(handler.sourceType).toBe("youtube");
    });
  });

  describe("matches()", () => {
    it("matches youtube.com", () => {
      expect(handler.matches(new URL("https://youtube.com/watch?v=abc"), og())).toBe(true);
    });

    it("matches www.youtube.com", () => {
      expect(handler.matches(new URL("https://www.youtube.com/watch?v=abc"), og())).toBe(true);
    });

    it("matches youtu.be", () => {
      expect(handler.matches(new URL("https://youtu.be/abc"), og())).toBe(true);
    });

    it("matches m.youtube.com", () => {
      expect(handler.matches(new URL("https://m.youtube.com/watch?v=abc"), og())).toBe(true);
    });

    it("matches music.youtube.com", () => {
      expect(handler.matches(new URL("https://music.youtube.com/watch?v=abc"), og())).toBe(true);
    });

    it("matches when OG siteName is YouTube", () => {
      expect(handler.matches(
        new URL("https://example.com/some-video"),
        og({ siteName: "YouTube" }),
      )).toBe(true);
    });

    it("does not match unrelated URL without YouTube siteName", () => {
      expect(handler.matches(new URL("https://example.com/page"), og())).toBe(false);
    });

    it("does not match github.com", () => {
      expect(handler.matches(new URL("https://github.com/user/repo"), og())).toBe(false);
    });
  });

  describe("resolve()", () => {
    it("extracts video ID from standard watch URL", async () => {
      const result = await handler.resolve(
        new URL("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        og(),
      );
      expect(result).toEqual({
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      });
    });

    it("extracts video ID from short URL", async () => {
      const result = await handler.resolve(
        new URL("https://youtu.be/dQw4w9WgXcQ"),
        og(),
      );
      expect(result).toEqual({
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      });
    });

    it("extracts video ID from embed URL", async () => {
      const result = await handler.resolve(
        new URL("https://www.youtube.com/embed/dQw4w9WgXcQ"),
        og(),
      );
      expect(result).toEqual({
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      });
    });

    it("extracts video ID from shorts URL", async () => {
      const result = await handler.resolve(
        new URL("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
        og(),
      );
      expect(result).toEqual({
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      });
    });

    it("returns empty object for non-extractable video ID (channel URL)", async () => {
      const result = await handler.resolve(
        new URL("https://www.youtube.com/channel/UC123"),
        og(),
      );
      expect(result).toEqual({});
    });

    it("returns empty object for youtu.be with empty path", async () => {
      const result = await handler.resolve(
        new URL("https://youtu.be/"),
        og(),
      );
      expect(result).toEqual({});
    });
  });

  describe("extractVideoId()", () => {
    it("returns video ID from watch URL with extra params", () => {
      const id = handler.extractVideoId(new URL("https://www.youtube.com/watch?v=abc123&t=120"));
      expect(id).toBe("abc123");
    });

    it("returns null for youtube.com homepage", () => {
      const id = handler.extractVideoId(new URL("https://www.youtube.com/"));
      expect(id).toBeNull();
    });
  });
});
