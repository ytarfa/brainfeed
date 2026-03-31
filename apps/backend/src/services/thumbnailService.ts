/**
 * Thumbnail URL resolution for YouTube and GitHub bookmarks.
 *
 * For these platforms the thumbnail URL can be constructed directly
 * from the bookmark URL without any HTTP fetch. All other source types
 * rely on the og:image already extracted by OgFetcher during source-type
 * detection — no additional resolution step is needed.
 */

/**
 * Strategy interface for resolving a thumbnail URL from a bookmark URL.
 * Each strategy handles one or more source types.
 */
export interface ThumbnailStrategy {
  /**
   * Returns true if this strategy can handle the given source type.
   */
  supports(sourceType: string): boolean;

  /**
   * Resolves a thumbnail URL from the given bookmark URL.
   * Returns null if no thumbnail can be resolved.
   */
  resolve(url: string): Promise<string | null>;
}

/**
 * Resolves YouTube video thumbnails by URL construction.
 * No HTTP fetch needed — extracts the video ID and constructs a direct URL.
 */
export class YouTubeThumbnailStrategy implements ThumbnailStrategy {
  supports(sourceType: string): boolean {
    return sourceType === "youtube";
  }

  async resolve(url: string): Promise<string | null> {
    const videoId = this.extractVideoId(url);
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  /**
   * Extract a YouTube video ID from various URL formats:
   * - youtube.com/watch?v=ID
   * - youtu.be/ID
   * - youtube.com/embed/ID
   * - youtube.com/shorts/ID
   */
  extractVideoId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.replace("www.", "");

      if (hostname === "youtu.be") {
        const id = parsed.pathname.slice(1).split("/")[0];
        return id || null;
      }

      if (hostname === "youtube.com" || hostname === "m.youtube.com") {
        const vParam = parsed.searchParams.get("v");
        if (vParam) return vParam;

        const match = parsed.pathname.match(/^\/(embed|shorts)\/([^/?]+)/);
        if (match) return match[2];
      }

      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Resolves GitHub repository thumbnails by URL construction.
 * No HTTP fetch needed — extracts owner/repo and constructs a direct URL.
 */
export class GitHubThumbnailStrategy implements ThumbnailStrategy {
  supports(sourceType: string): boolean {
    return sourceType === "github";
  }

  async resolve(url: string): Promise<string | null> {
    const info = this.extractOwnerRepo(url);
    if (!info) return null;
    return `https://opengraph.githubassets.com/1/${info.owner}/${info.repo}`;
  }

  /**
   * Extract owner/repo from a GitHub URL.
   * Handles: github.com/owner/repo, github.com/owner/repo/tree/..., etc.
   */
  extractOwnerRepo(url: string): { owner: string; repo: string } | null {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.replace("www.", "");
      if (hostname !== "github.com") return null;

      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length < 2) return null;

      return { owner: parts[0], repo: parts[1] };
    } catch {
      return null;
    }
  }
}

/**
 * Orchestrates thumbnail resolution by dispatching to registered strategies.
 * Strategies are tried in registration order; the first one that supports
 * the source type gets to resolve.
 */
export class ThumbnailService {
  private readonly strategies: ThumbnailStrategy[];

  constructor(strategies?: ThumbnailStrategy[]) {
    this.strategies = strategies ?? [
      new YouTubeThumbnailStrategy(),
      new GitHubThumbnailStrategy(),
    ];
  }

  /**
   * Resolve a thumbnail URL for a bookmark.
   * Dispatches by source type for known platforms (instant, no fetch).
   * Returns null for unrecognised source types — callers should fall back
   * to ogMetadata.image when available.
   *
   * Best-effort: returns null on any failure without throwing.
   */
  async resolveThumbnail(
    url: string,
    sourceType: string | null,
  ): Promise<string | null> {
    try {
      if (sourceType) {
        for (const strategy of this.strategies) {
          if (strategy.supports(sourceType)) {
            return await strategy.resolve(url);
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}

/** Default singleton instance for use across the app. */
export const thumbnailService = new ThumbnailService();

/** Convenience re-export for backward compatibility. */
export async function resolveThumbnail(
  url: string,
  sourceType: string | null,
): Promise<string | null> {
  return thumbnailService.resolveThumbnail(url, sourceType);
}
