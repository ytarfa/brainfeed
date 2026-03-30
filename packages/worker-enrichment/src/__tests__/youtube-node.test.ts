import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { EnrichedData } from "@brain-feed/types";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// Mocks — must be set up before importing the module under test
// ---------------------------------------------------------------------------

// Mock YoutubeLoader
const mockLoaderLoad = vi.fn();
vi.mock("@langchain/community/document_loaders/web/youtube", () => ({
  YoutubeLoader: {
    createFromUrl: vi.fn(() => ({
      load: mockLoaderLoad,
    })),
  },
}));

// Mock enrichContent
const mockEnrichContent = vi.fn();
vi.mock("../services/llm", () => ({
  enrichContent: (...args: unknown[]) => mockEnrichContent(...args),
}));

// Mock YouTubeService (instance methods)
const mockGetVideo = vi.fn();
const mockGetChannel = vi.fn();
const mockGetChannelByHandle = vi.fn();
const mockGetPlaylist = vi.fn();
const mockGetPlaylistItems = vi.fn();

vi.mock("../services/youtube-service", async () => {
  const actual = await vi.importActual<typeof import("../services/youtube-service")>("../services/youtube-service");

  // Create a mock constructor that returns mock instance methods
  // but preserves all static methods from the real class
  const MockYouTubeService = vi.fn().mockImplementation(() => ({
    getVideo: mockGetVideo,
    getChannel: mockGetChannel,
    getChannelByHandle: mockGetChannelByHandle,
    getPlaylist: mockGetPlaylist,
    getPlaylistItems: mockGetPlaylistItems,
  }));

  // Copy over static methods from the real class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (MockYouTubeService as any).classifyYouTubeUrl = actual.YouTubeService.classifyYouTubeUrl;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (MockYouTubeService as any).extractVideoId = actual.YouTubeService.extractVideoId;

  return {
    ...actual,
    YouTubeService: MockYouTubeService,
  };
});

// Now import module under test — uses the mocked dependencies
import {
  _enrichVideo as enrichVideo,
  _enrichChannel as enrichChannel,
  _enrichPlaylist as enrichPlaylist,
  _truncateTranscript as truncateTranscript,
  enrichmentGraph,
} from "../enrichment-graph";

import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBookmark(
  overrides: Partial<BookmarkForProcessing> = {},
): BookmarkForProcessing {
  return {
    id: "bk-yt-test",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Test YouTube Video",
    content_type: "link",
    source_type: "youtube",
    raw_content: null,
    ...overrides,
  };
}

const defaultLLMResult = {
  summary: "A test summary.",
  entities: [{ name: "Test", type: "concept" }],
  topics: ["testing"],
  tags: ["test", "vitest"],
};

function mockVideoResponse(overrides: Record<string, unknown> = {}) {
  return {
    snippet: {
      title: "Never Gonna Give You Up",
      description: "The official video for Rick Astley.",
      channelTitle: "Rick Astley",
      publishedAt: "2009-10-25T06:57:33Z",
      tags: ["rick", "astley"],
      thumbnails: {},
      channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
      categoryId: "10",
      liveBroadcastContent: "none",
    },
    statistics: {
      viewCount: "1500000000",
      likeCount: "15000000",
      favoriteCount: "0",
      commentCount: "3000000",
    },
    contentDetails: {
      duration: "PT3M33S",
      dimension: "2d",
      definition: "hd",
      caption: "true",
      licensedContent: true,
      projection: "rectangular",
    },
    ...overrides,
  };
}

function mockChannelResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: "UCuAXFkgsw1L7xaCfnd5JJOw",
    snippet: {
      title: "Rick Astley",
      description: "Official channel of Rick Astley.",
      customUrl: "@RickAstley",
      publishedAt: "2006-09-23T00:00:00Z",
      thumbnails: {},
      country: "GB",
    },
    statistics: {
      viewCount: "3000000000",
      subscriberCount: "5000000",
      hiddenSubscriberCount: false,
      videoCount: "150",
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("truncateTranscript", () => {
  it("returns text unchanged when under the limit", () => {
    expect(truncateTranscript("short text", 100)).toBe("short text");
  });

  it("truncates and appends marker when over the limit", () => {
    const long = "a".repeat(200);
    const result = truncateTranscript(long, 50);
    expect(result).toHaveLength(50 + "\n\n[Transcript truncated]".length);
    expect(result).toContain("[Transcript truncated]");
    expect(result.startsWith("a".repeat(50))).toBe(true);
  });

  it("handles exact boundary", () => {
    const exact = "a".repeat(100);
    expect(truncateTranscript(exact, 100)).toBe(exact);
  });
});

describe("enrichVideo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_API_KEY = "test-api-key";
    mockEnrichContent.mockResolvedValue(defaultLLMResult);
  });

  afterEach(() => {
    delete process.env.GOOGLE_API_KEY;
  });

  it("enriches a video with transcript and metadata", async () => {
    mockGetVideo.mockResolvedValue(mockVideoResponse());
    mockLoaderLoad.mockResolvedValue([
      { pageContent: "Hello everyone, welcome to the video." },
    ]);

    const result = await enrichVideo(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "dQw4w9WgXcQ",
      "Test Title",
    );

    // Verify YoutubeLoader was called
    expect(YoutubeLoader.createFromUrl).toHaveBeenCalledWith(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      { language: "en", addVideoInfo: false },
    );

    // Verify enrichContent was called with transcript content
    expect(mockEnrichContent).toHaveBeenCalledTimes(1);
    const [content, contentType] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Never Gonna Give You Up");
    expect(content).toContain("Hello everyone, welcome to the video.");
    expect(contentType).toBe("YouTube video transcript");

    // Verify result structure
    expect(result.summary).toBe("A test summary.");
    expect(result.entities).toEqual([{ name: "Test", type: "concept" }]);
    expect(result.topics).toEqual(["testing"]);
    expect(result.tags).toEqual(["test", "vitest"]);
    expect(result.processedAt).toBeDefined();

    // Verify metadata
    expect(result.metadata).toBeDefined();
    const meta = result.metadata!;
    expect(meta.videoId).toBe("dQw4w9WgXcQ");
    expect(meta.title).toBe("Never Gonna Give You Up");
    expect(meta.transcriptAvailable).toBe("true");
    expect(meta.channelTitle).toBe("Rick Astley");
    expect(meta.viewCount).toBe("1500000000");
    expect(meta.likeCount).toBe("15000000");
    expect(meta.duration).toBe("3:33");
    expect(meta.durationSeconds).toBe(213);
    expect(meta.publishedAt).toBe("2009-10-25T06:57:33Z");
  });

  it("falls back to title+description when transcript fails", async () => {
    mockGetVideo.mockResolvedValue(mockVideoResponse());
    mockLoaderLoad.mockRejectedValue(new Error("Captions disabled"));

    const result = await enrichVideo(
      "https://www.youtube.com/watch?v=abc123",
      "abc123",
      "Fallback Title",
    );

    // Verify enrichContent was called with description instead of transcript
    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Never Gonna Give You Up");
    expect(content).toContain("The official video for Rick Astley.");
    expect(content).not.toContain("Transcript:");

    expect(result.metadata!.transcriptAvailable).toBe("false");
  });

  it("falls back when transcript is empty", async () => {
    mockGetVideo.mockResolvedValue(mockVideoResponse());
    mockLoaderLoad.mockResolvedValue([{ pageContent: "   " }]);

    const result = await enrichVideo(
      "https://www.youtube.com/watch?v=abc123",
      "abc123",
      null,
    );

    expect(result.metadata!.transcriptAvailable).toBe("false");
  });

  it("uses bookmark title when API returns no snippet", async () => {
    mockGetVideo.mockResolvedValue(null);
    mockLoaderLoad.mockRejectedValue(new Error("Not found"));

    await enrichVideo(
      "https://www.youtube.com/watch?v=missing",
      "missing",
      "My Saved Video",
    );

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("My Saved Video");
  });

  it("uses 'Unknown video' when no title available", async () => {
    mockGetVideo.mockResolvedValue(null);
    mockLoaderLoad.mockRejectedValue(new Error("Not found"));

    await enrichVideo(
      "https://www.youtube.com/watch?v=missing",
      "missing",
      null,
    );

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Unknown video");
  });

  it("handles missing statistics gracefully", async () => {
    mockGetVideo.mockResolvedValue(
      mockVideoResponse({ statistics: undefined }),
    );
    mockLoaderLoad.mockResolvedValue([{ pageContent: "Some transcript" }]);

    const result = await enrichVideo(
      "https://www.youtube.com/watch?v=abc",
      "abc",
      null,
    );

    expect(result.metadata!.viewCount).toBeUndefined();
    expect(result.metadata!.likeCount).toBeUndefined();
  });

  it("handles missing contentDetails (no duration)", async () => {
    mockGetVideo.mockResolvedValue(
      mockVideoResponse({ contentDetails: undefined }),
    );
    mockLoaderLoad.mockResolvedValue([{ pageContent: "Some transcript" }]);

    const result = await enrichVideo(
      "https://www.youtube.com/watch?v=abc",
      "abc",
      null,
    );

    expect(result.metadata!.duration).toBeUndefined();
    expect(result.metadata!.durationSeconds).toBeUndefined();
  });

  it("sets summary to null when LLM returns empty string", async () => {
    mockGetVideo.mockResolvedValue(mockVideoResponse());
    mockLoaderLoad.mockResolvedValue([{ pageContent: "Some transcript" }]);
    mockEnrichContent.mockResolvedValue({
      ...defaultLLMResult,
      summary: "",
    });

    const result = await enrichVideo(
      "https://www.youtube.com/watch?v=abc",
      "abc",
      null,
    );

    expect(result.summary).toBeNull();
  });
});

