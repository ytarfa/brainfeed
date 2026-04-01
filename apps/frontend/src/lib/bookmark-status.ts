import type { EnrichmentStatus } from "@brain-feed/types";

// ---------------------------------------------------------------------------
// Enrichment status helpers
// Centralised so BookmarkCard, BookmarkDetail, and any future consumers
// share a single source of truth for status logic and display strings.
// ---------------------------------------------------------------------------

/** Returns `true` when the bookmark's enrichment is still in progress. */
export function isEnriching(status: EnrichmentStatus | undefined): boolean {
  return status === "pending" || status === "processing";
}

/** Returns `true` when enrichment has completed successfully. */
export function isEnriched(status: EnrichmentStatus | undefined): boolean {
  return status === "completed";
}

/** Returns `true` when enrichment has failed. */
export function isEnrichmentFailed(status: EnrichmentStatus | undefined): boolean {
  return status === "failed";
}

/** Returns `true` when the source type is unsupported for enrichment. */
export function isEnrichmentUnsupported(status: EnrichmentStatus | undefined): boolean {
  return status === "unsupported";
}

// ---------------------------------------------------------------------------
// Display labels — used by status badges and inline indicators
// ---------------------------------------------------------------------------

interface StatusDisplay {
  /** Short human-readable label */
  label: string;
  /** Semantic tone for styling */
  tone: "neutral" | "processing" | "success" | "error";
}

const STATUS_DISPLAY: Record<EnrichmentStatus, StatusDisplay> = {
  pending: { label: "Generating summary\u2026", tone: "processing" },
  processing: { label: "Generating summary\u2026", tone: "processing" },
  completed: { label: "Enriched", tone: "success" },
  failed: { label: "Summary failed", tone: "error" },
  unsupported: { label: "Not supported", tone: "neutral" },
};

export function getEnrichmentDisplay(status: EnrichmentStatus | undefined): StatusDisplay | null {
  if (!status) return null;
  return STATUS_DISPLAY[status] ?? null;
}
