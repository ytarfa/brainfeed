/**
 * YouTube Data API v3 service.
 *
 * Extends GoogleApiService to inherit auth and HTTP plumbing.
 * Provides typed methods for common YouTube API operations.
 *
 * Usage:
 *   const yt = new YouTubeService(process.env.GOOGLE_API_KEY!);
 *   const video = await yt.getVideo("dQw4w9WgXcQ");
 */

import {
  GoogleApiService,
  GoogleApiError,
  type GoogleApiRequestOptions,
} from "./google-api-service";

// ---------------------------------------------------------------------------
// YouTube API base URL
// ---------------------------------------------------------------------------

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// ---------------------------------------------------------------------------
// Response types — modelled after the YouTube Data API v3 JSON schema
// ---------------------------------------------------------------------------

export interface YouTubePageInfo {
  totalResults: number;
  resultsPerPage: number;
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

export interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  tags?: string[];
  categoryId: string;
  liveBroadcastContent: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
}

export interface YouTubeContentDetails {
  /** ISO 8601 duration, e.g. "PT4M13S" */
  duration: string;
  dimension: string;
  definition: string;
  caption: string;
  licensedContent: boolean;
  projection: string;
}

export interface YouTubeStatistics {
  viewCount: string;
  likeCount?: string;
  favoriteCount: string;
  commentCount?: string;
}

export interface YouTubeVideoResource {
  kind: string;
  etag: string;
  id: string;
  snippet?: YouTubeVideoSnippet;
  contentDetails?: YouTubeContentDetails;
  statistics?: YouTubeStatistics;
}

export interface YouTubeVideoListResponse {
  kind: string;
  etag: string;
  pageInfo: YouTubePageInfo;
  items: YouTubeVideoResource[];
}

export interface YouTubeChannelSnippet {
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails: YouTubeThumbnails;
  country?: string;
}

export interface YouTubeChannelStatistics {
  viewCount: string;
  subscriberCount?: string;
  hiddenSubscriberCount: boolean;
  videoCount: string;
}

export interface YouTubeChannelResource {
  kind: string;
  etag: string;
  id: string;
  snippet?: YouTubeChannelSnippet;
  statistics?: YouTubeChannelStatistics;
}

export interface YouTubeChannelListResponse {
  kind: string;
  etag: string;
  pageInfo: YouTubePageInfo;
  items: YouTubeChannelResource[];
}

// ---------------------------------------------------------------------------
// Video part types — controls which fields are included in the response
// ---------------------------------------------------------------------------

export type VideoPart = "snippet" | "contentDetails" | "statistics" | "id";
export type ChannelPart = "snippet" | "statistics" | "id" | "contentDetails";
export type PlaylistPart = "snippet" | "contentDetails" | "id" | "status";
export type PlaylistItemPart = "snippet" | "contentDetails" | "id" | "status";

// ---------------------------------------------------------------------------
// Playlist response types
// ---------------------------------------------------------------------------

export interface YouTubePlaylistSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
}

export interface YouTubePlaylistContentDetails {
  itemCount: number;
}

export interface YouTubePlaylistResource {
  kind: string;
  etag: string;
  id: string;
  snippet?: YouTubePlaylistSnippet;
  contentDetails?: YouTubePlaylistContentDetails;
}

export interface YouTubePlaylistListResponse {
  kind: string;
  etag: string;
  pageInfo: YouTubePageInfo;
  items: YouTubePlaylistResource[];
}

export interface YouTubePlaylistItemSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  playlistId: string;
  position: number;
  resourceId: {
    kind: string;
    videoId: string;
  };
}

export interface YouTubePlaylistItemResource {
  kind: string;
  etag: string;
  id: string;
  snippet?: YouTubePlaylistItemSnippet;
}

export interface YouTubePlaylistItemListResponse {
  kind: string;
  etag: string;
  pageInfo: YouTubePageInfo;
  items: YouTubePlaylistItemResource[];
  nextPageToken?: string;
}

// ---------------------------------------------------------------------------
// URL classification result
// ---------------------------------------------------------------------------

export type YouTubeUrlType = "video" | "channel" | "playlist";

export interface YouTubeUrlClassification {
  type: YouTubeUrlType;
  id: string;
}

// ---------------------------------------------------------------------------
// Helper: parse ISO 8601 duration to human-readable string
// ---------------------------------------------------------------------------

/**
 * Convert an ISO 8601 duration (e.g. "PT1H4M13S") to a human-readable
 * string (e.g. "1:04:13") or total seconds.
 */
