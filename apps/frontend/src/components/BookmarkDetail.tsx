import React, { useState, useEffect } from "react";
import { X, ExternalLink, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import type { Bookmark } from "@brain-feed/types";

interface BookmarkDetailProps {
  bookmark: Bookmark | null;
  onClose: () => void;
  spaceName?: string;
  spaceColor?: string;
}

export default function BookmarkDetail({ bookmark, onClose, spaceName, spaceColor }: BookmarkDetailProps) {
  const [notes, setNotes] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setNotes(bookmark.notes || "");
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

  const renderMetadata = () => {
    const meta = bookmark.enriched_data?.metadata;
    if (!meta) return null;
    const entries = Object.entries(meta);
    return (
      <div className="mb-4 flex flex-wrap gap-2">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 font-ui text-[11px] text-[var(--text-secondary)]"
          >
            <span className="capitalize text-[var(--text-muted)]">{key}: </span>
            {typeof val === "number" ? val.toLocaleString() : String(val)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Overlay — backdrop blur + centering container */}
      <div
        className={cn(
          "fixed inset-0 z-[200] flex items-center justify-center bg-ink-DEFAULT/30 backdrop-blur-sm transition-opacity duration-[280ms]",
          visible ? "opacity-100" : "opacity-0",
          bookmark ? "pointer-events-auto" : "pointer-events-none",
        )}
        onClick={handleClose}
      >

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-[min(800px,88vh)] w-[min(800px,94vw)] flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-xl transition-all duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          visible ? "scale-100 opacity-100" : "scale-[0.96] opacity-0",
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2
              className={cn(
                "font-display text-lg font-medium leading-[1.3] text-[var(--text-primary)]",
                bookmark.isArticle && "italic",
              )}
            >
              {bookmark.title}
            </h2>
            <p className="text-meta mt-1">
              {bookmark.domain && `${bookmark.domain} · `}{bookmark.savedAt}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Thumbnail */}
          {bookmark.thumbnail_url && (
            <div className="mb-4 h-[180px] w-full overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <img src={bookmark.thumbnail_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          {/* Summary — prefer enriched AI summary, fall back to description */}
          {(() => {
            const enrichedSummary = bookmark.enriched_data?.summary;
            const displaySummary = enrichedSummary || bookmark.summary;
            const isEnriching =
              bookmark.enrichment_status === "pending" ||
              bookmark.enrichment_status === "processing";
            const isFailed = bookmark.enrichment_status === "failed";

            return (
              <div className="mb-4">
                <p className="text-label mb-1.5 text-[var(--text-muted)]">Summary</p>
                {displaySummary ? (
                  <>
                    <p className="whitespace-pre-line font-ui text-sm leading-relaxed text-[var(--text-secondary)]">
                      {displaySummary}
                    </p>
                    {enrichedSummary && (
                      <p className="mt-1 font-ui text-[10px] text-[var(--text-muted)]">
                        AI-generated summary
                      </p>
                    )}
                  </>
                ) : isEnriching ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                    <span className="font-ui text-[13px] text-[var(--text-muted)]">
                      Generating summary…
                    </span>
                  </div>
                ) : isFailed ? (
                  <div className="flex items-center gap-2 py-2">
                    <AlertCircle size={14} className="text-[var(--status-error)]" />
                    <span className="font-ui text-[13px] text-[var(--text-muted)]">
                      Summary generation failed
                    </span>
                  </div>
                ) : (
                  <p className="font-ui text-sm text-[var(--text-muted)]">
                    No summary available.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Topics — from enriched data */}
          {bookmark.enriched_data?.topics && bookmark.enriched_data.topics.length > 0 && (
            <div className="mb-4">
              <p className="text-label mb-2 text-[var(--text-muted)]">Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {bookmark.enriched_data.topics.map((topic) => (
                  <span
                    key={topic}
                    className="cursor-default rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-[3px] font-ui text-[11px] text-[var(--text-secondary)]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Entities — from enriched data */}
          {bookmark.enriched_data?.entities && bookmark.enriched_data.entities.length > 0 && (
            <div className="mb-4">
              <p className="text-label mb-2 text-[var(--text-muted)]">Entities</p>
              <div className="flex flex-wrap gap-2">
                {bookmark.enriched_data.entities.map((entity) => (
                  <div
                    key={`${entity.name}-${entity.type}`}
                    className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 font-ui text-[11px] text-[var(--text-secondary)]"
                  >
                    <span className="capitalize text-[var(--text-muted)]">{entity.type}: </span>
                    {entity.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata — from enriched data */}
          {bookmark.enriched_data?.metadata && (
            <div className="mb-4">
              <p className="text-label mb-2 text-[var(--text-muted)]">Details</p>
              {renderMetadata()}
            </div>
          )}

          {/* Tags */}
          <div className="mb-4">
            <p className="text-label mb-2 text-[var(--text-muted)]">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {bookmark.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="cursor-default rounded-full bg-[var(--accent-subtle)] px-2.5 py-[3px] font-ui text-[11px] font-medium text-[var(--accent-text)]"
                >
                  {tag.label}
                </span>
              ))}
              <button className="rounded-full border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-[3px] font-ui text-[11px] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent-text)]">
                + Add tag
              </button>
            </div>
          </div>

          {/* Space */}
          <div className="mb-4">
            <p className="text-label mb-2 text-[var(--text-muted)]">Space</p>
            {spaceName && (
              <div className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-[5px] font-ui text-[13px] text-[var(--text-primary)] hover:border-[var(--border-strong)]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: spaceColor ?? "var(--text-muted)" }}
                />
                {spaceName}
                <ChevronDown size={10} className="ml-0.5" />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <p className="text-label mb-2 text-[var(--text-muted)]">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note..."
              className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 font-ui text-[13px] leading-relaxed text-[var(--text-primary)] outline-none transition-[border-color] duration-[var(--transition-fast)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)]"
            />
          </div>
        </div>

        {/* Footer */}
        {bookmark.url && (
          <div className="shrink-0 border-t border-[var(--border-subtle)] px-5 py-3">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-ui text-[13px] font-medium text-[var(--accent)] hover:underline"
            >
              <ExternalLink size={12} />
              Open original source
            </a>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
