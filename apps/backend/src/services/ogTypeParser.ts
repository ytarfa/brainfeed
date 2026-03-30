import type { SourceType } from "@brain-feed/types";
import type { OgMetadata } from "./ogFetcher";

/**
 * Strategy interface for detecting a source type from OG metadata.
 * Each strategy handles one or more og:type values.
 */
export interface OgTypeStrategy {
  /**
   * Returns the source type for the given OG metadata,
   * or null if this strategy does not handle it.
   */
  detect(meta: OgMetadata): SourceType | null;
}

/**
 * OG type values that indicate article content.
 *
 * "article"          — standard OG article type
 * "blog"             — some CMSs use this non-standard type
 * "newsarticle"      — schema.org crossover
 * "news article"     — variant spelling
 */
const ARTICLE_OG_TYPES = new Set([
  "article",
  "blog",
  "newsarticle",
  "news article",
]);

/**
 * Detects "article" source type from OG metadata.
 *
 * Primary signal: og:type is in the ARTICLE_OG_TYPES set.
 * Secondary signal: presence of article:published_time or article:author
 * even when og:type is absent or set to "website".
 */
export class ArticleOgTypeStrategy implements OgTypeStrategy {
  detect(meta: OgMetadata): SourceType | null {
    const ogType = meta.type?.toLowerCase().trim() ?? null;

    // Primary: explicit article og:type
    if (ogType && ARTICLE_OG_TYPES.has(ogType)) {
      return "article";
    }

    // Secondary: article metadata present (published_time or author)
    // even if og:type is "website" or missing
    if (meta.publishedAt || meta.author) {
      return "article";
    }

    return null;
  }
}

/**
 * Orchestrates OG-based source type detection.
 *
 * Walks the strategy chain in registration order. Returns the first
 * non-null result, or "generic" as fallback.
 */
export class OgTypeParser {
  private readonly strategies: OgTypeStrategy[];

  constructor(strategies?: OgTypeStrategy[]) {
    this.strategies = strategies ?? [
      new ArticleOgTypeStrategy(),
    ];
  }

  /**
   * Detect source type from OG metadata.
   * Returns the detected source type, or "generic" if no strategy matches.
   */
  detectSourceType(meta: OgMetadata): SourceType {
    for (const strategy of this.strategies) {
      const result = strategy.detect(meta);
      if (result !== null) return result;
    }
    return "generic";
  }
}

/** Default singleton instance. */
export const ogTypeParser = new OgTypeParser();
