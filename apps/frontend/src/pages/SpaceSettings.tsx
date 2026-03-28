import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { mockSpaces, type CategorizationRule, type SyncSource } from "../data/mock";

type Section = "general" | "rules" | "collaborators" | "sync" | "sharing";

export default function SpaceSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const space = mockSpaces.find((s) => s.id === id);
  const [section, setSection] = useState<Section>("general");
  const [spaceName, setSpaceName] = useState(space?.name ?? "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);

  if (!space) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Space not found.</div>;

  const navItems: { label: string; value: Section }[] = [
    { label: "General", value: "general" },
    { label: "Categorization", value: "rules" },
    { label: "Collaborators", value: "collaborators" },
    { label: "Sync sources", value: "sync" },
    { label: "Public sharing", value: "sharing" },
  ];

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sectionInputStyle: React.CSSProperties = {
    width: "100%",
    height: 38,
    padding: "0 12px",
    background: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "var(--font-ui)",
    color: "var(--text-primary)",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 5,
    color: "var(--text-secondary)",
    fontSize: 11,
    fontFamily: "var(--font-ui)",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  };

  const syncStatusColor = (status: SyncSource["status"]) =>
    status === "active" ? "var(--color-success)" : status === "failed" ? "var(--color-error)" : "var(--text-muted)";

  return (
    <div style={{ padding: "24px 24px", maxWidth: 800, animation: "fadeIn 240ms both" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <Link to={`/spaces/${id}`} style={{ fontSize: 13, color: "var(--accent)" }}>
          {space.name}
        </Link>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>›</span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Settings</span>
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: 22,
          marginBottom: 24,
          color: "var(--text-primary)",
        }}
      >
        Space Settings
      </h1>

      <div style={{ display: "flex", gap: 28 }}>
        {/* Nav */}
        <nav style={{ width: 160, flexShrink: 0 }}>
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setSection(item.value)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "7px 10px",
                borderRadius: 7,
                fontSize: 13,
                fontFamily: "var(--font-ui)",
                background: section === item.value ? "var(--bg-surface)" : "transparent",
                color: section === item.value ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: section === item.value ? 500 : 400,
                border: "none",
                cursor: "pointer",
                marginBottom: 2,
                transition: "background var(--transition-fast)",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {section === "general" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Space name</label>
                <input
                  type="text"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  style={sectionInputStyle}
                />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  defaultValue={space.description}
                  rows={3}
                  style={{
                    ...sectionInputStyle,
                    height: "auto",
                    padding: "10px 12px",
                    resize: "vertical",
                    lineHeight: 1.5,
                  }}
                />
              </div>
              <button
                style={{
                  height: 36,
                  padding: "0 18px",
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  color: "#fff",
                  cursor: "pointer",
                  marginBottom: 48,
                }}
              >
                Save changes
              </button>

              {/* Danger zone */}
              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: 24,
                }}
              >
                <p className="text-label" style={{ color: "var(--color-error)", marginBottom: 8 }}>
                  Danger zone
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
                  Deleting this Space removes all its bookmarks and cannot be undone.
                </p>
                <button
                  style={{
                    height: 36,
                    padding: "0 18px",
                    background: "transparent",
                    border: `1px solid var(--color-error)`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    color: "var(--color-error)",
                    cursor: "pointer",
                  }}
                >
                  Delete Space
                </button>
              </div>
            </div>
          )}

          {section === "rules" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16 }}>
                    Categorization rules
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                    Auto-assign bookmarks matching these rules to this Space.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>AI auto-categorize</span>
                  <div
                    style={{
                      width: 36,
                      height: 20,
                      background: space.aiEnabled ? "var(--accent)" : "var(--border-strong)",
                      borderRadius: 10,
                      position: "relative",
                      cursor: "pointer",
                      transition: "background var(--transition-fast)",
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        background: "#fff",
                        borderRadius: "50%",
                        position: "absolute",
                        top: 3,
                        left: space.aiEnabled ? 19 : 3,
                        transition: "left var(--transition-fast)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {space.rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    marginBottom: 8,
                    fontSize: 13,
                    fontFamily: "var(--font-ui)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <code style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: 12 }}>{rule.field}</code>
                  <span>{rule.operator}</span>
                  <code style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: 12 }}>"{rule.value}"</code>
                  <button style={{ marginLeft: "auto", color: "var(--color-error)", fontSize: 11, background: "none", border: "none", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              ))}

              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: 34,
                  padding: "0 14px",
                  background: "transparent",
                  border: "1.5px dashed var(--border-strong)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "var(--font-ui)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  marginTop: 4,
                }}
              >
                + Add rule
              </button>
            </div>
          )}

          {section === "collaborators" && (
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16, marginBottom: 16 }}>
                Collaborators
              </h3>

              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{ ...sectionInputStyle, flex: 1 }}
                />
                <button
                  style={{
                    height: 38,
                    padding: "0 16px",
                    background: "var(--accent)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    color: "#fff",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Invite
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {space.collaborators.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: `hsl(${(c.id.charCodeAt(1) * 37) % 360}, 40%, 55%)`,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-ui)",
                      }}
                    >
                      {c.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{c.name}</p>
                      <p className="text-meta">{c.email}</p>
                    </div>
                    <span
                      style={{
                        padding: "2px 8px",
                        background: c.role === "owner" ? "var(--accent-subtle)" : "var(--bg-raised)",
                        border: `1px solid ${c.role === "owner" ? "var(--terra-100)" : "var(--border-subtle)"}`,
                        borderRadius: 4,
                        fontSize: 10,
                        fontFamily: "var(--font-ui)",
                        fontWeight: 500,
                        color: c.role === "owner" ? "var(--accent-text)" : "var(--text-secondary)",
                        textTransform: "capitalize",
                      }}
                    >
                      {c.role}
                    </span>
                    {c.role !== "owner" && (
                      <button
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0 4px",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-error)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "sync" && (
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16, marginBottom: 4 }}>
                Sync sources
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
                Automatically pull content from connected sources into this Space.
              </p>

              {/* Connected sources */}
              {space.syncSources.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {space.syncSources.map((src) => (
                    <div
                      key={src.id}
                      style={{
                        padding: "12px 14px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: syncStatusColor(src.status),
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", flex: 1 }}>
                          {src.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "var(--font-ui)",
                            color: syncStatusColor(src.status),
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {src.status}
                        </span>
                        <button
                          style={{
                            fontSize: 11,
                            color: "var(--color-error)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Disconnect
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="text-meta">Frequency:</span>
                          <select
                            defaultValue={src.frequency}
                            style={{
                              height: 26,
                              padding: "0 8px",
                              background: "var(--bg-raised)",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: 5,
                              fontSize: 11,
                              fontFamily: "var(--font-ui)",
                              color: "var(--text-secondary)",
                              outline: "none",
                            }}
                          >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                        {src.lastSync && <span className="text-meta">Last sync: {src.lastSync}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Connect new source */}
              <p className="text-label" style={{ marginBottom: 10, color: "var(--text-muted)" }}>Connect a source</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { type: "youtube", label: "YouTube", icon: "▶", color: "#ff0000" },
                  { type: "spotify", label: "Spotify", icon: "♪", color: "#1db954" },
                  { type: "reddit", label: "Reddit", icon: "◎", color: "#ff4500" },
                  { type: "rss", label: "RSS feed", icon: "⊛", color: "#f79c42" },
                ].map((source) => (
                  <button
                    key={source.type}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      height: 34,
                      padding: "0 14px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 7,
                      fontSize: 12,
                      fontFamily: "var(--font-ui)",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "border-color var(--transition-fast)",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)")}
                  >
                    <span style={{ color: source.color, fontSize: 11 }}>{source.icon}</span>
                    {source.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {section === "sharing" && (
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16, marginBottom: 4 }}>
                Public sharing
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
                Share a read-only view of this Space with anyone — no account needed.
              </p>

              {space.shareToken ? (
                <div
                  style={{
                    padding: 16,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    marginBottom: 14,
                  }}
                >
                  <p className="text-label" style={{ marginBottom: 8, color: "var(--text-muted)" }}>Share link</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <code
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        background: "var(--bg-raised)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 7,
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      https://brainfeed.app/p/{space.shareToken}
                    </code>
                    <button
                      onClick={handleCopy}
                      style={{
                        height: 36,
                        padding: "0 14px",
                        background: copied ? "var(--accent-subtle)" : "var(--bg-raised)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 7,
                        fontSize: 12,
                        fontFamily: "var(--font-ui)",
                        fontWeight: 500,
                        color: copied ? "var(--accent-text)" : "var(--text-secondary)",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  style={{
                    height: 36,
                    padding: "0 18px",
                    background: "var(--accent)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    color: "#fff",
                    cursor: "pointer",
                    marginBottom: 14,
                  }}
                >
                  Generate share link
                </button>
              )}

              {space.shareToken && (
                <button
                  style={{
                    height: 34,
                    padding: "0 14px",
                    background: "transparent",
                    border: "1px solid var(--color-error)",
                    borderRadius: 7,
                    fontSize: 12,
                    fontFamily: "var(--font-ui)",
                    color: "var(--color-error)",
                    cursor: "pointer",
                  }}
                >
                  Revoke link
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
