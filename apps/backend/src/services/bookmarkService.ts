import type { SourceType } from "@brain-feed/types";
import type { SourceTypeStrategy } from "./sourceTypeStrategy";
import type { OgMetadata } from "./ogFetcher";
import { GenericSourceTypeStrategy } from "./sourceTypeStrategy";
import { ogFetcher, OgFetcher } from "./ogFetcher";
import { ogTypeParser, OgTypeParser } from "./ogTypeParser";

/**
 * Result of source type detection.
 * Includes OG metadata when available (for non-github/youtube URLs).
 */
export interface SourceTypeResult {
  sourceType: SourceType;
  ogMetadata: OgMetadata | null;
}

export class BookmarkService {
  private strategies: SourceTypeStrategy[];
  private ogFetcherInstance: OgFetcher;
  private ogTypeParserInstance: OgTypeParser;

  constructor(options?: {
    strategies?: SourceTypeStrategy[];
    ogFetcher?: OgFetcher;
    ogTypeParser?: OgTypeParser;
  }) {
    this.strategies = options?.strategies ?? [new GenericSourceTypeStrategy()];
    this.ogFetcherInstance = options?.ogFetcher ?? ogFetcher;
    this.ogTypeParserInstance = options?.ogTypeParser ?? ogTypeParser;
  }

  /**
   * Detect source type from a URL.
   *
   * 1. Try hostname-based strategies first (github.com, youtube.com — instant).
   * 2. If no hostname match, fetch OG metadata and detect from og:type.
   * 3. Returns both the source type and OG metadata for downstream use.
   */
  async detectSourceType(url: string): Promise<SourceTypeResult> {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");

      // Fast path: hostname-based detection (no fetch needed)
      for (const strategy of this.strategies) {
        const result = strategy.detect(hostname);
        if (result !== null) {
          return { sourceType: result, ogMetadata: null };
        }
      }

      // Slow path: fetch OG metadata and detect from og:type
      const ogMeta = await this.ogFetcherInstance.fetch(url);
      if (ogMeta) {
        const sourceType = this.ogTypeParserInstance.detectSourceType(ogMeta);
        return { sourceType, ogMetadata: ogMeta };
      }

      return { sourceType: "generic", ogMetadata: null };
    } catch {
      return { sourceType: "generic", ogMetadata: null };
    }
  }
}

/** Default singleton for convenience */
export const bookmarkService = new BookmarkService();
