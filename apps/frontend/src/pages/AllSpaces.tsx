import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { useSpaces } from "../api/hooks";
import type { SpaceListItem } from "../api/hooks";

export default function AllSpaces() {
  const navigate = useNavigate();
  const { data: spacesData, isLoading } = useSpaces();
  const spaces: SpaceListItem[] = spacesData?.data ?? [];

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
            {spaces.length} spaces {"\u00B7"} organize your saved content
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

      {/* Loading state */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)", fontSize: 13 }}>
          Loading spaces...
        </div>
      )}

      {/* Space cards grid */}
      {!isLoading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {spaces.map((space, i) => {
            const itemCount = space.bookmark_spaces?.[0]?.count ?? 0;
            const hasMembers = space.space_members.length > 1;
            return (
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
                      background: space.color ?? "var(--text-muted)",
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
                    <span className="text-meta">{itemCount} items</span>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {/* Collaborator avatars */}
                      {hasMembers && (
                        <div style={{ display: "flex" }}>
                          {space.space_members.slice(0, 3).map((m, ci) => (
                            <div
                              key={m.user_id}
                              title={m.profiles.display_name}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: `hsl(${(m.user_id.charCodeAt(1) * 37) % 360}, 40%, 55%)`,
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
                              {m.profiles.display_name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

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
              animation: `fadeIn 240ms ${spaces.length * 40}ms both`,
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
      )}
    </div>
  );
}
