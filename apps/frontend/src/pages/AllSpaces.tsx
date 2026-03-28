import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { mockSpaces } from "../data/mock";

export default function AllSpaces() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "24px 24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          animation: "fadeIn 240ms both",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 24,
              color: "var(--text-primary)",
              marginBottom: 2,
            }}
          >
            Spaces
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {mockSpaces.length} spaces · organize your saved content
          </p>
        </div>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 16px",
            background: "var(--accent)",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>+</span>
          New Space
        </button>
      </div>

      {/* Space cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {mockSpaces.map((space, i) => (
          <Link
            key={space.id}
            to={`/spaces/${space.id}`}
            style={{
              display: "block",
              textDecoration: "none",
              animation: `fadeIn 240ms ${i * 40}ms both`,
            }}
          >
            <div
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "18px 18px 16px",
                cursor: "pointer",
                transition: "border-color var(--transition-fast), transform var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              {/* Space color bar */}
              <div
                style={{
                  width: 32,
                  height: 4,
                  background: space.color,
                  borderRadius: 2,
                  marginBottom: 12,
                  opacity: 0.8,
                }}
              />

              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                  lineHeight: 1.3,
                }}
              >
                {space.name}
              </h3>

              {space.description && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                    marginBottom: 12,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {space.description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span className="text-meta">{space.itemCount} items</span>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Collaborator avatars */}
                  {space.isShared && (
                    <div style={{ display: "flex" }}>
                      {space.collaborators.slice(0, 3).map((c, ci) => (
                        <div
                          key={c.id}
                          title={c.name}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: `hsl(${(c.id.charCodeAt(1) * 37) % 360}, 40%, 55%)`,
                            color: "#fff",
                            fontSize: 8,
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1.5px solid var(--bg-raised)",
                            marginLeft: ci > 0 ? -5 : 0,
                            fontFamily: "var(--font-ui)",
                          }}
                        >
                          {c.avatar}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sync indicator */}
                  {space.syncSources.length > 0 && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      style={{
                        color: space.isSyncing ? "var(--accent)" : "var(--text-muted)",
                        animation: space.isSyncing ? "spin 2s linear infinite" : "none",
                      }}
                    >
                      <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      <path d="M6 1.5 L8 3.5 L6 3.5" fill="currentColor" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Create new Space card */}
        <button
          onClick={() => {/* open create modal */}}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "transparent",
            border: "1.5px dashed var(--border-strong)",
            borderRadius: 12,
            padding: "18px",
            cursor: "pointer",
            color: "var(--text-muted)",
            minHeight: 120,
            transition: "border-color var(--transition-fast), color var(--transition-fast)",
            animation: `fadeIn 240ms ${mockSpaces.length * 40}ms both`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          <span style={{ fontSize: 24, lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 12, fontFamily: "var(--font-ui)", fontWeight: 500 }}>New Space</span>
        </button>
      </div>
    </div>
  );
}
