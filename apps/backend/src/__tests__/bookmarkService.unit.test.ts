import { describe, it, expect } from "vitest";

import { BookmarkService } from "../services/bookmarkService";
import type { SourceTypeStrategy } from "../services/sourceTypeStrategy";

describe("BookmarkService", () => {
  describe("detectSourceType with default strategies", () => {
    const service = new BookmarkService();

    it("returns 'manual' when no URL is provided", () => {
      expect(service.detectSourceType()).toBe("manual");
      expect(service.detectSourceType(undefined)).toBe("manual");
    });

    it("returns 'manual' for empty string URL", () => {
      expect(service.detectSourceType("")).toBe("manual");
    });

    it("detects github.com URLs", () => {
      expect(service.detectSourceType("https://github.com/user/repo")).toBe("github");
    });

    it("detects youtube.com URLs", () => {
      expect(service.detectSourceType("https://youtube.com/watch?v=abc")).toBe("youtube");
    });

    it("detects youtu.be short URLs", () => {
      expect(service.detectSourceType("https://youtu.be/abc123")).toBe("youtube");
    });

    it("detects twitter.com URLs", () => {
      expect(service.detectSourceType("https://twitter.com/user/status/123")).toBe("twitter");
    });

    it("detects x.com URLs", () => {
      expect(service.detectSourceType("https://x.com/user/status/123")).toBe("twitter");
    });

    it("detects instagram.com URLs", () => {
      expect(service.detectSourceType("https://instagram.com/p/abc")).toBe("instagram");
    });

    it("detects reddit.com URLs", () => {
      expect(service.detectSourceType("https://reddit.com/r/test")).toBe("reddit");
    });

    it("detects amazon.com URLs", () => {
      expect(service.detectSourceType("https://amazon.com/dp/B123")).toBe("amazon");
    });

    it("detects arxiv.org URLs", () => {
      expect(service.detectSourceType("https://arxiv.org/abs/1234.5678")).toBe("academic");
    });

    it("detects scholar.google.com URLs", () => {
      expect(service.detectSourceType("https://scholar.google.com/scholar?q=test")).toBe("academic");
    });

    it("strips www. prefix before matching", () => {
      expect(service.detectSourceType("https://www.github.com/user/repo")).toBe("github");
      expect(service.detectSourceType("https://www.youtube.com/watch?v=abc")).toBe("youtube");
    });

    it("returns 'generic' for unknown URLs", () => {
      expect(service.detectSourceType("https://example.com/page")).toBe("generic");
    });

    it("returns 'generic' for invalid URLs", () => {
      expect(service.detectSourceType("not-a-url")).toBe("generic");
    });
  });

  describe("custom strategy chain", () => {
    it("uses a custom strategy that matches first", () => {
      const customStrategy: SourceTypeStrategy = {
        detect: (hostname: string) =>
          hostname === "custom.io" ? "custom-source" : null,
      };
      const service = new BookmarkService([customStrategy]);
      expect(service.detectSourceType("https://custom.io/page")).toBe("custom-source");
    });

    it("falls back to later strategies when first returns null", () => {
      const noopStrategy: SourceTypeStrategy = {
        detect: () => null,
      };
      const catchAllStrategy: SourceTypeStrategy = {
        detect: () => "catch-all",
      };
      const service = new BookmarkService([noopStrategy, catchAllStrategy]);
      expect(service.detectSourceType("https://anything.com")).toBe("catch-all");
    });

    it("returns 'generic' when no custom strategy matches", () => {
      const noopStrategy: SourceTypeStrategy = {
        detect: () => null,
      };
      const service = new BookmarkService([noopStrategy]);
      expect(service.detectSourceType("https://example.com")).toBe("generic");
    });

    it("stops at the first matching strategy", () => {
      const firstStrategy: SourceTypeStrategy = {
        detect: () => "first",
      };
      const secondStrategy: SourceTypeStrategy = {
        detect: () => "second",
      };
      const service = new BookmarkService([firstStrategy, secondStrategy]);
      expect(service.detectSourceType("https://example.com")).toBe("first");
    });

    it("handles an empty strategy array by returning 'generic'", () => {
      const service = new BookmarkService([]);
      expect(service.detectSourceType("https://example.com")).toBe("generic");
    });
  });

  describe("singleton export", () => {
    it("exports a pre-configured bookmarkService singleton", async () => {
      const { bookmarkService } = await import("../services/bookmarkService");
      expect(bookmarkService).toBeInstanceOf(BookmarkService);
      expect(bookmarkService.detectSourceType("https://github.com/test")).toBe("github");
    });
  });
});
