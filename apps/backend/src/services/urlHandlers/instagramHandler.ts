import type { OgMetadata } from "../ogFetcher";
import type { UrlHandler, ResolvedBookmark } from "./types";

const INSTAGRAM_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
]);

/**
 * Handles Instagram URLs (posts and reels only).
 *
 * Detection: hostname match against known Instagram domains.
 * Resolution: uses og:image from OG metadata when available (Instagram
 * may or may not serve OG tags depending on server-side rendering).
 */
export class InstagramHandler implements UrlHandler {
  readonly sourceType = "instagram" as const;

  matches(url: URL, _og: OgMetadata): boolean {
    return INSTAGRAM_HOSTS.has(url.hostname.toLowerCase());
  }

  async resolve(_url: URL, og: OgMetadata): Promise<Partial<ResolvedBookmark>> {
    if (og.image) {
      return { thumbnailUrl: og.image };
    }
    return {};
  }
}
