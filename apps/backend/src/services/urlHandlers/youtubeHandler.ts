import type { OgMetadata } from "../ogFetcher";
import type { UrlHandler, ResolvedBookmark } from "./types";

/**
 * Handles YouTube **video** URLs only.
 *
 * Detection: hostname match AND a valid video ID extractable from the URL.
 * Non-video pages (channels, playlists, home, etc.) are ignored.
 * Resolution: constructs thumbnail from video ID (no extra HTTP request).
 */
export class YouTubeVideoHandler implements UrlHandler {
  readonly sourceType = "youtube" as const;

  matches(url: URL, _og: OgMetadata): boolean {
    const videoId = this.extractVideoId(url);
    return videoId !== null;
  }

  async resolve(url: URL, _og: OgMetadata): Promise<Partial<ResolvedBookmark>> {
    const videoId = this.extractVideoId(url);
    if (!videoId) return {};
    return { thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` };
  }

  /**
   * Extract a YouTube video ID from video-specific URL formats:
   * - youtube.com/watch?v=ID
   * - youtu.be/ID
   * - youtube.com/embed/ID
   * - youtube.com/shorts/ID
   *
   * Returns null for non-video YouTube URLs (channels, playlists, home, etc.).
   */
  extractVideoId(url: URL): string | null {
    const hostname = url.hostname.replace("www.", "").toLowerCase();

    if (hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id || null;
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com"
    ) {
      const vParam = url.searchParams.get("v");
      if (vParam) return vParam;

      const match = url.pathname.match(/^\/(embed|shorts)\/([^/?]+)/);
      if (match) return match[2];
    }

    return null;
  }
}
