import type { OgMetadata } from "../ogFetcher";
import type { UrlHandler, ResolvedBookmark } from "./types";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "music.youtube.com",
]);

/**
 * Handles YouTube URLs.
 *
 * Detection: hostname match or OG siteName "YouTube".
 * Resolution: constructs thumbnail from video ID (no extra HTTP request).
 */
export class YouTubeHandler implements UrlHandler {
  readonly sourceType = "youtube" as const;

  matches(url: URL, og: OgMetadata): boolean {
    if (YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return true;
    if (og.siteName === "YouTube") return true;
    return false;
  }

  async resolve(url: URL, _og: OgMetadata): Promise<Partial<ResolvedBookmark>> {
    const videoId = this.extractVideoId(url);
    if (!videoId) return {};
    return { thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` };
  }

  /**
   * Extract a YouTube video ID from various URL formats:
   * - youtube.com/watch?v=ID
   * - youtu.be/ID
   * - youtube.com/embed/ID
   * - youtube.com/shorts/ID
   */
  extractVideoId(url: URL): string | null {
    const hostname = url.hostname.replace("www.", "");

    if (hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id || null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const vParam = url.searchParams.get("v");
      if (vParam) return vParam;

      const match = url.pathname.match(/^\/(embed|shorts)\/([^/?]+)/);
      if (match) return match[2];
    }

    return null;
  }
}
