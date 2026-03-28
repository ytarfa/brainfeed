import React, { useState } from "react";
import type { Bookmark } from "../data/mock";
import { mockSpaces } from "../data/mock";

interface BookmarkCardProps {
  bookmark: Bookmark;
  view: "grid" | "list";
  onClick: () => void;
  showSpace?: boolean;
  index?: number;
  readonly?: boolean;
}

const typeIcons: Record<string, string> = {
  github: "⬡",
  youtube: "▶",
  twitter: "𝕏",
  news: "◉",
  amazon: "☆",
  paper: "∫",
  generic: "◈",
  note: "✎",
  image: "⬜",
  pdf: "⊞",
  file: "⊟",
  reddit: "◎",
  spotify: "♪",
};

const typeColors: Record<string, string> = {
  github: "#24292e",
  youtube: "#ff0000",
  twitter: "#1da1f2",
  news: "#d4845a",
  amazon: "#ff9900",
  paper: "#4a7a5b",
  generic: "#6a6660",
  note: "#8b5e3c",
  image: "#a8916e",
  pdf: "#c0392b",
  file: "#6a6660",
  reddit: "#ff4500",
  spotify: "#1db954",
};

const MoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="3" r="1" fill="currentColor" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
    <circle cx="7" cy="11" r="1" fill="currentColor" />
  </svg>
);

export default function BookmarkCard({ bookmark, view, onClick, showSpace = false, index = 0, readonly = false }: BookmarkCardProps) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const space = mockSpaces.find((s) => s.id === bookmark.spaceId);
  const isArticle = bookmark.isArticle || bookmark.sourceType === "paper";

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-raised)",
    border: `1px solid ${hovered ? "var(--border-strong)" : "var(--border-subtle)"}`,
    borderRadius: 10,
    padding: view === "grid" ? "14px 14px 12px" : "12px 16px",
    cursor: "pointer",
    transition: "border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)",
    transform: hovered ? "translateY(-1px)" : "none",
    boxShadow: hovered ? "0 4px 16px rgba(30,28,26,0.07)" : "none",
    animation: `fadeIn 240ms ${index * 30}ms both`,
    display: view === "list" ? "flex" : "block",
    alignItems: view === "list" ? "flex-start" : undefined,
    gap: view === "list" ? 12 : undefined,
    position: "relative",
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "var(--font-display)",
    fontStyle: isArticle ? "italic" : "normal",
    fontWeight: 500,
    fontSize: 15,
    lineHeight: 1.35,
    color: "var(--text-primary)",
    marginBottom: view === "grid" ? 6 : 4,
    display: "-webkit-box",
    WebkitLineClamp: view === "grid" ? 2 : 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  };

  return (
    <article
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      aria-label={bookmark.title}
    >
      {/* Thumbnail (grid only) */}
      {view === "grid" && bookmark.thumbnail && (
        <div
          style={{
            width: "100%",
            height: 120,
            background: "var(--bg-surface)",
            borderRadius: 6,
            marginBottom: 10,
            overflow: "hidden",
          }}
        >
          <img
            src={bookmark.thumbnail}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Type badge + actions row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: view === "grid" ? 8 : 0, order: view === "list" ? -1 : undefined, flexShrink: 0 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 6px",
            background: "var(--accent-subtle)",
            border: `1px solid var(--terra-100)`,
            borderRadius: 4,
            fontSize: 10,
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            color: "var(--accent-text)",
          }}
        >
          <span style={{ fontSize: 9 }}>{typeIcons[bookmark.sourceType] || "◈"}</span>
          {bookmark.sourceType}
        </span>

        {showSpace && space && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 6px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 4,
              fontSize: 10,
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: space.color, flexShrink: 0 }} />
            {space.name}
          </span>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={titleStyle}>{bookmark.title}</h3>

        {bookmark.summary && (
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 13,
              lineHeight: 1.55,
              color: "var(--text-secondary)",
              display: "-webkit-box",
              WebkitLineClamp: view === "grid" ? 3 : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            {bookmark.summary}
          </p>
        )}

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {bookmark.tags.map((tag) => (
              <span
                key={tag.id}
                style={{
                  padding: "2px 7px",
                  background: "var(--accent-subtle)",
                  color: "var(--accent-text)",
                  borderRadius: 20,
                  fontSize: 10,
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span className="text-meta">
            {bookmark.domain && `${bookmark.domain} · `}{bookmark.savedAt}
          </span>

          {!readonly && (
            <div style={{ position: "relative" }}>
              <button
                onClick={handleMoreClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  color: "var(--text-muted)",
                  background: menuOpen ? "var(--bg-surface)" : "transparent",
                  transition: "background var(--transition-fast)",
                  opacity: hovered ? 1 : 0,
                }}
                aria-label="More options"
              >
                <MoreIcon />
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 28,
                    right: 0,
                    background: "var(--bg-raised)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(30,28,26,0.12)",
                    minWidth: 140,
                    zIndex: 100,
                    overflow: "hidden",
                    animation: "slideInUp 120ms both",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {[
                    { label: "Move to Space", icon: "→" },
                    { label: "Open source", icon: "↗" },
                    { label: "Delete", icon: "✕", danger: true },
                  ].map((item) => (
                    <button
                      key={item.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 12px",
                        fontSize: 13,
                        fontFamily: "var(--font-ui)",
                        color: item.danger ? "var(--color-error)" : "var(--text-primary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-surface)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <span style={{ width: 14, textAlign: "center", fontSize: 11 }}>{item.icon}</span>
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
