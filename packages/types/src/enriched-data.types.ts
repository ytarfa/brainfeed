/**
 * Enriched-data types produced by the enrichment pipeline.
 *
 * Each variant represents a different kind of enrichment output
 * stored in `bookmarks.enriched_data`.
 */

/** A single media attachment extracted from the bookmark source. */
export interface MediaItem {
  /** Absolute URL of the media resource. */
  url: string;
  /** Media kind. */
  type: "image" | "video";
  /** Optional alt text / accessibility caption. */
  alt?: string;
}

/** Structured output of the enrichment pipeline, stored in bookmarks.enriched_data. */
export interface EnrichedData {
  /** AI-generated summary of the bookmark content. */
  summary: string | null
  /** Named entities extracted from the content. */
  entities: { name: string; type: string }[]
  /** Topic labels assigned to the content. */
  topics: string[]
  /** AI-generated tags for the bookmark. */
  tags: string[]
  /** Source-type-specific metadata (e.g. GitHub stars, video duration). */
  metadata: Record<string, string | number> | null
  /**
   * Media items extracted from the source (images, videos).
   * Not yet populated by the enrichment pipeline — reserved for future use.
   * Views may read this field for multi-media rendering (e.g. Instagram carousel).
   */
  media?: MediaItem[];
  /** ISO 8601 timestamp of when enrichment was completed. */
  processedAt: string
}
