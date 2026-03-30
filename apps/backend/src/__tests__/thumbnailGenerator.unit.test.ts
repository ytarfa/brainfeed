import { describe, it, expect } from "vitest";

import {
  ArticleThumbnailStrategy,
  ThumbnailGenerator,
} from "../services/thumbnailGenerator";
import type { OgMetadata } from "../services/ogFetcher";

/** Helper: creates a minimal OgMetadata with given overrides. */
function ogMeta(overrides: Partial<OgMetadata> = {}): OgMetadata {
  return {
    type: "article",
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

/**
 * Helper: creates a tiny 1x1 red PNG for testing image compositing.
 * This avoids needing a real image fetch in tests.
 */
function createTestPng(): Buffer {
  // Minimal valid 1x1 red PNG (67 bytes)
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAH" +
    "ggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64",
  );
}

/** Helper: mock fetch that returns a test PNG image. */
function mockImageFetch(): typeof fetch {
  return async (): Promise<Response> => {
    return new Response(createTestPng(), {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  };
}

/** Helper: mock fetch that fails. */
function mockFailingFetch(): typeof fetch {
  return async (): Promise<Response> => {
    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  };
}

describe("ArticleThumbnailStrategy", () => {
  describe("supports", () => {
    const strategy = new ArticleThumbnailStrategy();

    it("supports 'article' source type", () => {
      expect(strategy.supports("article")).toBe(true);
    });

    it("does not support 'github'", () => {
      expect(strategy.supports("github")).toBe(false);
    });

    it("does not support 'youtube'", () => {
      expect(strategy.supports("youtube")).toBe(false);
    });

    it("does not support 'generic'", () => {
      expect(strategy.supports("generic")).toBe(false);
    });
  });

  describe("generate with image", () => {
    it("returns a PNG buffer when og:image is available", async () => {
      const strategy = new ArticleThumbnailStrategy({ fetchFn: mockImageFetch() });
      const meta = ogMeta({
        title: "Test Article Title",
        image: "https://example.com/image.jpg",
        author: "Jane Doe",
        siteName: "Example Blog",
      });

      const result = await strategy.generate(meta);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Buffer);
      expect(result!.length).toBeGreaterThan(0);

      // Verify it starts with PNG magic bytes
      expect(result![0]).toBe(0x89);
      expect(result![1]).toBe(0x50); // P
      expect(result![2]).toBe(0x4e); // N
      expect(result![3]).toBe(0x47); // G
    });
  });

  describe("generate without image", () => {
    it("returns a PNG buffer with text-only layout when no og:image", async () => {
      const strategy = new ArticleThumbnailStrategy({ fetchFn: mockFailingFetch() });
      const meta = ogMeta({
        title: "Text Only Article",
        author: "John Smith",
      });

      const result = await strategy.generate(meta);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Buffer);
      // PNG magic bytes
      expect(result![0]).toBe(0x89);
    });

    it("returns a PNG buffer even when image fetch fails", async () => {
      const strategy = new ArticleThumbnailStrategy({ fetchFn: mockFailingFetch() });
      const meta = ogMeta({
        title: "Fallback Article",
        image: "https://example.com/missing.jpg",
      });

      const result = await strategy.generate(meta);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe("generate with minimal metadata", () => {
    it("uses 'Untitled Article' when title is null", async () => {
      const strategy = new ArticleThumbnailStrategy({ fetchFn: mockFailingFetch() });
      const result = await strategy.generate(ogMeta());

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Buffer);
    });

    it("handles very long titles gracefully", async () => {
      const strategy = new ArticleThumbnailStrategy({ fetchFn: mockFailingFetch() });
      const meta = ogMeta({
        title: "A".repeat(200),
      });

      const result = await strategy.generate(meta);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Buffer);
    });

    it("handles special characters in title", async () => {
      const strategy = new ArticleThumbnailStrategy({ fetchFn: mockFailingFetch() });
      const meta = ogMeta({
        title: 'Test <script>alert("xss")</script> & More',
      });

      const result = await strategy.generate(meta);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});

describe("ThumbnailGenerator", () => {
  describe("generate", () => {
    it("dispatches to ArticleThumbnailStrategy for 'article' type", async () => {
      const generator = new ThumbnailGenerator([
        new ArticleThumbnailStrategy({ fetchFn: mockFailingFetch() }),
      ]);
      const meta = ogMeta({ title: "Test" });
      const result = await generator.generate("article", meta);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Buffer);
    });

    it("returns null for unsupported source types", async () => {
      const generator = new ThumbnailGenerator([
        new ArticleThumbnailStrategy(),
      ]);
      const meta = ogMeta({ title: "Test" });
      const result = await generator.generate("github", meta);

      expect(result).toBeNull();
    });

    it("returns null when no strategies are registered", async () => {
      const generator = new ThumbnailGenerator([]);
      const meta = ogMeta({ title: "Test" });
      const result = await generator.generate("article", meta);

      expect(result).toBeNull();
    });
  });

  describe("module exports", () => {
    it("exports a singleton thumbnailGenerator instance", async () => {
      const { thumbnailGenerator } = await import("../services/thumbnailGenerator");
      expect(thumbnailGenerator).toBeInstanceOf(ThumbnailGenerator);
    });
  });
});
