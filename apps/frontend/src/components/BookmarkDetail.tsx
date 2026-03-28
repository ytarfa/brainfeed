import React, { useState, useEffect } from "react";
import type { Bookmark } from "../data/mock";
import { mockSpaces } from "../data/mock";

interface BookmarkDetailProps {
  bookmark: Bookmark | null;
  onClose: () => void;
}

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M8 1h3v3M11 1L6.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function BookmarkDetail({ bookmark, onClose }: BookmarkDetailProps) {
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

  // Overlay
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(30,28,26,0.3)",
    backdropFilter: "blur(2px)",
    zIndex: 200,
    opacity: visible ? 1 : 0,
    transition: "opacity 280ms ease",
    pointerEvents: bookmark ? "all" : "none",
  };

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    height: "100%",
    width: "min(480px, 94vw)",
    background: "var(--bg-base)",
    borderLeft: "1px solid var(--border-subtle)",
    boxShadow: "-8px 0 32px rgba(30,28,26,0.08)",
    zIndex: 201,
    display: "flex",
    flexDirection: "column",
    transform: visible ? "translateX(0)" : "translateX(100%)",
    transition: "transform 280ms cubic-bezier(0.32,0.72,0,1)",
    overflowY: "auto",
  };

  if (!bookmark) return null;

  const space = mockSpaces.find((s) => s.id === bookmark.spaceId);

  const renderMetadata = () => {
    if (!bookmark.metadata) return null;
    const entries = Object.entries(bookmark.metadata);
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {entries.map(([key, val]) => (
          <div
            key={key}
            style={{
              padding: "4px 10px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "var(--font-ui)",
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ textTransform: "capitalize", color: "var(--text-muted)" }}>{key}: </span>
            {typeof val === "number" ? val.toLocaleString() : val}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div style={overlayStyle} onClick={handleClose} />
      <aside style={panelStyle}>
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: bookmark.isArticle ? "italic" : "normal",
                fontWeight: 500,
                fontSize: 18,
                lineHeight: 1.3,
                color: "var(--text-primary)",
              }}
            >
              {bookmark.title}
            </h2>
            <p className="text-meta" style={{ marginTop: 4 }}>
              {bookmark.domain && `${bookmark.domain} · `}{bookmark.savedAt}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 7,
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
          {/* Thumbnail */}
          {bookmark.thumbnail_url && (
            <div
              style={{
                width: "100%",
                height: 180,
                background: "var(--bg-surface)",
                borderRadius: 8,
                marginBottom: 16,
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <img src={bookmark.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          {/* Summary */}
          {bookmark.summary && (
            <div style={{ marginBottom: 16 }}>
              <p className="text-label" style={{ marginBottom: 6, color: "var(--text-muted)" }}>Summary</p>
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-line",
                }}
              >
                {bookmark.summary}
              </p>
            </div>
          )}

          {/* Metadata */}
          {bookmark.metadata && (
            <div style={{ marginBottom: 16 }}>
              <p className="text-label" style={{ marginBottom: 8, color: "var(--text-muted)" }}>Details</p>
              {renderMetadata()}
            </div>
          )}

          {/* Tags */}
          <div style={{ marginBottom: 16 }}>
            <p className="text-label" style={{ marginBottom: 8, color: "var(--text-muted)" }}>Tags</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {bookmark.tags.map((tag) => (
                <span
                  key={tag.id}
                  style={{
                    padding: "3px 10px",
                    background: "var(--accent-subtle)",
                    color: "var(--accent-text)",
                    borderRadius: 20,
                    fontSize: 11,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    cursor: "default",
                  }}
                >
                  {tag.label}
                </span>
              ))}
              <button
                style={{
                  padding: "3px 10px",
                  background: "var(--bg-surface)",
                  border: "1px dashed var(--border-strong)",
                  color: "var(--text-muted)",
                  borderRadius: 20,
                  fontSize: 11,
                  fontFamily: "var(--font-ui)",
                  cursor: "pointer",
                }}
              >
                + Add tag
              </button>
            </div>
          </div>

          {/* Space */}
          <div style={{ marginBottom: 16 }}>
            <p className="text-label" style={{ marginBottom: 8, color: "var(--text-muted)" }}>Space</p>
            {space && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: "var(--font-ui)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: space.color }} />
                {space.name}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 2 }}>
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <p className="text-label" style={{ marginBottom: 8, color: "var(--text-muted)" }}>Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note…"
              style={{
                width: "100%",
                minHeight: 100,
                padding: "10px 12px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "var(--font-ui)",
                color: "var(--text-primary)",
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                transition: "border-color var(--transition-fast)",
              }}
              onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border-strong)")}
              onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border-subtle)")}
            />
          </div>
        </div>

        {/* Footer */}
        {bookmark.url && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--border-subtle)",
              flexShrink: 0,
            }}
          >
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontFamily: "var(--font-ui)",
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <ExternalIcon />
              Open original source
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
