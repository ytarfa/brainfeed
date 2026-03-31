import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { EnrichedData } from "@brain-feed/types";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// Mocks — must be set up before importing the module under test
// ---------------------------------------------------------------------------

// Mock ArticleService
const mockExtract = vi.fn();
vi.mock("../services/article-service", async () => {
  const actual = await vi.importActual<typeof import("../services/article-service")>(
    "../services/article-service",
  );
  return {
    ...actual,
    ArticleService: {
      extract: (...args: unknown[]) => mockExtract(...args),
    },
  };
});

// Mock enrichContent
const mockEnrichContent = vi.fn();
vi.mock("../services/llm", () => ({
  enrichContent: (...args: unknown[]) => mockEnrichContent(...args),
}));

// Mock YoutubeLoader (required since enrichment-graph imports it)
vi.mock("@langchain/community/document_loaders/web/youtube", () => ({
  YoutubeLoader: {
    createFromUrl: vi.fn(() => ({ load: vi.fn() })),
  },
}));

// Mock YouTubeService (required since enrichment-graph imports it)
vi.mock("../services/youtube-service", async () => {
  const actual = await vi.importActual<typeof import("../services/youtube-service")>(
    "../services/youtube-service",
  );
  const MockYouTubeService = vi.fn().mockImplementation(() => ({}));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (MockYouTubeService as any).classifyYouTubeUrl = actual.YouTubeService.classifyYouTubeUrl;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (MockYouTubeService as any).extractVideoId = actual.YouTubeService.extractVideoId;
  return { ...actual, YouTubeService: MockYouTubeService };
});

// Now import module under test
import {
  _articleNode as articleNode,
  enrichmentGraph,
} from "../enrichment-graph";
import { UnsupportedContentError } from "../services/article-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBookmark(
  overrides: Partial<BookmarkForProcessing> = {},
): BookmarkForProcessing {
  return {
    id: "bk-article-test",
    url: "https://example.com/great-article",
    title: "Test Article",
    content_type: "link",
    source_type: "article",
    raw_content: null,
    ...overrides,
  };
}

const defaultLLMResult = {
  summary: "An article about testing.",
  entities: [{ name: "Vitest", type: "technology" }],
  topics: ["testing", "javascript"],
  tags: ["test", "article", "vitest"],
};

