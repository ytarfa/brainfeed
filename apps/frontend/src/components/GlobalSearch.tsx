import React, { useState, useEffect, useRef } from "react";
import { mockBookmarks, mockSpaces } from "../data/mock";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  onSelect: (bookmarkId: string) => void;
}

export default function GlobalSearch({ open, onClose, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => inputRef.current?.focus(), 80);
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const results = query.trim().length > 1
    ? mockBookmarks.filter((b) =>
        (b.title ?? "").toLowerCase().includes(query.toLowerCase()) ||
        b.summary?.toLowerCase().includes(query.toLowerCase()) ||
        b.domain?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(30,28,26,0.35)",
    backdropFilter: "blur(3px)",
    zIndex: 400,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "12vh",
    padding: "12vh 16px 16px",
    opacity: visible ? 1 : 0,
    transition: "opacity 200ms ease",
    pointerEvents: open ? "all" : "none",
  };

  const panelStyle: React.CSSProperties = {
    background: "var(--bg-base)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 14,
    boxShadow: "0 24px 64px rgba(30,28,26,0.18)",
    width: "100%",
    maxWidth: 560,
    overflow: "hidden",
    transform: visible ? "translateY(0)" : "translateY(-12px)",
    transition: "transform 200ms cubic-bezier(0.32,0.72,0,1)",
  };

  if (!open && !visible) return null;

  const getSpace = (spaceId: string) => mockSpaces.find((s) => s.id === spaceId);

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 16px",
            borderBottom: query && results.length > 0 ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && handleClose()}
            placeholder="Search everything…"
            style={{
              flex: 1,
              height: 52,
              fontSize: 16,
              fontFamily: "var(--font-ui)",
              color: "var(--text-primary)",
              background: "transparent",
              border: "none",
              outline: "none",
            }}
          />
          <kbd
            style={{
              fontSize: 10,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 4,
              padding: "2px 6px",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
            onClick={handleClose}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        {query && results.length > 0 && (
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {results.map((b, i) => {
              const space = getSpace(b.spaceId);
              return (
                <button
                  key={b.id}
                  onClick={() => { onSelect(b.id); handleClose(); }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    width: "100%",
                    padding: "12px 16px",
                    background: "transparent",
                    border: "none",
                    borderBottom: i < results.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-surface)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontStyle: b.isArticle ? "italic" : "normal",
                        fontWeight: 500,
                        fontSize: 14,
                        color: "var(--text-primary)",
                        marginBottom: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.title}
                    </p>
                    {b.summary && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {b.summary}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    {space && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 7px",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 4,
                          fontSize: 10,
                          fontFamily: "var(--font-ui)",
                          fontWeight: 500,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: space.color }} />
                        {space.name}
                      </span>
                    )}
                    <span className="text-meta">{b.domain}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {query && results.length === 0 && (
          <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No results for <em>"{query}"</em> — try a broader search.
          </div>
        )}

        {!query && (
          <div style={{ padding: "20px 16px" }}>
            <p className="text-label" style={{ color: "var(--text-muted)", marginBottom: 10 }}>Recent</p>
            {mockBookmarks.slice(0, 3).map((b) => (
              <button
                key={b.id}
                onClick={() => { onSelect(b.id); handleClose(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "7px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontFamily: "var(--font-ui)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
