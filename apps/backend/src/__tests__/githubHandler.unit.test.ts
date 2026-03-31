import { describe, it, expect } from "vitest";

import { GitHubHandler } from "../services/urlHandlers/githubHandler";
import { NULL_OG_METADATA } from "../services/urlHandlers/types";
import type { OgMetadata } from "../services/ogFetcher";

const handler = new GitHubHandler();

/** Helper to build OgMetadata with overrides. */
function og(overrides: Partial<OgMetadata> = {}): OgMetadata {
  return { ...NULL_OG_METADATA, ...overrides };
}

describe("GitHubHandler", () => {
  describe("sourceType", () => {
    it("is 'github'", () => {
      expect(handler.sourceType).toBe("github");
    });
  });

  describe("matches()", () => {
    it("matches github.com", () => {
      expect(handler.matches(new URL("https://github.com/facebook/react"), og())).toBe(true);
    });

    it("matches www.github.com", () => {
      expect(handler.matches(new URL("https://www.github.com/facebook/react"), og())).toBe(true);
    });

    it("does not match unrelated URL", () => {
      expect(handler.matches(new URL("https://example.com/page"), og())).toBe(false);
    });

    it("does not match youtube.com", () => {
      expect(handler.matches(new URL("https://youtube.com/watch?v=abc"), og())).toBe(false);
    });
  });

  describe("resolve()", () => {
    it("constructs thumbnail for repo URL", async () => {
      const result = await handler.resolve(
        new URL("https://github.com/facebook/react"),
        og(),
      );
      expect(result).toEqual({
        thumbnailUrl: "https://opengraph.githubassets.com/1/facebook/react",
      });
    });

    it("constructs thumbnail for deep URL (issue)", async () => {
      const result = await handler.resolve(
        new URL("https://github.com/facebook/react/issues/123"),
        og(),
      );
      expect(result).toEqual({
        thumbnailUrl: "https://opengraph.githubassets.com/1/facebook/react",
      });
    });

    it("constructs thumbnail for deep URL (PR)", async () => {
      const result = await handler.resolve(
        new URL("https://github.com/facebook/react/pull/456"),
        og(),
      );
      expect(result).toEqual({
        thumbnailUrl: "https://opengraph.githubassets.com/1/facebook/react",
      });
    });

    it("returns empty object for URL without owner/repo (settings)", async () => {
      const result = await handler.resolve(
        new URL("https://github.com/settings"),
        og(),
      );
      expect(result).toEqual({});
    });

    it("returns empty object for root URL", async () => {
      const result = await handler.resolve(
        new URL("https://github.com/"),
        og(),
      );
      expect(result).toEqual({});
    });
  });

  describe("extractOwnerRepo()", () => {
    it("extracts owner and repo from standard path", () => {
      const info = handler.extractOwnerRepo(new URL("https://github.com/vercel/next.js"));
      expect(info).toEqual({ owner: "vercel", repo: "next.js" });
    });

    it("returns null for single-segment path", () => {
      const info = handler.extractOwnerRepo(new URL("https://github.com/facebook"));
      expect(info).toBeNull();
    });
  });
});