export function parseDuration(iso8601: string): {
  totalSeconds: number;
  formatted: string;
} {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return { totalSeconds: 0, formatted: "0:00" };
  }

  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(String(hours));
    parts.push(String(minutes).padStart(2, "0"));
  } else {
    parts.push(String(minutes));
  }
  parts.push(String(seconds).padStart(2, "0"));

  return { totalSeconds, formatted: parts.join(":") };
}

// ---------------------------------------------------------------------------
// YouTubeService
// ---------------------------------------------------------------------------

export class YouTubeService extends GoogleApiService {
  constructor(apiKey: string) {
    super(apiKey, YOUTUBE_API_BASE);
  }

  // -----------------------------------------------------------------------
  // Videos
  // -----------------------------------------------------------------------

  /**
   * Fetch one or more videos by ID.
   *
   * @param ids   Single video ID or array of IDs (max 50 per request).
   * @param parts Which resource parts to include. Defaults to
   *              `["snippet", "contentDetails", "statistics"]`.
   */
  async getVideos(
    ids: string | string[],
    parts: VideoPart[] = ["snippet", "contentDetails", "statistics"],
    options?: GoogleApiRequestOptions,
  ): Promise<YouTubeVideoListResponse> {
    const idList = Array.isArray(ids) ? ids.join(",") : ids;

    return this.get<YouTubeVideoListResponse>("/videos", {
      ...options,
      params: {
        ...options?.params,
        part: parts.join(","),
        id: idList,
      },
    });
  }

  /**
   * Convenience: fetch a single video by ID. Returns `null` if not found.
   */
  async getVideo(
    id: string,
    parts?: VideoPart[],
    options?: GoogleApiRequestOptions,
  ): Promise<YouTubeVideoResource | null> {
    const response = await this.getVideos(id, parts, options);
    return response.items[0] ?? null;
  }

  // -----------------------------------------------------------------------
  // Channels
  // -----------------------------------------------------------------------

  /**
   * Fetch one or more channels by ID.
   */
  async getChannels(
    ids: string | string[],
    parts: ChannelPart[] = ["snippet", "statistics"],
    options?: GoogleApiRequestOptions,
  ): Promise<YouTubeChannelListResponse> {
    const idList = Array.isArray(ids) ? ids.join(",") : ids;

    return this.get<YouTubeChannelListResponse>("/channels", {
      ...options,
      params: {
        ...options?.params,
        part: parts.join(","),
        id: idList,
      },
    });
  }

  /**
   * Convenience: fetch a single channel by ID. Returns `null` if not found.
   */
  async getChannel(
    id: string,
    parts?: ChannelPart[],
    options?: GoogleApiRequestOptions,
  ): Promise<YouTubeChannelResource | null> {
    const response = await this.getChannels(id, parts, options);
    return response.items[0] ?? null;
  }

  // -----------------------------------------------------------------------
  // Channels — by handle
  // -----------------------------------------------------------------------

  /**
   * Fetch a channel by its handle (e.g. "@mkbhd").
   * Uses the `forHandle` parameter of the YouTube Data API channels endpoint.
   * Returns `null` if no channel matches the handle.
   */
  async getChannelByHandle(
    handle: string,
    parts: ChannelPart[] = ["snippet", "statistics"],
    options?: GoogleApiRequestOptions,
  ): Promise<YouTubeChannelResource | null> {
    // Strip leading "@" if present — the API accepts bare handles
    const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;

    const response = await this.get<YouTubeChannelListResponse>("/channels", {
      ...options,
      params: {
        ...options?.params,
        part: parts.join(","),
        forHandle: cleanHandle,
      },
    });

    return response.items[0] ?? null;
  }

  // -----------------------------------------------------------------------
  // Playlists
  // -----------------------------------------------------------------------

  /**
   * Fetch a playlist by ID.
   */
  async getPlaylist(
    id: string,
    parts: PlaylistPart[] = ["snippet", "contentDetails"],
    options?: GoogleApiRequestOptions,
  ): Promise<YouTubePlaylistResource | null> {
    const response = await this.get<YouTubePlaylistListResponse>("/playlists", {
      ...options,
      params: {
        ...options?.params,
        part: parts.join(","),
        id,
      },
    });

    return response.items[0] ?? null;
  }

  /**
   * Fetch items from a playlist.
   *
   * @param playlistId  The playlist to fetch items from.
   * @param maxResults  Maximum items to return (1-50, default 25).
   */
  async getPlaylistItems(
    playlistId: string,
    maxResults: number = 25,
    parts: PlaylistItemPart[] = ["snippet"],
    options?: GoogleApiRequestOptions,
  ): Promise<YouTubePlaylistItemListResponse> {
    return this.get<YouTubePlaylistItemListResponse>("/playlistItems", {
      ...options,
      params: {
        ...options?.params,
        part: parts.join(","),
        playlistId,
        maxResults,
      },
    });
  }