describe("enrichChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_API_KEY = "test-api-key";
    mockEnrichContent.mockResolvedValue(defaultLLMResult);
  });

  afterEach(() => {
    delete process.env.GOOGLE_API_KEY;
  });

  it("enriches a channel by handle", async () => {
    mockGetChannelByHandle.mockResolvedValue(mockChannelResponse());

    const result = await enrichChannel("@RickAstley");

    expect(mockGetChannelByHandle).toHaveBeenCalledWith("@RickAstley");
    expect(mockGetChannel).not.toHaveBeenCalled();

    const [content, contentType] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Channel: Rick Astley");
    expect(content).toContain("Official channel of Rick Astley.");
    expect(content).toContain("Subscribers: 5000000");
    expect(contentType).toBe("YouTube channel");

    expect(result.metadata!.channelId).toBe("UCuAXFkgsw1L7xaCfnd5JJOw");
    expect(result.metadata!.channelTitle).toBe("Rick Astley");
    expect(result.metadata!.subscriberCount).toBe("5000000");
    expect(result.metadata!.videoCount).toBe("150");
    expect(result.metadata!.viewCount).toBe("3000000000");
    expect(result.metadata!.country).toBe("GB");
    expect(result.metadata!.customUrl).toBe("@RickAstley");
  });

  it("enriches a channel by ID", async () => {
    mockGetChannel.mockResolvedValue(mockChannelResponse());

    const result = await enrichChannel("UCuAXFkgsw1L7xaCfnd5JJOw");

    expect(mockGetChannel).toHaveBeenCalledWith("UCuAXFkgsw1L7xaCfnd5JJOw");
    expect(mockGetChannelByHandle).not.toHaveBeenCalled();

    expect(result.metadata!.channelId).toBe("UCuAXFkgsw1L7xaCfnd5JJOw");
  });

  it("handles channel not found", async () => {
    mockGetChannel.mockResolvedValue(null);

    const result = await enrichChannel("UCnonexistent");

    // Should use the identifier as fallback title
    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Channel: UCnonexistent");

    expect(result.metadata!.channelTitle).toBe("UCnonexistent");
    expect(result.metadata!.channelId).toBeUndefined();
  });

  it("handles channel with no statistics", async () => {
    mockGetChannelByHandle.mockResolvedValue(
      mockChannelResponse({ statistics: undefined }),
    );

    const result = await enrichChannel("@NoStats");

    expect(result.metadata!.subscriberCount).toBeUndefined();
    expect(result.metadata!.videoCount).toBeUndefined();
    expect(result.metadata!.viewCount).toBeUndefined();
  });
});

