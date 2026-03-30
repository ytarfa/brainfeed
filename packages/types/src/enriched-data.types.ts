/**
 * Enriched-data types produced by the enrichment pipeline.
 *
 * Each variant represents a different kind of enrichment output
 * stored in `bookmarks.enriched_data`.
 */

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
  /** ISO 8601 timestamp of when enrichment was completed. */
  processedAt: string
}
