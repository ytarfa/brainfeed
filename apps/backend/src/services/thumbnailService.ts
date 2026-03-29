import * as cheerio from "cheerio";

const OG_FETCH_TIMEOUT_MS = 5000;

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
 * Fallback strategy that fetches the URL and extracts og:image / twitter:image
 * meta tags from the HTML response. Uses a 5-second timeout.
 */
export class OgImageThumbnailStrategy implements ThumbnailStrategy {
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(options?: { timeoutMs?: number; fetchFn?: typeof fetch }) {
    this.timeoutMs = options?.timeoutMs ?? OG_FETCH_TIMEOUT_MS;
    this.fetchFn = options?.fetchFn ?? fetch;
  }

  supports(_sourceType: string): boolean {
    return true;
  }

  async resolve(url: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await this.fetchFn(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "BrainFeedBot/1.0 (+https://brainfeed.app)",
          "Accept": "text/html",
        },
        redirect: "follow",
      });

      clearTimeout(timeout);

      if (!response.ok) return null;

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) return null;

      const html = await response.text();
      const $ = cheerio.load(html);

      const ogImage = $("meta[property='og:image']").attr("content")
        ?? $("meta[name='og:image']").attr("content")
        ?? $("meta[name='twitter:image']").attr("content")
        ?? $("meta[property='twitter:image']").attr("content");

      if (!ogImage) return null;

      try {
        return new URL(ogImage, url).href;
      } catch {
        return ogImage;
      }
    } catch {
      return null;
    }
  }
}

/**
 * Orchestrates thumbnail resolution by dispatching to registered strategies.
 * Strategies are tried in registration order; the first one that supports
 * the source type gets to resolve. Falls back to the OG image strategy.
 */
export class ThumbnailService {
  private readonly strategies: ThumbnailStrategy[];
  private readonly fallback: ThumbnailStrategy;

  constructor(
    strategies?: ThumbnailStrategy[],
    fallback?: ThumbnailStrategy,
  ) {
    this.strategies = strategies ?? [
      new YouTubeThumbnailStrategy(),
      new GitHubThumbnailStrategy(),
    ];
    this.fallback = fallback ?? new OgImageThumbnailStrategy();
  }

  /**
   * Resolve a thumbnail URL for a bookmark.
   * Dispatches by source type for known platforms (instant, no fetch),
   * falls back to generic OG image resolution for everything else.
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
            const thumb = await strategy.resolve(url);
            if (thumb) return thumb;
            break;
          }
        }
      }

      return await this.fallback.resolve(url);
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
