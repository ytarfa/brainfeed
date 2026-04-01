import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Code2,
  Play,
  Diamond,
  MoreVertical,
  ArrowRight,
  ExternalLink,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "../lib/utils";
import { isEnriching, isEnrichmentFailed, getEnrichmentDisplay } from "../lib/bookmark-status";
import type { Bookmark } from "@brain-feed/types";
import ThumbnailPlaceholder from "./ThumbnailPlaceholder";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick: () => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  isExiting?: boolean;
  showSpace?: boolean;
  spaceName?: string;
  spaceColor?: string;
  index?: number;
  readonly?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  github: <Code2 size={10} />,
  youtube: <Play size={10} />,
  generic: <Diamond size={10} />,
};

const menuItems = [
  { label: "Move to Space", icon: <ArrowRight size={13} />, danger: false },
  { label: "Open source", icon: <ExternalLink size={13} />, danger: false },
  { label: "Delete", icon: <Trash2 size={13} />, danger: true },
];

export default function BookmarkCard({ bookmark, onClick, onDelete, isDeleting = false, isExiting = false, index = 0, readonly = false }: BookmarkCardProps) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasThumbnail = !!bookmark.thumbnail_url;

  const disabled = isDeleting || isExiting;

  // Capture card height for collapse animation
  useEffect(() => {
    if (isExiting && cardRef.current) {
      const h = cardRef.current.offsetHeight;
      cardRef.current.style.setProperty("--card-height", `${h}px`);
    }
  }, [isExiting]);

  // Close menu when delete starts
  useEffect(() => {
    if (isDeleting) setMenuOpen(false);
  }, [isDeleting]);

  const handleMoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  }, []);

  const handleMenuAction = (e: React.MouseEvent, label: string) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (label === "Delete" && onDelete) {
      onDelete(bookmark.id);
    } else if (label === "Open source" && bookmark.url) {
      window.open(bookmark.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <article
      ref={cardRef}
      className={cn(
        "group/card relative cursor-pointer overflow-hidden rounded-xl border",
        "block",
        // Default state
        !disabled && (hovered
          ? "border-[var(--border-strong)]"
          : "border-[var(--border-subtle)]"),
        // Pending delete: pulsing border
        isDeleting && !isExiting && "animate-delete-pulse pointer-events-none",
        // Exit phase: card shrinks, fades, then collapses
        isExiting && "pointer-events-none animate-card-exit",
        // Transition for default hover state (not during animations)
        !disabled && "transition-[border-color,transform,box-shadow] duration-200",
      )}
      style={{
        animation: isExiting
          ? undefined
          : `fade-in 240ms ${index * 30}ms both`,
        background: "var(--bg-raised)",
        boxShadow: !disabled
          ? (hovered ? "var(--card-shadow-hover), var(--card-glow)" : "var(--card-shadow)")
          : undefined,
        transform: !disabled && hovered ? "translateY(-2px)" : undefined,
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { if (!disabled) { setHovered(false); setMenuOpen(false); } }}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => !disabled && e.key === "Enter" && onClick()}
      role="button"
      aria-label={bookmark.title ?? undefined}
    >
      {/* Deleting shimmer overlay */}
      {isDeleting && !isExiting && (
        <div className="absolute inset-0 z-50 overflow-hidden rounded-xl pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              background: "linear-gradient(90deg, transparent 25%, var(--color-error) 50%, transparent 75%)",
              backgroundSize: "400px 100%",
              animation: "shimmer 1.2s infinite linear",
            }}
          />
        </div>
      )}

      {/* ── Thumbnail / Placeholder ── */}
      {hasThumbnail ? (
        <div className="relative h-[140px] w-full overflow-hidden bg-[var(--bg-surface)]">
          <img
            src={bookmark.thumbnail_url!}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300"
            style={{
              transform: hovered ? "scale(1.03)" : "scale(1)",
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {/* Gradient fade at bottom of thumbnail */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "var(--thumbnail-overlay)" }}
          />
        </div>
      ) : (
        <div className="relative h-[140px] w-full overflow-hidden">
          <ThumbnailPlaceholder sourceType={bookmark.source_type} height={140} />
        </div>
      )}

      {/* ── Card body ── */}
      <div className="px-4 pt-3 pb-3">
        {/* Title — the hero element */}
        <h3
          className="font-display font-medium leading-[1.35] text-[var(--text-primary)] mb-2 text-[15px] line-clamp-2"
        >
          {bookmark.title}
        </h3>

        {/* Enrichment status indicator */}
        {isEnriching(bookmark.enrichment_status) && (
          <div
            className="flex items-center gap-1.5 font-ui text-2xs mb-2"
            data-testid="enrichment-loading"
          >
            <Loader2
              size={11}
              className="text-[var(--accent)]"
              style={{ animation: "spin 1.2s linear infinite" }}
            />
            <span className="text-[var(--text-muted)]" style={{ animation: "var(--animate-enrichment-breathe)" }}>
              {getEnrichmentDisplay(bookmark.enrichment_status)?.label}
            </span>
          </div>
        )}
        {isEnrichmentFailed(bookmark.enrichment_status) && (
          <div
            className="flex items-center gap-1.5 font-ui text-2xs mb-2"
            data-testid="enrichment-failed"
          >
            <AlertCircle size={11} className="text-[var(--color-error)]" />
            <span className="text-[var(--color-error)] opacity-80">
              {getEnrichmentDisplay(bookmark.enrichment_status)?.label}
            </span>
          </div>
        )}

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {bookmark.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-[1px] font-ui text-2xs text-[var(--text-muted)] transition-colors duration-150"
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Meta row — domain, saved time, more button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-ui text-2xs tracking-wide text-[var(--text-muted)]">
            {bookmark.domain && (
              <>
                <span className="max-w-[140px] truncate">{bookmark.domain}</span>
                <span className="opacity-40">&middot;</span>
              </>
            )}
            <span>{bookmark.savedAt}</span>
          </div>

          {!readonly && (
            <div className="relative">
              <button
                onClick={handleMoreClick}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-all duration-150",
                  menuOpen
                    ? "bg-[var(--bg-surface)] opacity-100"
                    : "bg-transparent",
                  hovered ? "opacity-100" : "opacity-0",
                )}
                aria-label="More options"
              >
                <MoreVertical size={14} />
              </button>

              {menuOpen && (
                <div
                  className="absolute bottom-7 right-0 z-[100] min-w-[152px] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] py-1 animate-slide-in-up"
                  style={{ boxShadow: "var(--shadow-lg)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={(e) => handleMenuAction(e, item.label)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-[7px] text-left font-ui text-[13px] transition-colors duration-100",
                        item.danger
                          ? "text-error hover:bg-error/5"
                          : "text-[var(--text-primary)] hover:bg-[var(--bg-surface)]",
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
