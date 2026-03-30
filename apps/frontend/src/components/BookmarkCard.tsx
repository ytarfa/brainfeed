import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Code2,
  Play,
  AtSign,
  Newspaper,
  ShoppingCart,
  GraduationCap,
  Diamond,
  PenLine,
  ImageIcon,
  FileText,
  File,
  MessageCircle,
  Music,
  MoreVertical,
  ArrowRight,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { Bookmark } from "@brain-feed/types";
import renderSourceMeta from "./BookmarkCard/variants/renderSourceMeta";
import ThumbnailPlaceholder from "./ThumbnailPlaceholder";

interface BookmarkCardProps {
  bookmark: Bookmark;
  view: "grid" | "list";
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
  twitter: <AtSign size={10} />,
  news: <Newspaper size={10} />,
  amazon: <ShoppingCart size={10} />,
  paper: <GraduationCap size={10} />,
  generic: <Diamond size={10} />,
  note: <PenLine size={10} />,
  image: <ImageIcon size={10} />,
  pdf: <FileText size={10} />,
  file: <File size={10} />,
  reddit: <MessageCircle size={10} />,
  spotify: <Music size={10} />,
};

const menuItems = [
  { label: "Move to Space", icon: <ArrowRight size={13} />, danger: false },
  { label: "Open source", icon: <ExternalLink size={13} />, danger: false },
  { label: "Delete", icon: <Trash2 size={13} />, danger: true },
];

export default function BookmarkCard({ bookmark, view, onClick, onDelete, isDeleting = false, isExiting = false, showSpace = false, spaceName, spaceColor, index = 0, readonly = false }: BookmarkCardProps) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isArticle = bookmark.isArticle || bookmark.source_type === "paper";
  const isGrid = view === "grid";
  const hasThumbnail = isGrid && !!bookmark.thumbnail_url;

  const disabled = isDeleting || isExiting;
  const sourceMeta = renderSourceMeta(bookmark);

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
        isGrid ? "block" : "flex items-start gap-4 p-[14px_18px]",
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

      {/* ── Thumbnail / Placeholder (grid only) ── */}
      {isGrid && (hasThumbnail ? (
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
          {/* Type badge floating on thumbnail */}
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-[3px] font-ui text-2xs font-medium text-white/90 backdrop-blur-sm"
              style={{ background: "rgba(0, 0, 0, 0.55)" }}
            >
              {typeIcons[bookmark.source_type ?? ""] || <Diamond size={10} />}
              {bookmark.source_type}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative h-[140px] w-full overflow-hidden">
          <ThumbnailPlaceholder sourceType={bookmark.source_type} height={140} />
          {/* Type badge floating on placeholder */}
          <div className="absolute left-3 top-3 z-[1]">
            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-[3px] font-ui text-2xs font-medium text-white/90 backdrop-blur-sm"
              style={{ background: "rgba(0, 0, 0, 0.55)" }}
            >
              {typeIcons[bookmark.source_type ?? ""] || <Diamond size={10} />}
              {bookmark.source_type}
            </span>
          </div>
        </div>
      ))}

      {/* ── Card body ── */}
      <div className={cn(
        isGrid ? "px-[16px] pt-[12px] pb-[14px]" : "min-w-0 flex-1",
      )}>
        {/* Type badge + space badge (list view only — grid has badges on placeholder/thumbnail) */}
        {!isGrid && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-[3px] font-ui text-2xs font-medium text-[var(--text-muted)]">
              {typeIcons[bookmark.source_type ?? ""] || <Diamond size={10} />}
              {bookmark.source_type}
            </span>

            {showSpace && spaceName && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-[3px] font-ui text-2xs font-medium text-[var(--text-secondary)]">
                <span
                  className="h-[5px] w-[5px] shrink-0 rounded-full"
                  style={{ background: spaceColor ?? "var(--text-muted)" }}
                />
                {spaceName}
              </span>
            )}
          </div>
        )}

        {/* Space badge (grid view — show inline below thumbnail/placeholder) */}
        {isGrid && showSpace && spaceName && (
          <div className="mb-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-[3px] font-ui text-2xs font-medium text-[var(--text-secondary)]">
              <span
                className="h-[5px] w-[5px] shrink-0 rounded-full"
                style={{ background: spaceColor ?? "var(--text-muted)" }}
              />
              {spaceName}
            </span>
          </div>
        )}

        {/* Title */}
        <h3
          className={cn(
            "font-display text-[15px] font-medium leading-[1.35] text-[var(--text-primary)]",
            isGrid ? "mb-1 line-clamp-2" : "mb-0.5 line-clamp-1",
            isArticle && "italic",
          )}
        >
          {bookmark.title}
        </h3>

        {/* Source-specific metadata line (factory pattern) */}
        {sourceMeta}

        {/* Summary — prefer enriched AI summary, fall back to description */}
        {(bookmark.enriched_data?.summary || bookmark.summary) && (
          <p className={cn(
            "font-ui text-[13px] leading-[1.55] text-[var(--text-secondary)]",
            isGrid ? "mb-2.5 line-clamp-3" : "mb-2 line-clamp-2",
          )}>
            {bookmark.enriched_data?.summary || bookmark.summary}
          </p>
        )}

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1">
            {bookmark.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-[2px] font-ui text-2xs font-medium text-[var(--text-secondary)] transition-colors duration-150"
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Meta row — domain, saved time, more button */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 text-meta">
            {bookmark.domain && (
              <>
                <span className="max-w-[140px] truncate">{bookmark.domain}</span>
                <span className="text-[var(--border-strong)]">&middot;</span>
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