describe("enrichPlaylist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_API_KEY = "test-api-key";
    mockEnrichContent.mockResolvedValue(defaultLLMResult);
  });

  afterEach(() => {
    delete process.env.GOOGLE_API_KEY;
  });

  it("enriches a playlist with metadata and item titles", async () => {
    mockGetPlaylist.mockResolvedValue({
      id: "PLtest123",
      snippet: {
        title: "My Playlist",
        description: "A curated list of videos.",
        channelTitle: "Creator",
        publishedAt: "2024-01-01T00:00:00Z",
        thumbnails: {},
      },
      contentDetails: { itemCount: 10 },
    });
    mockGetPlaylistItems.mockResolvedValue({
      items: [
        { snippet: { title: "Video One" } },
        { snippet: { title: "Video Two" } },
        { snippet: { title: "Video Three" } },
      ],
    });

    const result = await enrichPlaylist("PLtest123");

    expect(mockGetPlaylist).toHaveBeenCalledWith("PLtest123");
    expect(mockGetPlaylistItems).toHaveBeenCalledWith("PLtest123", 25);

    const [content, contentType] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Playlist: My Playlist");
    expect(content).toContain("A curated list of videos.");
    expect(content).toContain("1. Video One");
    expect(content).toContain("2. Video Two");
    expect(content).toContain("3. Video Three");
    expect(contentType).toBe("YouTube playlist");

    expect(result.metadata!.playlistId).toBe("PLtest123");
    expect(result.metadata!.title).toBe("My Playlist");
    expect(result.metadata!.itemCount).toBe(10);
    expect(result.metadata!.channelTitle).toBe("Creator");
    expect(result.metadata!.publishedAt).toBe("2024-01-01T00:00:00Z");
  });

  it("handles playlist not found", async () => {
    mockGetPlaylist.mockResolvedValue(null);
    mockGetPlaylistItems.mockResolvedValue({ items: [] });

    const result = await enrichPlaylist("PLnotfound");

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Playlist: Unknown playlist");

    expect(result.metadata!.title).toBe("Unknown playlist");
    expect(result.metadata!.itemCount).toBe(0);
  });

  it("handles playlist with no items", async () => {
    mockGetPlaylist.mockResolvedValue({
      id: "PLempty",
      snippet: {
        title: "Empty Playlist",
        description: "",
        channelTitle: "Creator",
        publishedAt: "2024-01-01T00:00:00Z",
        thumbnails: {},
      },
      contentDetails: { itemCount: 0 },
    });
    mockGetPlaylistItems.mockResolvedValue({ items: [] });

    await enrichPlaylist("PLempty");

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Playlist: Empty Playlist");
    expect(content).not.toContain("Videos in playlist:");
  });

  it("filters out items with missing snippets", async () => {
    mockGetPlaylist.mockResolvedValue({
      id: "PLmixed",
      snippet: {
        title: "Mixed Playlist",
        description: "",
        thumbnails: {},
      },
      contentDetails: { itemCount: 3 },
    });
    mockGetPlaylistItems.mockResolvedValue({
      items: [
        { snippet: { title: "Has Title" } },
        { snippet: undefined },
        { snippet: { title: "" } },
      ],
    });

    await enrichPlaylist("PLmixed");

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("1. Has Title");
    // Empty string title should be filtered by the !!t check
    expect(content).not.toContain("2. ");
  });
});

// ---------------------------------------------------------------------------
// youtubeNode integration (via enrichmentGraph)
// ---------------------------------------------------------------------------