  // -----------------------------------------------------------------------
  // Helpers — extract video ID from various URL formats
  // -----------------------------------------------------------------------

  /**
   * Extract a YouTube video ID from a URL.
   *
   * Handles:
   *   - https://www.youtube.com/watch?v=VIDEO_ID
   *   - https://youtu.be/VIDEO_ID
   *   - https://www.youtube.com/embed/VIDEO_ID
   *   - https://www.youtube.com/shorts/VIDEO_ID
   *
   * Returns `null` if the URL doesn't match any known pattern.
   */
  static extractVideoId(url: string): string | null {
    try {
      const parsed = new URL(url);

      // youtube.com/watch?v=...
      if (
        (parsed.hostname === "www.youtube.com" ||
          parsed.hostname === "youtube.com") &&
        parsed.searchParams.has("v")
      ) {
        return parsed.searchParams.get("v");
      }

      // youtu.be/VIDEO_ID
      if (parsed.hostname === "youtu.be") {
        return parsed.pathname.slice(1) || null;
      }

      // youtube.com/embed/VIDEO_ID or youtube.com/shorts/VIDEO_ID
      const embedMatch = parsed.pathname.match(
        /^\/(embed|shorts|v)\/([^/?]+)/,
      );
      if (embedMatch) {
        return embedMatch[2];
      }

      return null;
    } catch {
      return null;
    }
  }

  // -----------------------------------------------------------------------
  // Helpers — classify YouTube URL type
  // -----------------------------------------------------------------------

  /**
   * Classify a YouTube URL as video, channel, or playlist and extract the
   * relevant identifier.
   *
   * Priority for ambiguous URLs (e.g. watch?v=abc&list=xyz): video wins.
   *
   * Channel URL patterns:
   *   - /channel/UC...          → channel ID
   *   - /c/CustomName           → custom URL slug
   *   - /user/Username          → legacy username
   *   - /@handle                → handle (prefixed with @)
   *
   * Playlist URL patterns:
   *   - /playlist?list=PL...    → playlist ID
   *
   * Returns `null` if the URL is not a recognized YouTube URL.
   */
  static classifyYouTubeUrl(url: string): YouTubeUrlClassification | null {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.replace(/^www\./, "");

      if (hostname !== "youtube.com" && hostname !== "youtu.be") {
        return null;
      }

      // --- Video patterns (highest priority) ---

      // youtu.be/VIDEO_ID
      if (hostname === "youtu.be") {
        const id = parsed.pathname.slice(1).split("/")[0];
        return id ? { type: "video", id } : null;
      }

      // watch?v=VIDEO_ID (even if list= is present, treat as video)
      if (parsed.searchParams.has("v")) {
        const id = parsed.searchParams.get("v");
        return id ? { type: "video", id } : null;
      }

      // /embed/VIDEO_ID, /shorts/VIDEO_ID, /v/VIDEO_ID
      const videoPathMatch = parsed.pathname.match(
        /^\/(embed|shorts|v)\/([^/?]+)/,
      );
      if (videoPathMatch) {
        return { type: "video", id: videoPathMatch[2] };
      }

      // /live/VIDEO_ID
      const liveMatch = parsed.pathname.match(/^\/live\/([^/?]+)/);
      if (liveMatch) {
        return { type: "video", id: liveMatch[1] };
      }

      // --- Playlist pattern ---

      // /playlist?list=PLAYLIST_ID
      if (
        parsed.pathname === "/playlist" &&
        parsed.searchParams.has("list")
      ) {
        const id = parsed.searchParams.get("list");
        return id ? { type: "playlist", id } : null;
      }

      // --- Channel patterns ---

      // /channel/UC...
      const channelIdMatch = parsed.pathname.match(/^\/channel\/([^/?]+)/);
      if (channelIdMatch) {
        return { type: "channel", id: channelIdMatch[1] };
      }

      // /@handle
      const handleMatch = parsed.pathname.match(/^\/@([^/?]+)/);
      if (handleMatch) {
        return { type: "channel", id: `@${handleMatch[1]}` };
      }

      // /c/CustomName
      const customMatch = parsed.pathname.match(/^\/c\/([^/?]+)/);
      if (customMatch) {
        return { type: "channel", id: customMatch[1] };
      }

      // /user/Username
      const userMatch = parsed.pathname.match(/^\/user\/([^/?]+)/);
      if (userMatch) {
        return { type: "channel", id: userMatch[1] };
      }

      return null;
    } catch {
      return null;
    }
  }
}

export { GoogleApiError };
