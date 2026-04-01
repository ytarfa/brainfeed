import React from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

import { isEnriching as checkIsEnriching, isEnrichmentFailed } from "../../../lib/bookmark-status";
import type { Bookmark } from "@brain-feed/types";

interface DetailSummaryProps {
  bookmark: Bookmark;
}

/**
 * AI summary section with enrichment status handling.
 *
 * Shows one of four states:
 * 1. Enriched summary (with AI badge)
 * 2. Fallback summary (bookmark.summary, no badge)
 * 3. Loading spinner (enrichment in progress)
 * 4. Failure message
 * 5. "No summary available" (nothing to show)
 */
export default function DetailSummary({ bookmark }: DetailSummaryProps) {
  const enrichedSummary = bookmark.enriched_data?.summary;
  const displaySummary = enrichedSummary || bookmark.summary;
  const isEnriching = checkIsEnriching(bookmark.enrichment_status);
  const isFailed = isEnrichmentFailed(bookmark.enrichment_status);

  if (displaySummary) {
    return (
      <div className="mb-6">
        <div className="relative rounded-xl bg-[var(--bg-surface)] px-5 py-4">
          {enrichedSummary && (
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles size={11} className="text-[var(--accent)]" />
              <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
                AI Summary
              </span>
            </div>
          )}
          <p className="whitespace-pre-line font-ui text-[13.5px] leading-[1.65] text-[var(--text-secondary)]">
            {displaySummary}
          </p>
        </div>
      </div>
    );
  }

  if (isEnriching) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2.5 rounded-xl bg-[var(--bg-surface)] px-5 py-4">
          <Loader2 size={15} className="animate-spin text-[var(--accent)]" />
          <span className="font-ui text-[13px] text-[var(--text-muted)]">
            Generating summary&hellip;
          </span>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2.5 rounded-xl bg-[var(--bg-surface)] px-5 py-4">
          <AlertCircle size={15} className="text-error" />
          <span className="font-ui text-[13px] text-[var(--text-muted)]">
            Summary generation failed
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <p className="font-ui text-[13px] italic text-[var(--text-muted)]">
        No summary available.
      </p>
    </div>
  );
}
