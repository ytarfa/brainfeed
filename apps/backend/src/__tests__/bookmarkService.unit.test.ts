import { describe, it, expect } from "vitest";

import { BookmarkService } from "../services/bookmarkService";
import type { SourceTypeStrategy } from "../services/sourceTypeStrategy";

describe("BookmarkService", () => {
  describe("detectSourceType with default strategies", () => {
    const service = new BookmarkService();

    it("detects github.com URLs", () => {
      expect(service.detectSourceType("https://github.com/user/repo")).toBe("github");
    });

    it("detects youtube.com URLs", () => {
      expect(service.detectSourceType("https://youtube.com/watch?v=abc")).toBe("youtube");
    });

    it("detects youtu.be short URLs", () => {
      expect(service.detectSourceType("https://youtu.be/abc123")).toBe("youtube");
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
          hostname === "custom.io" ? "github" : null,
      };
      const service = new BookmarkService([customStrategy]);
      expect(service.detectSourceType("https://custom.io/page")).toBe("github");
    });

    it("falls back to later strategies when first returns null", () => {
      const noopStrategy: SourceTypeStrategy = {
        detect: () => null,
      };
      const catchAllStrategy: SourceTypeStrategy = {
        detect: () => "generic",
      };
      const service = new BookmarkService([noopStrategy, catchAllStrategy]);
      expect(service.detectSourceType("https://anything.com")).toBe("generic");
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
        detect: () => "youtube",
      };
      const secondStrategy: SourceTypeStrategy = {
        detect: () => "github",
      };
      const service = new BookmarkService([firstStrategy, secondStrategy]);
      expect(service.detectSourceType("https://example.com")).toBe("youtube");
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
