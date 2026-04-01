import React, { useState } from "react";
import { BookOpen, Clock, Globe, User, FileText } from "lucide-react";
import { cn } from "../../../lib/utils";
import { registerDetailView } from "../registry";
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

/* ------------------------------------------------------------------ */
/*  Metadata helpers                                                   */
/* ------------------------------------------------------------------ */

function meta(bookmark: DetailViewProps["bookmark"]): Record<string, string | number> {
  return (bookmark.enriched_data?.metadata as Record<string, string | number>) ?? {};
}

function str(m: Record<string, string | number>, key: string): string | undefined {
  const v = m[key];
  return v !== undefined && v !== null ? String(v) : undefined;
}

function num(m: Record<string, string | number>, key: string): number | undefined {
  const v = m[key];
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/** Format a number with comma separators. */
function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

/** Keys that are rendered structurally — exclude from generic DetailMetadata */
const STRUCTURAL_KEYS = [
  "title", "author", "siteName", "publishedAt", "language",
  "ogImage", "wordCount", "readingTimeMinutes", "unsupported",
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Formatted publish date. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  ArticleDetailView                                                  */
/* ------------------------------------------------------------------ */

export default function ArticleDetailView({
  bookmark,
  spaceName,
  spaceColor,
}: DetailViewProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const m = meta(bookmark);
  const author = str(m, "author");
  const siteName = str(m, "siteName");
  const readingTime = num(m, "readingTimeMinutes");
  const wordCount = num(m, "wordCount");
  const publishedAt = str(m, "publishedAt");
  const ogImage = str(m, "ogImage");
  const language = str(m, "language");

  // Image: thumbnail_url → ogImage fallback
  const heroSrc = (!imgError && bookmark.thumbnail_url) || (!imgError && ogImage) || null;

  const hasTopics = (bookmark.enriched_data?.topics?.length ?? 0) > 0;
  const hasEntities = (bookmark.enriched_data?.entities?.length ?? 0) > 0;
  const hasMeta = bookmark.enriched_data?.metadata;

  return (
    <>
      {/* ── Hero image ────────────────────────────────────────────── */}
      {heroSrc ? (
        <div
          className="relative w-full shrink-0 overflow-hidden bg-[var(--bg-surface)]"
          style={{ minHeight: 280, maxHeight: 360 }}
        >
          <img
            src={heroSrc}
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
          {!imgLoaded && <div className="absolute inset-0 skeleton" />}

          {/* Bottom fade gradient */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
            style={{
              background:
                "linear-gradient(to top, var(--bg-base) 0%, transparent 100%)",
            }}
          />
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

      {/* ── Scrollable body ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-7 pb-5 pt-5">
        {/* Title */}
        <h2 className="font-display text-[22px] font-medium leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)]">
          {bookmark.title}
        </h2>

        {/* Subtitle: siteName · by Author · X min read */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {siteName && (
            <span className="flex items-center gap-1.5 font-ui text-[12px] font-medium text-[var(--text-muted)]">
              <Globe size={12} className="shrink-0 opacity-60" />
              {siteName}
            </span>
          )}

          {author && (
            <>
              {siteName && (
                <span className="text-[var(--border-strong)]">&middot;</span>
              )}
              <span className="flex items-center gap-1.5 font-ui text-[12px] text-[var(--text-muted)]">
                <User size={12} className="shrink-0 opacity-60" />
                by {author}
              </span>
            </>
          )}

          {readingTime && (
            <>
              {(siteName || author) && (
                <span className="text-[var(--border-strong)]">&middot;</span>
              )}
              <span className="flex items-center gap-1.5 font-ui text-[12px] text-[var(--text-muted)]">
                <Clock size={12} className="shrink-0 opacity-60" />
                {readingTime} min read
              </span>
            </>
          )}
        </div>

        {/* Published / language / word-count context row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {bookmark.domain && (
            <span className="font-ui text-[11px] text-[var(--text-faint)]">
              {bookmark.domain}
            </span>
          )}
          {bookmark.domain && bookmark.savedAt && (
            <span className="text-[10px] text-[var(--border-strong)]">&middot;</span>
          )}
          {bookmark.savedAt && (
            <span className="font-ui text-[11px] text-[var(--text-faint)]">
              {bookmark.savedAt}
            </span>
          )}
          {publishedAt && (
            <>
              <span className="text-[10px] text-[var(--border-strong)]">&middot;</span>
              <span className="font-ui text-[11px] text-[var(--text-faint)]">
                Published {formatDate(publishedAt)}
              </span>
            </>
          )}
          {language && (
            <>
              <span className="text-[10px] text-[var(--border-strong)]">&middot;</span>
              <span className="rounded-[4px] bg-[var(--bg-raised)] px-1.5 py-[1px] font-ui text-[10px] font-medium uppercase tracking-[0.03em] text-[var(--text-faint)]">
                {language}
              </span>
            </>
          )}
          {wordCount !== undefined && (
            <>
              <span className="text-[10px] text-[var(--border-strong)]">&middot;</span>
              <span className="flex items-center gap-1 font-ui text-[11px] text-[var(--text-faint)]">
                <FileText size={10} className="opacity-50" />
                {fmtNum(wordCount)} words
              </span>
            </>
          )}
        </div>

        {/* Article type badge */}
        <div className="mt-3 mb-5 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-[5px] bg-[var(--accent-subtle)] px-2 py-[2px] font-ui text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--accent-text)]">
            <BookOpen size={10} />
            Article
          </span>
        </div>

        {/* Summary section */}
        <DetailSummary bookmark={bookmark} />

        {/* Topics + Entities */}
        {(hasTopics || hasEntities) && (
          <div className="mb-6 flex flex-col gap-4">
            {hasTopics && <DetailTopics topics={bookmark.enriched_data!.topics!} />}
            {hasEntities && <DetailEntities entities={bookmark.enriched_data!.entities!} />}
          </div>
        )}

        {/* Remaining metadata (non-structural) */}
        {hasMeta && (
          <DetailMetadata
            metadata={bookmark.enriched_data!.metadata!}
            excludeKeys={STRUCTURAL_KEYS}
          />
        )}

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
      {bookmark.url && <DetailFooter url={bookmark.url} label="Read article" />}
    </>
  );
}

/* ── Self-register ─────────────────────────────────────────────────── */
registerDetailView("link:article", ArticleDetailView);
