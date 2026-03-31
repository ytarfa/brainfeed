import { describe, it, expect, vi } from "vitest";

import {
  YouTubeThumbnailStrategy,
  GitHubThumbnailStrategy,
  ThumbnailService,
  resolveThumbnail,
  thumbnailService,
} from "../services/thumbnailService";
import type { ThumbnailStrategy } from "../services/thumbnailService";

// ---------------------------------------------------------------------------
// YouTubeThumbnailStrategy
// ---------------------------------------------------------------------------
describe("YouTubeThumbnailStrategy", () => {
  const strategy = new YouTubeThumbnailStrategy();

  it("supports youtube source type", () => {
    expect(strategy.supports("youtube")).toBe(true);
  });

  it("does not support other source types", () => {
    expect(strategy.supports("github")).toBe(false);
    expect(strategy.supports("reddit")).toBe(false);
    expect(strategy.supports("generic")).toBe(false);
  });

  describe("extractVideoId", () => {
    it("extracts ID from standard watch URL", () => {
      expect(strategy.extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from watch URL without www", () => {
      expect(strategy.extractVideoId("https://youtube.com/watch?v=abc123")).toBe("abc123");
    });

    it("extracts ID from mobile URL", () => {
      expect(strategy.extractVideoId("https://m.youtube.com/watch?v=abc123")).toBe("abc123");
    });

    it("extracts ID from short URL", () => {
      expect(strategy.extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from embed URL", () => {
      expect(strategy.extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from shorts URL", () => {
      expect(strategy.extractVideoId("https://www.youtube.com/shorts/abcDEF123")).toBe("abcDEF123");
    });

    it("returns null for youtu.be with empty path", () => {
      expect(strategy.extractVideoId("https://youtu.be/")).toBeNull();
    });

    it("returns null for youtube.com without video ID", () => {
      expect(strategy.extractVideoId("https://www.youtube.com/")).toBeNull();
    });

    it("returns null for youtube.com channel URL", () => {
      expect(strategy.extractVideoId("https://www.youtube.com/c/SomeChannel")).toBeNull();
    });

    it("returns null for invalid URL", () => {
      expect(strategy.extractVideoId("not-a-url")).toBeNull();
    });

    it("returns null for non-youtube domain", () => {
      expect(strategy.extractVideoId("https://example.com/watch?v=abc")).toBeNull();
    });
  });

  describe("resolve", () => {
    it("resolves standard YouTube URL to thumbnail", async () => {
      const result = await strategy.resolve("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    });

    it("resolves short YouTube URL to thumbnail", async () => {
      const result = await strategy.resolve("https://youtu.be/dQw4w9WgXcQ");
      expect(result).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    });

    it("resolves embed YouTube URL to thumbnail", async () => {
      const result = await strategy.resolve("https://www.youtube.com/embed/dQw4w9WgXcQ");
      expect(result).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    });

    it("returns null for unrecognized YouTube URL", async () => {
      const result = await strategy.resolve("https://www.youtube.com/c/SomeChannel");
      expect(result).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// GitHubThumbnailStrategy
// ---------------------------------------------------------------------------
describe("GitHubThumbnailStrategy", () => {
  const strategy = new GitHubThumbnailStrategy();

  it("supports github source type", () => {
    expect(strategy.supports("github")).toBe(true);
  });

  it("does not support other source types", () => {
    expect(strategy.supports("youtube")).toBe(false);
    expect(strategy.supports("reddit")).toBe(false);
  });

  describe("extractOwnerRepo", () => {
    it("extracts owner/repo from standard URL", () => {
      expect(strategy.extractOwnerRepo("https://github.com/facebook/react"))
        .toEqual({ owner: "facebook", repo: "react" });
    });

    it("extracts owner/repo from URL with www", () => {
      expect(strategy.extractOwnerRepo("https://www.github.com/facebook/react"))
        .toEqual({ owner: "facebook", repo: "react" });
    });

    it("extracts owner/repo from deep URL (issue)", () => {
      expect(strategy.extractOwnerRepo("https://github.com/facebook/react/issues/123"))
        .toEqual({ owner: "facebook", repo: "react" });
    });

    it("extracts owner/repo from deep URL (tree)", () => {
      expect(strategy.extractOwnerRepo("https://github.com/facebook/react/tree/main/packages"))
        .toEqual({ owner: "facebook", repo: "react" });
    });

    it("returns null for github.com with only owner", () => {
      expect(strategy.extractOwnerRepo("https://github.com/facebook")).toBeNull();
    });

    it("returns null for github.com root", () => {
      expect(strategy.extractOwnerRepo("https://github.com/")).toBeNull();
    });

    it("returns null for non-github domain", () => {
      expect(strategy.extractOwnerRepo("https://gitlab.com/foo/bar")).toBeNull();
    });

    it("returns null for github.io domain", () => {
      expect(strategy.extractOwnerRepo("https://github.io/foo/bar")).toBeNull();
    });

    it("returns null for invalid URL", () => {
      expect(strategy.extractOwnerRepo("not-a-url")).toBeNull();
    });
  });

  describe("resolve", () => {
    it("resolves GitHub repo URL to OG image", async () => {
      const result = await strategy.resolve("https://github.com/facebook/react");
      expect(result).toBe("https://opengraph.githubassets.com/1/facebook/react");
    });

    it("resolves deep GitHub URL to repo-level OG image", async () => {
      const result = await strategy.resolve("https://github.com/facebook/react/issues/123");
      expect(result).toBe("https://opengraph.githubassets.com/1/facebook/react");
    });

    it("returns null for GitHub URL without repo", async () => {
      const result = await strategy.resolve("https://github.com/facebook");
      expect(result).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// ThumbnailService (orchestrator)
// ---------------------------------------------------------------------------
describe("ThumbnailService", () => {
  describe("with default strategies", () => {
    const service = new ThumbnailService([
      new YouTubeThumbnailStrategy(),
      new GitHubThumbnailStrategy(),
    ]);

    it("dispatches to YouTube strategy for youtube source type", async () => {
      const result = await service.resolveThumbnail(
        "https://www.youtube.com/watch?v=abc123",
        "youtube",
      );
      expect(result).toBe("https://img.youtube.com/vi/abc123/hqdefault.jpg");
    });

    it("dispatches to GitHub strategy for github source type", async () => {
      const result = await service.resolveThumbnail(
        "https://github.com/facebook/react",
        "github",
      );
      expect(result).toBe("https://opengraph.githubassets.com/1/facebook/react");
    });

    it("returns null for unknown source types (callers use ogMetadata.image)", async () => {
      const result = await service.resolveThumbnail(
        "https://reddit.com/r/programming/post/123",
        "reddit",
      );
      expect(result).toBeNull();
    });

    it("returns null when source type is null", async () => {
      const result = await service.resolveThumbnail(
        "https://example.com/page",
        null,
      );
      expect(result).toBeNull();
    });
  });

  describe("strategy returns null", () => {
    it("returns null when matched strategy returns null (no fallback)", async () => {
      const service = new ThumbnailService([
        new YouTubeThumbnailStrategy(),
      ]);

      // youtube.com/ without video ID — strategy returns null
      const result = await service.resolveThumbnail(
        "https://www.youtube.com/",
        "youtube",
      );
      expect(result).toBeNull();
    });
  });

  describe("error handling", () => {
    it("returns null if the matched strategy throws", async () => {
      const throwingStrategy: ThumbnailStrategy = {
        supports: () => true,
        resolve: vi.fn().mockRejectedValue(new Error("boom")),
      };
      const service = new ThumbnailService([throwingStrategy]);

      const result = await service.resolveThumbnail("https://example.com", "anything");
      expect(result).toBeNull();
    });
  });

  describe("custom strategies", () => {
    it("accepts custom strategies", async () => {
      const custom: ThumbnailStrategy = {
        supports: (st: string) => st === "vimeo",
        resolve: vi.fn().mockResolvedValue("https://vimeo.com/thumb.jpg"),
      };
      const service = new ThumbnailService([custom]);

      const result = await service.resolveThumbnail(
        "https://vimeo.com/123456",
        "vimeo",
      );
      expect(result).toBe("https://vimeo.com/thumb.jpg");
    });
  });
});

// ---------------------------------------------------------------------------
// Module-level exports
// ---------------------------------------------------------------------------
describe("module exports", () => {
  it("exports thumbnailService singleton", () => {
    expect(thumbnailService).toBeInstanceOf(ThumbnailService);
  });

  it("exports resolveThumbnail convenience function", () => {
    expect(typeof resolveThumbnail).toBe("function");
  });

  it("convenience function delegates to the singleton", async () => {
    // YouTube URL — should work via the singleton's default strategies
    const result = await resolveThumbnail(
      "https://www.youtube.com/watch?v=testId",
      "youtube",
    );
    expect(result).toBe("https://img.youtube.com/vi/testId/hqdefault.jpg");
  });
});
