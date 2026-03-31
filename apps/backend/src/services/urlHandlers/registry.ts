import type { OgMetadata } from "../ogFetcher";
import { ogFetcher, OgFetcher } from "../ogFetcher";
import type { UrlHandler, ResolvedBookmark } from "./types";
import { NULL_OG_METADATA } from "./types";
import { YouTubeHandler } from "./youtubeHandler";
import { GitHubHandler } from "./githubHandler";
import { ArticleHandler } from "./articleHandler";

/**
 * Orchestrates URL handling by fetching OG metadata as a base layer,
 * finding the first matching handler, and merging its overrides.
 *
 * Handler registration order matters — first match wins.
 * Default order: YouTube → GitHub → Article.
 */
export class UrlHandlerRegistry {
  private readonly handlers: UrlHandler[];
  private readonly ogFetcherInstance: OgFetcher;

  constructor(options?: { handlers?: UrlHandler[]; ogFetcher?: OgFetcher }) {
    this.handlers = options?.handlers ?? [
      new YouTubeHandler(),
      new GitHubHandler(),
      new ArticleHandler(),
    ];
    this.ogFetcherInstance = options?.ogFetcher ?? ogFetcher;
  }

  /**
   * Resolve a URL into a ResolvedBookmark.
   *
   * 1. Fetch OG metadata (always, for every URL)
   * 2. Build base ResolvedBookmark from OG fields
   * 3. Find first matching handler, merge its overrides
   * 4. Return the merged result
   */
  async resolve(rawUrl: string): Promise<ResolvedBookmark> {
    const og: OgMetadata = await this.ogFetcherInstance.fetch(rawUrl) ?? NULL_OG_METADATA;

    const url = new URL(rawUrl);

    const base: ResolvedBookmark = {
      sourceType: "generic",
      thumbnailUrl: og.image,
      title: og.title,
      description: og.description,
      author: og.author,
    };

    for (const handler of this.handlers) {
      if (handler.matches(url, og)) {
        const overrides = await handler.resolve(url, og);
        return this.merge(base, overrides, handler.sourceType);
      }
    }

    return base;
  }

  /**
   * Merge handler overrides over the OG base.
   * Only non-undefined fields from overrides replace base fields.
   */
  private merge(
    base: ResolvedBookmark,
    overrides: Partial<ResolvedBookmark>,
    sourceType: ResolvedBookmark["sourceType"],
  ): ResolvedBookmark {
    const result = { ...base, sourceType };

    for (const key of Object.keys(overrides) as Array<keyof ResolvedBookmark>) {
      if (overrides[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[key] = overrides[key];
      }
    }

    return result;
  }
}

/** Default singleton instance. */
export const registry = new UrlHandlerRegistry();
