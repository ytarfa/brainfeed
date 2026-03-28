import React, { useState } from "react";
import type { ActivityEntry } from "../data/mock";

interface ActivityLogProps {
  entries: ActivityEntry[];
  onAccept: (id: string) => void;
  onUndo: (id: string) => void;
}

export default function ActivityLog({ entries, onAccept, onUndo }: ActivityLogProps) {
  const [open, setOpen] = useState(false);

  const pendingCount = entries.filter((e) => e.accepted === undefined).length;

  return (
    <div
      style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        flexShrink: 0,
        transition: "max-height var(--transition-slow)",
      }}
    >
      {/* Trigger bar */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "10px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "var(--font-ui)",
          color: "var(--text-secondary)",
          textAlign: "left",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform var(--transition-base)",
          }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 10 }}>
          AI Activity Log
        </span>
        {pendingCount > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "50%",
              fontSize: 9,
              fontWeight: 500,
            }}
          >
            {pendingCount}
          </span>
        )}
        <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 10 }}>
          AI corrections help improve future suggestions
        </span>
      </button>

      {/* Log entries */}
      {open && (
        <div style={{ padding: "0 20px 14px", maxHeight: 240, overflowY: "auto" }}>
          {entries.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>No AI activity yet.</p>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 0",
                borderBottom: "1px solid var(--border-subtle)",
                animation: "fadeIn 160ms both",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4 }}>
                  <em
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 500,
                    }}
                  >
                    {entry.bookmarkTitle.length > 36 ? entry.bookmarkTitle.slice(0, 36) + "…" : entry.bookmarkTitle}
                  </em>{" "}
                  <span style={{ color: "var(--text-muted)" }}>{entry.action}</span>
                </p>
                <p className="text-meta" style={{ marginTop: 2 }}>{entry.timestamp}</p>
              </div>

              {entry.accepted === undefined ? (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => onAccept(entry.id)}
                    title="Accept"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      background: "rgba(74,122,91,0.12)",
                      color: "var(--color-success)",
                      border: "none",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => onUndo(entry.id)}
                    title="Undo"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      background: "var(--bg-raised)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ↩
                  </button>
                </div>
              ) : (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--color-success)",
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                  }}
                >
                  Accepted
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
