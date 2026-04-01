import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import type { DetailViewProps } from "../types";
import ThumbnailPlaceholder from "../../ThumbnailPlaceholder";

import DetailSummary from "../shared/DetailSummary";
import DetailTopics from "../shared/DetailTopics";
import DetailEntities from "../shared/DetailEntities";
import DetailMetadata from "../shared/DetailMetadata";
import DetailTags from "../shared/DetailTags";
import DetailSpace from "../shared/DetailSpace";
import DetailNotes from "../shared/DetailNotes";
import DetailFooter from "../shared/DetailFooter";

/**
 * Default detail view — fallback for any bookmark type without
 * a specialized view. Matches the original BookmarkDetail body layout:
 *
 * Hero image → title area → summary → topics → entities →
 * metadata → divider → tags → space → notes → footer
 */
export default function DefaultDetailView({ bookmark, spaceName, spaceColor }: DetailViewProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasThumbnail = bookmark.thumbnail_url && !imgError;
  const hasTopics = bookmark.enriched_data?.topics && bookmark.enriched_data.topics.length > 0;
  const hasEntities = bookmark.enriched_data?.entities && bookmark.enriched_data.entities.length > 0;
  const hasMeta = bookmark.enriched_data?.metadata;

  return (
    <>
      {/* Hero image — tall, edge-to-edge, with gradient fade */}
      {hasThumbnail ? (
        <div className="relative w-full shrink-0 overflow-hidden bg-[var(--bg-surface)]" style={{ minHeight: 280, maxHeight: 360 }}>
          <img
            src={bookmark.thumbnail_url!}
            alt=""
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-500",
              imgLoaded ? "opacity-100" : "opacity-0",
            )}
            style={{ minHeight: 280, maxHeight: 360 }}
          />
          {/* Loading skeleton */}
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
        </div>
      ) : (
        <div className="relative w-full shrink-0 overflow-hidden">
          <ThumbnailPlaceholder
            sourceType={bookmark.source_type}
            height={160}
            className="rounded-none"
            fadeTarget="var(--bg-base)"
            iconSize={44}
          />
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-7 pb-5 pt-5">
        {/* Title area */}
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-medium leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)]">
            {bookmark.title}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            {bookmark.domain && (
              <span className="font-ui text-[12px] font-medium text-[var(--text-muted)]">
                {bookmark.domain}
              </span>
            )}
            {bookmark.domain && bookmark.savedAt && (
              <span className="text-[var(--border-strong)]">&middot;</span>
            )}
            {bookmark.savedAt && (
              <span className="font-ui text-[12px] text-[var(--text-muted)]">
                {bookmark.savedAt}
              </span>
            )}
            {bookmark.source_type && (
              <>
                <span className="text-[var(--border-strong)]">&middot;</span>
                <span className="rounded-[5px] bg-[var(--accent-subtle)] px-1.5 py-[1px] font-ui text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--accent-text)]">
                  {bookmark.source_type}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Summary section */}
        <DetailSummary bookmark={bookmark} />

        {/* Topics + Entities inline row */}
        {(hasTopics || hasEntities) && (
          <div className="mb-6 flex flex-col gap-4">
            {hasTopics && <DetailTopics topics={bookmark.enriched_data!.topics!} />}
            {hasEntities && <DetailEntities entities={bookmark.enriched_data!.entities!} />}
          </div>
        )}

        {/* Metadata chips */}
        {hasMeta && <DetailMetadata metadata={bookmark.enriched_data!.metadata!} />}

        {/* Divider */}
        <div className="mb-5 h-px bg-[var(--border-subtle)]" />

        {/* Tags */}
        <DetailTags tags={bookmark.tags} />

        {/* Space */}
        {spaceName && <DetailSpace spaceName={spaceName} spaceColor={spaceColor} />}

        {/* Notes */}
        <DetailNotes initialNotes={bookmark.notes || ""} />
      </div>

      {/* Footer */}
      {bookmark.url && <DetailFooter url={bookmark.url} />}
    </>
  );
}
