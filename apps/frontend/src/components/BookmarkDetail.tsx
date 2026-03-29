import React, { useState, useEffect, useRef } from "react";
import { X, ExternalLink, ChevronDown, Loader2, AlertCircle, ArrowUpRight, Hash, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import type { Bookmark } from "@brain-feed/types";
import ThumbnailPlaceholder from "./ThumbnailPlaceholder";

interface BookmarkDetailProps {
  bookmark: Bookmark | null;
  onClose: () => void;
  spaceName?: string;
  spaceColor?: string;
}

export default function BookmarkDetail({ bookmark, onClose, spaceName, spaceColor }: BookmarkDetailProps) {
  const [notes, setNotes] = useState("");
  const [visible, setVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bookmark) {
      setNotes(bookmark.notes || "");
      setImgLoaded(false);
      setImgError(false);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [bookmark]);

  useEffect(() => {
    if (!bookmark) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bookmark]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!bookmark) return null;

  const enrichedSummary = bookmark.enriched_data?.summary;
  const displaySummary = enrichedSummary || bookmark.summary;
  const isEnriching =
    bookmark.enrichment_status === "pending" ||
    bookmark.enrichment_status === "processing";
  const isFailed = bookmark.enrichment_status === "failed";
  const hasThumbnail = bookmark.thumbnail_url && !imgError;
  const hasTopics = bookmark.enriched_data?.topics && bookmark.enriched_data.topics.length > 0;
  const hasEntities = bookmark.enriched_data?.entities && bookmark.enriched_data.entities.length > 0;
  const hasMeta = bookmark.enriched_data?.metadata;

  const metaEntries = hasMeta ? Object.entries(bookmark.enriched_data!.metadata!) : [];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[200] flex items-center justify-center transition-all duration-[320ms]",
          visible ? "opacity-100" : "opacity-0",
          bookmark ? "pointer-events-auto" : "pointer-events-none",
        )}
        onClick={handleClose}
        style={{
          background: visible
            ? "rgba(30, 28, 26, 0.45)"
            : "rgba(30, 28, 26, 0)",
          backdropFilter: visible ? "blur(12px) saturate(0.8)" : "blur(0px)",
          WebkitBackdropFilter: visible ? "blur(12px) saturate(0.8)" : "blur(0px)",
        }}
      >

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex max-h-[min(860px,90vh)] w-[min(720px,94vw)] flex-col overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-base)] transition-all duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          visible ? "scale-100 opacity-100" : "scale-[0.94] opacity-0 translate-y-3",
        )}
        style={{
          boxShadow: visible
            ? "0 24px 80px rgba(30, 28, 26, 0.18), 0 8px 24px rgba(30, 28, 26, 0.08), 0 0 0 1px rgba(30, 28, 26, 0.03)"
            : "0 0 0 rgba(0,0,0,0)",
        }}
      >
        {/* Close button — floating over content */}
        <button
          onClick={handleClose}
          className={cn(
            "absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
            hasThumbnail
              ? "bg-black/30 text-white/90 backdrop-blur-sm hover:bg-black/50"
              : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]",
          )}
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        {/* Hero image — tall, edge-to-edge, with gradient fade */}
        {hasThumbnail ? (
          <div className="relative w-full shrink-0 overflow-hidden bg-[var(--bg-surface)]" style={{ minHeight: 260, maxHeight: 320 }}>
            <img
              src={bookmark.thumbnail_url!}
              alt=""
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-500",
                imgLoaded ? "opacity-100" : "opacity-0",
              )}
              style={{ minHeight: 260, maxHeight: 320 }}
            />
            {/* Subtle gradient at bottom for text readability */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
              style={{
                background: "linear-gradient(to top, var(--bg-base) 0%, transparent 100%)",
              }}
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
        <div
          ref={bodyRef}
          className={cn(
            "flex-1 overflow-y-auto px-7 pb-5 pt-1",
          )}
        >
          {/* Title area */}
          <div className="mb-5">
            <h2
              className={cn(
                "font-display text-[22px] font-medium leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)]",
                bookmark.isArticle && "italic",
              )}
            >
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
          <div className="mb-6">
            {displaySummary ? (
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
            ) : isEnriching ? (
              <div className="flex items-center gap-2.5 rounded-xl bg-[var(--bg-surface)] px-5 py-4">
                <Loader2 size={15} className="animate-spin text-[var(--accent)]" />
                <span className="font-ui text-[13px] text-[var(--text-muted)]">
                  Generating summary&hellip;
                </span>
              </div>
            ) : isFailed ? (
              <div className="flex items-center gap-2.5 rounded-xl bg-[var(--bg-surface)] px-5 py-4">
                <AlertCircle size={15} className="text-error" />
                <span className="font-ui text-[13px] text-[var(--text-muted)]">
                  Summary generation failed
                </span>
              </div>
            ) : (
              <p className="font-ui text-[13px] italic text-[var(--text-muted)]">
                No summary available.
              </p>
            )}
          </div>

          {/* Topics + Entities inline row */}
          {(hasTopics || hasEntities) && (
            <div className="mb-6 flex flex-col gap-4">
              {hasTopics && (
                <div>
                  <p className="text-label mb-2 text-[var(--text-muted)]">Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bookmark.enriched_data!.topics!.map((topic, i) => (
                      <span
                        key={topic}
                        className="cursor-default rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-[4px] font-ui text-[11.5px] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hasEntities && (
                <div>
                  <p className="text-label mb-2 text-[var(--text-muted)]">Entities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bookmark.enriched_data!.entities!.map((entity) => (
                      <div
                        key={`${entity.name}-${entity.type}`}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-[4px] font-ui text-[11.5px] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-strong)]"
                      >
                        <span className="text-[10px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                          {entity.type}
                        </span>
                        <span className="h-2.5 w-px bg-[var(--border-subtle)]" />
                        {entity.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metadata chips */}
          {hasMeta && metaEntries.length > 0 && (
            <div className="mb-6">
              <p className="text-label mb-2 text-[var(--text-muted)]">Details</p>
              <div className="flex flex-wrap gap-2">
                {metaEntries.map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-[4px] font-ui text-[11.5px]"
                  >
                    <span className="text-[10px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                      {key}
                    </span>
                    <span className="h-2.5 w-px bg-[var(--border-subtle)]" />
                    <span className="text-[var(--text-secondary)]">
                      {typeof val === "number" ? val.toLocaleString() : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="mb-5 h-px bg-[var(--border-subtle)]" />

          {/* Tags */}
          <div className="mb-5">
            <p className="text-label mb-2 text-[var(--text-muted)]">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {bookmark.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="flex cursor-default items-center gap-1 rounded-full bg-[var(--accent-subtle)] px-2.5 py-[3px] font-ui text-[11px] font-medium text-[var(--accent-text)]"
                >
                  <Hash size={9} strokeWidth={2.5} className="opacity-60" />
                  {tag.label}
                </span>
              ))}
              <button className="rounded-full border border-dashed border-[var(--border-strong)] bg-transparent px-2.5 py-[3px] font-ui text-[11px] text-[var(--text-muted)] transition-colors duration-150 hover:border-[var(--accent)] hover:text-[var(--accent-text)]">
                + Add tag
              </button>
            </div>
          </div>

          {/* Space */}
          {spaceName && (
            <div className="mb-5">
              <p className="text-label mb-2 text-[var(--text-muted)]">Space</p>
              <div className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-[6px] font-ui text-[13px] text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--border-strong)]">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-2 ring-[var(--bg-base)]"
                  style={{ background: spaceColor ?? "var(--text-muted)" }}
                />
                {spaceName}
                <ChevronDown size={11} className="ml-0.5 text-[var(--text-muted)]" />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-2">
            <p className="text-label mb-2 text-[var(--text-muted)]">Notes</p>
            <textarea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Add a note..."
              className="w-full min-h-[90px] resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 font-ui text-[13px] leading-relaxed text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-subtle)]"
            />
          </div>
        </div>

        {/* Footer */}
        {bookmark.url && (
          <div className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 px-7 py-3.5">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 font-ui text-[13px] font-medium text-[var(--accent)] transition-colors duration-150 hover:text-[var(--accent-text)]"
            >
              <ExternalLink size={13} strokeWidth={2} />
              Open original source
              <ArrowUpRight size={11} className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
            </a>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