describe("youtubeNode via enrichmentGraph", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_API_KEY = "test-api-key";
    mockEnrichContent.mockResolvedValue(defaultLLMResult);
  });

  afterEach(() => {
    delete process.env.GOOGLE_API_KEY;
  });

  it("routes a video URL through the video enrichment path", async () => {
    mockGetVideo.mockResolvedValue(mockVideoResponse());
    mockLoaderLoad.mockResolvedValue([
      { pageContent: "Transcript text here" },
    ]);

    const result = await enrichmentGraph.invoke({
      bookmark: makeBookmark({
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.videoId).toBe("dQw4w9WgXcQ");
    expect(result.result!.metadata!.transcriptAvailable).toBe("true");
  });

  it("routes a channel URL through the channel enrichment path", async () => {
    mockGetChannelByHandle.mockResolvedValue(mockChannelResponse());

    const result = await enrichmentGraph.invoke({
      bookmark: makeBookmark({
        url: "https://www.youtube.com/@RickAstley",
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.channelId).toBe("UCuAXFkgsw1L7xaCfnd5JJOw");
    expect(result.result!.metadata!.channelTitle).toBe("Rick Astley");
  });

  it("routes a playlist URL through the playlist enrichment path", async () => {
    mockGetPlaylist.mockResolvedValue({
      id: "PLtest",
      snippet: {
        title: "Test Playlist",
        description: "A test",
        channelTitle: "Tester",
        publishedAt: "2024-01-01T00:00:00Z",
        thumbnails: {},
      },
      contentDetails: { itemCount: 5 },
    });
    mockGetPlaylistItems.mockResolvedValue({
      items: [{ snippet: { title: "Item 1" } }],
    });

    const result = await enrichmentGraph.invoke({
      bookmark: makeBookmark({
        url: "https://www.youtube.com/playlist?list=PLtest",
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.playlistId).toBe("PLtest");
    expect(result.result!.metadata!.title).toBe("Test Playlist");
  });

  it("returns empty EnrichedData for unrecognized YouTube URL", async () => {
    const result = await enrichmentGraph.invoke({
      bookmark: makeBookmark({
        url: "https://youtube.com/",
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.summary).toBeNull();
    expect(result.result!.metadata).toBeNull();
    // enrichContent should NOT have been called
    expect(mockEnrichContent).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Error handling tests (task 4.8)
// ---------------------------------------------------------------------------

describe("youtubeNode error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_API_KEY = "test-api-key";
    mockEnrichContent.mockResolvedValue(defaultLLMResult);
  });

  afterEach(() => {
    delete process.env.GOOGLE_API_KEY;
  });

  it("throws when GOOGLE_API_KEY is missing", async () => {
    delete process.env.GOOGLE_API_KEY;

    await expect(
      enrichmentGraph.invoke({
        bookmark: makeBookmark({
          url: "https://www.youtube.com/watch?v=abc123",
        }),
        result: null,
      }),
    ).rejects.toThrow("GOOGLE_API_KEY");
  });

  it("gracefully degrades when YouTube Data API fails but transcript is available", async () => {
    mockGetVideo.mockRejectedValue(new Error("API quota exceeded"));
    mockLoaderLoad.mockResolvedValue([{ pageContent: "transcript" }]);

    // Should NOT throw — getVideo errors are caught and enrichment continues
    // with transcript-only data (no snippet/stats metadata).
    const result = await enrichVideo(
      "https://www.youtube.com/watch?v=abc",
      "abc",
      null,
    );

    expect(result.summary).toBe("A test summary.");
    expect(result.metadata!.transcriptAvailable).toBe("true");
    // Title falls back to "Unknown video" since snippet is unavailable
    expect(result.metadata!.title).toBe("Unknown video");
  });

  it("propagates LLM enrichment errors", async () => {
    mockGetVideo.mockResolvedValue(mockVideoResponse());
    mockLoaderLoad.mockResolvedValue([{ pageContent: "transcript" }]);
    mockEnrichContent.mockRejectedValue(new Error("LLM rate limited"));

    await expect(
      enrichVideo(
        "https://www.youtube.com/watch?v=abc",
        "abc",
        null,
      ),
    ).rejects.toThrow("LLM rate limited");
  });

  it("transcript error does not prevent enrichment (graceful fallback)", async () => {
    mockGetVideo.mockResolvedValue(mockVideoResponse());
    mockLoaderLoad.mockRejectedValue(new Error("Captions disabled"));

    // Should NOT throw — should fall back to description-only enrichment
    const result = await enrichVideo(
      "https://www.youtube.com/watch?v=abc",
      "abc",
      null,
    );

    expect(result.metadata!.transcriptAvailable).toBe("false");
    expect(result.summary).toBe("A test summary.");
  });

  it("channel API error propagates", async () => {
    mockGetChannelByHandle.mockRejectedValue(new Error("Channel API error"));

    await expect(enrichChannel("@broken")).rejects.toThrow("Channel API error");
  });

  it("playlist API error propagates", async () => {
    mockGetPlaylist.mockRejectedValue(new Error("Playlist API error"));
    mockGetPlaylistItems.mockResolvedValue({ items: [] });

    await expect(enrichPlaylist("PLbroken")).rejects.toThrow(
      "Playlist API error",
    );
  });
});
