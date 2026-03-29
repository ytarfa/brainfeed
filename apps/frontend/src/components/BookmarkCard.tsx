import React, { useState } from "react";
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

interface BookmarkCardProps {
  bookmark: Bookmark;
  view: "grid" | "list";
  onClick: () => void;
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

export default function BookmarkCard({ bookmark, view, onClick, showSpace = false, spaceName, spaceColor, index = 0, readonly = false }: BookmarkCardProps) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isArticle = bookmark.isArticle || bookmark.source_type === "paper";
  const isGrid = view === "grid";

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  };

  return (
    <article
      className={cn(
        "relative cursor-pointer rounded-[10px] border bg-[var(--bg-raised)] transition-[border-color,transform,box-shadow] duration-[var(--transition-fast)]",
        isGrid ? "block p-[14px_14px_12px]" : "flex items-start gap-3 p-[12px_16px]",
        hovered
          ? "border-[var(--border-strong)] -translate-y-px shadow-md"
          : "border-[var(--border-subtle)] translate-y-0 shadow-none",
      )}
      style={{ animation: `fade-in 240ms ${index * 30}ms both` }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      aria-label={bookmark.title ?? undefined}
    >
      {/* Thumbnail (grid only) */}
      {isGrid && bookmark.thumbnail_url && (
        <div className="mb-2.5 h-[120px] w-full overflow-hidden rounded-md bg-[var(--bg-surface)]">
          <img
            src={bookmark.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Type badge + space badge */}
      <div className={cn(
        "flex items-center gap-1.5",
        isGrid ? "mb-2" : "order-[-1] shrink-0",
      )}>
        <span className="inline-flex items-center gap-1 rounded-sm border border-terra-100 bg-[var(--accent-subtle)] px-1.5 py-0.5 font-ui text-2xs font-medium text-[var(--accent-text)]">
          {typeIcons[bookmark.source_type ?? ""] || <Diamond size={10} />}
          {bookmark.source_type}
        </span>

        {showSpace && spaceName && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-ui text-2xs font-medium text-[var(--text-secondary)]">
            <span
              className="h-[5px] w-[5px] shrink-0 rounded-full"
              style={{ background: spaceColor ?? "var(--text-muted)" }}
            />
            {spaceName}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            "font-display text-[15px] font-medium leading-[1.35] text-[var(--text-primary)] line-clamp-2",
            isGrid ? "mb-1.5 line-clamp-2" : "mb-1 line-clamp-1",
            isArticle && "italic",
          )}
        >
          {bookmark.title}
        </h3>

        {bookmark.summary && (
          <p className={cn(
            "mb-2 font-ui text-[13px] leading-[1.55] text-[var(--text-secondary)]",
            isGrid ? "line-clamp-3" : "line-clamp-2",
          )}>
            {bookmark.summary}
          </p>
        )}

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {bookmark.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-[var(--accent-subtle)] px-[7px] py-0.5 font-ui text-2xs font-medium text-[var(--accent-text)]"
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-meta">
            {bookmark.domain && `${bookmark.domain} · `}{bookmark.savedAt}
          </span>

          {!readonly && (
            <div className="relative">
              <button
                onClick={handleMoreClick}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-[5px] text-[var(--text-muted)] transition-[background] duration-[var(--transition-fast)]",
                  menuOpen ? "bg-[var(--bg-surface)]" : "bg-transparent",
                  hovered ? "opacity-100" : "opacity-0",
                )}
                aria-label="More options"
              >
                <MoreVertical size={14} />
              </button>

              {menuOpen && (
                <div
                  className="absolute bottom-7 right-0 z-[100] min-w-[140px] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] shadow-lg animate-slide-in-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left font-ui text-[13px] transition-[background] duration-[var(--transition-fast)] hover:bg-[var(--bg-surface)]",
                        item.danger ? "text-error" : "text-[var(--text-primary)]",
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
