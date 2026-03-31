import type { OgMetadata } from "../ogFetcher";
import type { UrlHandler, ResolvedBookmark } from "./types";

/**
 * Handles GitHub URLs.
 *
 * Detection: hostname is github.com.
 * Resolution: constructs OG thumbnail from owner/repo (no extra HTTP request).
 */
export class GitHubHandler implements UrlHandler {
  readonly sourceType = "github" as const;

  matches(url: URL, _og: OgMetadata): boolean {
    const hostname = url.hostname.toLowerCase();
    return hostname === "github.com" || hostname === "www.github.com";
  }

  async resolve(url: URL, _og: OgMetadata): Promise<Partial<ResolvedBookmark>> {
    const info = this.extractOwnerRepo(url);
    if (!info) return {};
    return { thumbnailUrl: `https://opengraph.githubassets.com/1/${info.owner}/${info.repo}` };
  }

  /**
   * Extract owner/repo from a GitHub URL path.
   * Handles: github.com/owner/repo, github.com/owner/repo/issues/123, etc.
   */
  extractOwnerRepo(url: URL): { owner: string; repo: string } | null {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  }
}
