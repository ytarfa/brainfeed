import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  YouTubeService,
  parseDuration,
} from "../services/youtube-service";
import { GoogleApiError } from "../services/google-api-service";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const fakeVideoResponse = {
  kind: "youtube#videoListResponse",
  etag: "etag123",
  pageInfo: { totalResults: 1, resultsPerPage: 1 },
  items: [
    {
      kind: "youtube#video",
      etag: "vetag1",
      id: "dQw4w9WgXcQ",
      snippet: {
        publishedAt: "2009-10-25T06:57:33Z",
        channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
        title: "Rick Astley - Never Gonna Give You Up",
        description: "The official video for...",
        thumbnails: {
          default: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg", width: 120, height: 90 },
        },
        channelTitle: "Rick Astley",
        tags: ["rick astley", "never gonna give you up"],
        categoryId: "10",
        liveBroadcastContent: "none",
      },
      contentDetails: {
        duration: "PT3M33S",
        dimension: "2d",
        definition: "hd",
        caption: "true",
        licensedContent: true,
        projection: "rectangular",
      },
      statistics: {
        viewCount: "1500000000",
        likeCount: "15000000",
        favoriteCount: "0",
        commentCount: "3000000",
      },
    },
  ],
};

const fakeChannelResponse = {
  kind: "youtube#channelListResponse",
  etag: "cetag",
  pageInfo: { totalResults: 1, resultsPerPage: 1 },
  items: [
    {
      kind: "youtube#channel",
      etag: "ch1",
      id: "UCuAXFkgsw1L7xaCfnd5JJOw",
      snippet: {
        title: "Rick Astley",
        description: "Official channel",
        publishedAt: "2006-09-06T03:19:20Z",
        thumbnails: {},
      },
      statistics: {
        viewCount: "3000000000",
        subscriberCount: "15000000",
        hiddenSubscriberCount: false,
        videoCount: "115",
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("YouTubeService", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let yt: YouTubeService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    yt = new YouTubeService("test-youtube-key");
  });

  // -----------------------------------------------------------------------
  // getVideos / getVideo
  // -----------------------------------------------------------------------

  describe("getVideos()", () => {
    it("calls the /videos endpoint with correct params", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fakeVideoResponse),
      });

      const result = await yt.getVideos("dQw4w9WgXcQ");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(calledUrl.pathname).toBe("/youtube/v3/videos");
      expect(calledUrl.searchParams.get("key")).toBe("test-youtube-key");
      expect(calledUrl.searchParams.get("id")).toBe("dQw4w9WgXcQ");
      expect(calledUrl.searchParams.get("part")).toBe(
        "snippet,contentDetails,statistics",
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("dQw4w9WgXcQ");
    });

    it("accepts an array of IDs", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...fakeVideoResponse, items: [] }),
      });

      await yt.getVideos(["id1", "id2", "id3"]);

      const calledUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(calledUrl.searchParams.get("id")).toBe("id1,id2,id3");
    });

    it("allows overriding parts", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fakeVideoResponse),
      });

      await yt.getVideos("abc", ["snippet", "id"]);

      const calledUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(calledUrl.searchParams.get("part")).toBe("snippet,id");
    });
  });

  describe("getVideo()", () => {
    it("returns the first item from getVideos", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fakeVideoResponse),
      });

      const video = await yt.getVideo("dQw4w9WgXcQ");
      expect(video).not.toBeNull();
      expect(video!.snippet?.title).toBe(
        "Rick Astley - Never Gonna Give You Up",
      );
    });

    it("returns null when video is not found", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ...fakeVideoResponse,
            items: [],
            pageInfo: { totalResults: 0, resultsPerPage: 0 },
          }),
      });

      const video = await yt.getVideo("nonexistent");
      expect(video).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getChannels / getChannel
  // -----------------------------------------------------------------------

  describe("getChannels()", () => {
    it("calls the /channels endpoint with correct params", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fakeChannelResponse),
      });

      const result = await yt.getChannels("UCuAXFkgsw1L7xaCfnd5JJOw");

      const calledUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(calledUrl.pathname).toBe("/youtube/v3/channels");
      expect(calledUrl.searchParams.get("id")).toBe("UCuAXFkgsw1L7xaCfnd5JJOw");
      expect(calledUrl.searchParams.get("part")).toBe("snippet,statistics");
      expect(result.items).toHaveLength(1);
    });
  });

  describe("getChannel()", () => {
    it("returns null when channel is not found", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ...fakeChannelResponse,
            items: [],
          }),
      });

      const channel = await yt.getChannel("UCnonexistent");
      expect(channel).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Error propagation from base class
  // -----------------------------------------------------------------------

  describe("error handling", () => {
    it("propagates GoogleApiError from the base class", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: () =>
          Promise.resolve({
            error: {
              code: 403,
              message: "The request is missing a valid API key.",
              status: "PERMISSION_DENIED",
            },
          }),
      });

      try {
        await yt.getVideo("abc");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GoogleApiError);
        const apiErr = err as GoogleApiError;
        expect(apiErr.status).toBe(403);
        expect(apiErr.code).toBe("PERMISSION_DENIED");
      }
    });
  });

  // -----------------------------------------------------------------------
  // extractVideoId (static)
  // -----------------------------------------------------------------------

  describe("extractVideoId()", () => {
    const extract = YouTubeService.extractVideoId;

    it("extracts from standard watch URL", () => {
      expect(extract("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ",
      );
    });

    it("extracts from watch URL without www", () => {
      expect(extract("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ",
      );
    });

    it("extracts from youtu.be short URL", () => {
      expect(extract("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts from embed URL", () => {
      expect(extract("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ",
      );
    });

    it("extracts from shorts URL", () => {
      expect(extract("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ",
      );
    });

    it("handles watch URL with extra query params", () => {
      expect(
        extract(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
        ),
      ).toBe("dQw4w9WgXcQ");
    });

    it("returns null for non-YouTube URL", () => {
      expect(extract("https://example.com/video/abc")).toBeNull();
    });

    it("returns null for invalid URL", () => {
      expect(extract("not a url")).toBeNull();
    });

    it("returns null for YouTube URL without video ID", () => {
      expect(extract("https://www.youtube.com/")).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// parseDuration (standalone utility)
// ---------------------------------------------------------------------------

describe("parseDuration", () => {
  it("parses hours, minutes, seconds", () => {
    const result = parseDuration("PT1H4M13S");
    expect(result.totalSeconds).toBe(3853);
    expect(result.formatted).toBe("1:04:13");
  });

  it("parses minutes and seconds only", () => {
    const result = parseDuration("PT3M33S");
    expect(result.totalSeconds).toBe(213);
    expect(result.formatted).toBe("3:33");
  });

  it("parses seconds only", () => {
    const result = parseDuration("PT45S");
    expect(result.totalSeconds).toBe(45);
    expect(result.formatted).toBe("0:45");
  });

  it("parses hours only", () => {
    const result = parseDuration("PT2H");
    expect(result.totalSeconds).toBe(7200);
    expect(result.formatted).toBe("2:00:00");
  });

  it("returns zero for empty/invalid duration", () => {
    const result = parseDuration("");
    expect(result.totalSeconds).toBe(0);
    expect(result.formatted).toBe("0:00");
  });
});
