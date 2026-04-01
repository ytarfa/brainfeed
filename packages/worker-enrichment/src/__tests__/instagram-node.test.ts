import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { EnrichedData } from "@brain-feed/types";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// Mocks — must be set up before importing the module under test
// ---------------------------------------------------------------------------

// Mock InstagramService
const mockClassifyUrl = vi.fn();
const mockExtract = vi.fn();
vi.mock("../services/instagram-service", async () => {
  const actual = await vi.importActual<typeof import("../services/instagram-service")>(
    "../services/instagram-service",
  );
  return {
    ...actual,
    InstagramService: {
      classifyUrl: (...args: unknown[]) => mockClassifyUrl(...args),
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

// Mock ArticleService (required since enrichment-graph imports it)
vi.mock("../services/article-service", async () => {
  const actual = await vi.importActual<typeof import("../services/article-service")>(
    "../services/article-service",
  );
  return {
    ...actual,
    ArticleService: {
      extract: vi.fn(),
    },
  };
});

// Now import module under test
import {
  _instagramNode as instagramNode,
  enrichmentGraph,
} from "../enrichment-graph";
import { InstagramSSRUnavailableError } from "../services/instagram-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBookmark(
  overrides: Partial<BookmarkForProcessing> = {},
): BookmarkForProcessing {
  return {
    id: "bk-instagram-test",
    url: "https://www.instagram.com/p/DWiUsgBjbBe/",
    title: "Instagram Post",
    content_type: "link",
    source_type: "instagram",
    raw_content: null,
    ...overrides,
  };
}

const defaultClassification = {
  instagramType: "post" as const,
  shortcode: "DWiUsgBjbBe",
};

const defaultExtractResult = {
  caption: "Google just released a warning for cryptocurrency.",
  username: "metav3rse",
  fullName: "Metav3rse is for the Culture",
  mediaType: "carousel" as const,
  carouselMediaCount: 7,
  accessibilityCaption: "Photo by Metav3rse on March 30, 2026. May be an image of text.",
  ogImage: "https://scontent-example.cdninstagram.com/image.jpg",
};

const defaultLLMResult = {
  summary: "Tech post about quantum computing threats to cryptocurrency.",
  entities: [{ name: "Google", type: "organization" }, { name: "metav3rse", type: "person" }],
  topics: ["cryptocurrency", "quantum computing", "cybersecurity"],
  tags: ["crypto", "quantum", "blockchain", "security", "google"],
};

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
// instagramNode — happy path
// ---------------------------------------------------------------------------

describe("instagramNode", () => {
  describe("full enrichment", () => {
    it("classifies URL, extracts content, and calls LLM", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce(defaultExtractResult);
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const result = await instagramNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const enriched = result.result as EnrichedData;

      expect(mockClassifyUrl).toHaveBeenCalledWith("https://www.instagram.com/p/DWiUsgBjbBe/");
      expect(mockExtract).toHaveBeenCalledWith("https://www.instagram.com/p/DWiUsgBjbBe/");
      expect(mockEnrichContent).toHaveBeenCalledWith(
        expect.stringContaining("Google just released a warning"),
        "instagram post",
      );

      expect(enriched.summary).toBe("Tech post about quantum computing threats to cryptocurrency.");
      expect(enriched.entities).toEqual(defaultLLMResult.entities);
      expect(enriched.topics).toEqual(defaultLLMResult.topics);
      expect(enriched.tags).toEqual(defaultLLMResult.tags);
      expect(enriched.processedAt).toBeTruthy();
    });

    it("includes accessibility caption in LLM content", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce(defaultExtractResult);
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      await instagramNode({ bookmark: makeBookmark(), result: null });

      const contentArg = mockEnrichContent.mock.calls[0][0] as string;
      expect(contentArg).toContain("Image description:");
      expect(contentArg).toContain("Photo by Metav3rse");
    });

    it("omits accessibility caption section when not available", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce({
        ...defaultExtractResult,
        accessibilityCaption: null,
      });
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      await instagramNode({ bookmark: makeBookmark(), result: null });

      const contentArg = mockEnrichContent.mock.calls[0][0] as string;
      expect(contentArg).not.toContain("Image description:");
    });

    it("uses 'instagram reel' as content type for reels", async () => {
      mockClassifyUrl.mockReturnValueOnce({
        instagramType: "reel",
        shortcode: "DWiTx5IgYHE",
      });
      mockExtract.mockResolvedValueOnce(defaultExtractResult);
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      await instagramNode({
        bookmark: makeBookmark({
          url: "https://www.instagram.com/reel/DWiTx5IgYHE/",
        }),
        result: null,
      });

      expect(mockEnrichContent).toHaveBeenCalledWith(
        expect.any(String),
        "instagram reel",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Metadata
  // ---------------------------------------------------------------------------

  describe("metadata", () => {
    it("includes instagramType, shortcode, username, mediaType, carouselMediaCount", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce(defaultExtractResult);
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const result = await instagramNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const enriched = result.result as EnrichedData;
      const meta = enriched.metadata!;

      expect(meta.instagramType).toBe("post");
      expect(meta.shortcode).toBe("DWiUsgBjbBe");
      expect(meta.username).toBe("metav3rse");
      expect(meta.mediaType).toBe("carousel");
      expect(meta.carouselMediaCount).toBe(7);
      expect(meta.hasAccessibilityCaption).toBe("true");
    });

    it("omits username when not available", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce({
        ...defaultExtractResult,
        username: null,
      });
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const result = await instagramNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const meta = result.result!.metadata!;

      expect(meta).not.toHaveProperty("username");
    });

    it("omits mediaType when not available", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce({
        ...defaultExtractResult,
        mediaType: null,
      });
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const result = await instagramNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const meta = result.result!.metadata!;

      expect(meta).not.toHaveProperty("mediaType");
    });

    it("omits carouselMediaCount when null", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce({
        ...defaultExtractResult,
        carouselMediaCount: null,
      });
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const result = await instagramNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const meta = result.result!.metadata!;

      expect(meta).not.toHaveProperty("carouselMediaCount");
    });

    it("marks hasAccessibilityCaption as false when missing", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce({
        ...defaultExtractResult,
        accessibilityCaption: null,
      });
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const result = await instagramNode({
        bookmark: makeBookmark(),
        result: null,
      });
      const meta = result.result!.metadata!;

      expect(meta.hasAccessibilityCaption).toBe("false");
    });
  });

  // ---------------------------------------------------------------------------
  // Error cases
  // ---------------------------------------------------------------------------

  describe("error handling", () => {
    it("throws when URL classification returns null (unrecognized sub-type)", async () => {
      mockClassifyUrl.mockReturnValueOnce(null);

      await expect(
        instagramNode({ bookmark: makeBookmark(), result: null }),
      ).rejects.toThrow("unrecognized Instagram URL sub-type");
    });

    it("re-throws InstagramSSRUnavailableError from extract", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockRejectedValueOnce(
        new InstagramSSRUnavailableError("Instagram did not return SSR HTML"),
      );

      await expect(
        instagramNode({ bookmark: makeBookmark(), result: null }),
      ).rejects.toThrow(InstagramSSRUnavailableError);
    });

    it("re-throws LLM errors (no fallback)", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce(defaultExtractResult);
      mockEnrichContent.mockRejectedValueOnce(new Error("LLM rate limited"));

      await expect(
        instagramNode({ bookmark: makeBookmark(), result: null }),
      ).rejects.toThrow("LLM rate limited");
    });

    it("re-throws network errors from extract", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockRejectedValueOnce(new Error("fetch failed"));

      await expect(
        instagramNode({ bookmark: makeBookmark(), result: null }),
      ).rejects.toThrow("fetch failed");
    });
  });

  // ---------------------------------------------------------------------------
  // Integration via enrichmentGraph
  // ---------------------------------------------------------------------------

  describe("via enrichmentGraph", () => {
    it("routes instagram source_type to instagramNode", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce(defaultExtractResult);
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const output = await enrichmentGraph.invoke({
        bookmark: makeBookmark({ source_type: "instagram" }),
        result: null,
      });

      expect(mockClassifyUrl).toHaveBeenCalled();
      expect(mockExtract).toHaveBeenCalled();
      expect(output.result).toBeTruthy();
      expect(output.result!.summary).toBe("Tech post about quantum computing threats to cryptocurrency.");
    });

    it("routes instagram.com URL (no source_type) to instagramNode", async () => {
      mockClassifyUrl.mockReturnValueOnce(defaultClassification);
      mockExtract.mockResolvedValueOnce(defaultExtractResult);
      mockEnrichContent.mockResolvedValueOnce(defaultLLMResult);

      const output = await enrichmentGraph.invoke({
        bookmark: makeBookmark({
          source_type: null,
          url: "https://www.instagram.com/p/DWiUsgBjbBe/",
        }),
        result: null,
      });

      expect(mockClassifyUrl).toHaveBeenCalled();
      expect(output.result).toBeTruthy();
    });
  });
});