function makeExtractResult(overrides: Record<string, unknown> = {}) {
  return {
    title: "My Article Title",
    byline: "Jane Doe",
    siteName: "Example Blog",
    content: "This is the extracted article content. It covers many topics in depth.",
    excerpt: "A brief excerpt of the article.",
    lang: "en",
    publishedTime: "2024-06-01T12:00:00Z",
    ogImage: "https://example.com/og-image.jpg",
    wordCount: 500,
    readingTimeMinutes: 3,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GOOGLE_API_KEY = "test-key";
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// articleNode — full enrichment (happy path)
// ---------------------------------------------------------------------------

describe("articleNode", () => {
  describe("full enrichment", () => {
    it("extracts article and calls LLM for enrichment", async () => {
      mockExtract.mockResolvedValueOnce(makeExtractResult());
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const result = await articleNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const enriched = result.result as EnrichedData;

      expect(mockExtract).toHaveBeenCalledWith("https://example.com/great-article");
      expect(mockEnrichContent).toHaveBeenCalledWith(
        expect.stringContaining("This is the extracted article content"),
        "article",
      );

      expect(enriched.summary).toBe("An article about testing.");
      expect(enriched.entities).toEqual([{ name: "Vitest", type: "technology" }]);
      expect(enriched.topics).toEqual(["testing", "javascript"]);
      expect(enriched.tags).toEqual(["test", "article", "vitest"]);
      expect(enriched.metadata).toEqual(
        expect.objectContaining({
          title: "My Article Title",
          author: "Jane Doe",
          siteName: "Example Blog",
          publishedAt: "2024-06-01T12:00:00Z",
          language: "en",
          ogImage: "https://example.com/og-image.jpg",
          wordCount: 500,
          readingTimeMinutes: 3,
        }),
      );
      expect(enriched.processedAt).toBeTruthy();
    });

    it("omits metadata fields that are null", async () => {
      mockExtract.mockResolvedValueOnce(
        makeExtractResult({
          byline: null,
          siteName: null,
          publishedTime: null,
          lang: null,
          ogImage: null,
        }),
      );
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const result = await articleNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const enriched = result.result as EnrichedData;
      const meta = enriched.metadata!;

      expect(meta.title).toBe("My Article Title");
      expect(meta).not.toHaveProperty("author");
      expect(meta).not.toHaveProperty("siteName");
      expect(meta).not.toHaveProperty("publishedAt");
      expect(meta).not.toHaveProperty("language");
      expect(meta).not.toHaveProperty("ogImage");
    });
  });

  // ---------------------------------------------------------------------------
  // Thin enrichment (no content extracted)
  // ---------------------------------------------------------------------------

  describe("thin enrichment (no content)", () => {
    it("returns excerpt and metadata when content is empty", async () => {
      mockExtract.mockResolvedValueOnce(
        makeExtractResult({
          content: null,
          excerpt: "OG description as fallback",
        }),
      );

      const result = await articleNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const enriched = result.result as EnrichedData;

      // LLM should NOT be called
      expect(mockEnrichContent).not.toHaveBeenCalled();

      expect(enriched.summary).toBe("OG description as fallback");
      expect(enriched.entities).toEqual([]);
      expect(enriched.topics).toEqual([]);
      expect(enriched.tags).toEqual([]);
      expect(enriched.metadata).toEqual(
        expect.objectContaining({ title: "My Article Title" }),
      );
    });

    it("returns excerpt and metadata when content is whitespace-only", async () => {
      mockExtract.mockResolvedValueOnce(
        makeExtractResult({
          content: "   \n\t  ",
          excerpt: "Fallback excerpt",
        }),
      );

      const result = await articleNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const enriched = result.result as EnrichedData;

      expect(mockEnrichContent).not.toHaveBeenCalled();
      expect(enriched.summary).toBe("Fallback excerpt");
    });
  });

  // ---------------------------------------------------------------------------
  // LLM failure fallback
  // ---------------------------------------------------------------------------

  describe("LLM failure fallback", () => {
    it("returns metadata + excerpt when LLM throws", async () => {
      mockExtract.mockResolvedValueOnce(
        makeExtractResult({
          excerpt: "Readability excerpt as fallback",
        }),
      );
      mockEnrichContent.mockRejectedValueOnce(new Error("LLM timeout"));

      const result = await articleNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const enriched = result.result as EnrichedData;

      expect(enriched.summary).toBe("Readability excerpt as fallback");
      expect(enriched.entities).toEqual([]);
      expect(enriched.topics).toEqual([]);
      expect(enriched.tags).toEqual([]);
      // Metadata should still be present
      expect(enriched.metadata).toEqual(
        expect.objectContaining({
          title: "My Article Title",
          wordCount: 500,
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Unsupported content
  // ---------------------------------------------------------------------------

  describe("unsupported content", () => {
    it("returns unsupported marker for non-HTML content", async () => {
      mockExtract.mockRejectedValueOnce(
        new UnsupportedContentError("Non-HTML content type: application/pdf", {
          url: "https://example.com/doc.pdf",
          contentType: "application/pdf",
        }),
      );

      const result = await articleNode({
        bookmark: makeBookmark({ url: "https://example.com/doc.pdf" }),
        result: null,
      });
      const enriched = result.result as EnrichedData;

      expect(enriched.summary).toBeNull();
      expect(enriched.entities).toEqual([]);
      expect(enriched.topics).toEqual([]);
      expect(enriched.tags).toEqual([]);
      expect(enriched.metadata).toEqual({ unsupported: "true" });
    });
  });

  // ---------------------------------------------------------------------------
  // Fetch errors (re-thrown for processor)
  // ---------------------------------------------------------------------------

  describe("fetch errors", () => {
    it("re-throws fetch errors for the processor to handle", async () => {
      mockExtract.mockRejectedValueOnce(
        new Error("Failed to fetch article: HTTP 500 Internal Server Error"),
      );

      await expect(
        articleNode({ bookmark: makeBookmark(), result: null }),
      ).rejects.toThrow("Failed to fetch article: HTTP 500");
    });

    it("re-throws network errors", async () => {
      mockExtract.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        articleNode({ bookmark: makeBookmark(), result: null }),
      ).rejects.toThrow("Network error");
    });
  });

  // ---------------------------------------------------------------------------
  // Integration via enrichmentGraph
  // ---------------------------------------------------------------------------

  describe("via enrichmentGraph", () => {
    it("routes article source_type to articleNode", async () => {
      mockExtract.mockResolvedValueOnce(makeExtractResult());
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const output = await enrichmentGraph.invoke({
        bookmark: makeBookmark({ source_type: "article" }),
        result: null,
      });

      expect(mockExtract).toHaveBeenCalled();
      expect(output.result).toBeTruthy();
      expect(output.result!.summary).toBe("An article about testing.");
    });

    it("routes HTTP URLs without known pattern to articleNode", async () => {
      mockExtract.mockResolvedValueOnce(makeExtractResult());
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const output = await enrichmentGraph.invoke({
        bookmark: makeBookmark({
          source_type: null,
          url: "https://blog.example.com/some-post",
        }),
        result: null,
      });

      expect(mockExtract).toHaveBeenCalled();
      expect(output.result).toBeTruthy();
    });
  });
});
