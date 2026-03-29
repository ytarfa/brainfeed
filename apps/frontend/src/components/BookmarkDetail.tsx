import React, { useState, useEffect } from "react";
import { X, ExternalLink, ChevronDown } from "lucide-react";
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

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!bookmark) return null;

  const renderMetadata = () => {
    if (!bookmark.metadata) return null;
    const entries = Object.entries(bookmark.metadata);
    return (
      <div className="mb-4 flex flex-wrap gap-2">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 font-ui text-[11px] text-[var(--text-secondary)]"
          >
            <span className="capitalize text-[var(--text-muted)]">{key}: </span>
            {typeof val === "number" ? val.toLocaleString() : val}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[200] bg-ink-DEFAULT/30 backdrop-blur-sm transition-opacity duration-[280ms]",
          visible ? "opacity-100" : "opacity-0",
          bookmark ? "pointer-events-auto" : "pointer-events-none",
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-[201] flex h-full w-[min(480px,94vw)] flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[-8px_0_32px_rgba(30,28,26,0.08)] transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          visible ? "translate-x-0" : "translate-x-full",
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

          {/* Summary */}
          {bookmark.summary && (
            <div className="mb-4">
              <p className="text-label mb-1.5 text-[var(--text-muted)]">Summary</p>
              <p className="whitespace-pre-line font-ui text-sm leading-relaxed text-[var(--text-secondary)]">
                {bookmark.summary}
              </p>
            </div>
          )}

          {/* Metadata */}
          {bookmark.metadata && (
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
      </aside>
    </>
  );
}
