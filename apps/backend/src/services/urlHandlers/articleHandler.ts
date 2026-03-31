import type { OgMetadata } from "../ogFetcher";
import type { UrlHandler, ResolvedBookmark } from "./types";

/**
 * Handles article URLs.
 *
 * Detection: OG type is "article", or author/publishedAt are present.
 * Resolution: returns empty object — all metadata comes from the OG base layer.
 */
export class ArticleHandler implements UrlHandler {
  readonly sourceType = "article" as const;

  matches(_url: URL, og: OgMetadata): boolean {
    if (og.type === "article") return true;
    if (og.author) return true;
    if (og.publishedAt) return true;
    return false;
  }

  async resolve(_url: URL, _og: OgMetadata): Promise<Partial<ResolvedBookmark>> {
    return {};
  }
}
