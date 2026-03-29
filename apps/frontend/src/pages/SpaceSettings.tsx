import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import {
  useSpace,
  useUpdateSpace,
  useDeleteSpace,
  useShareSpace,
  useUnshareSpace,
  useRules,
  useCreateRule,
  useDeleteRule,
  useMembers,
  useInviteMember,
  useRemoveMember,
  useSyncSources,
  useDeleteSyncSource,
} from "../api/hooks";
import type { RuleRow, MemberRow, SyncSourceWithSpace } from "../api/hooks";

type Section = "general" | "rules" | "collaborators" | "sync" | "sharing";

export default function SpaceSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: space, isLoading: spaceLoading } = useSpace(id);
  const { data: rulesData } = useRules(id);
  const { data: membersData } = useMembers(id);
  const { data: syncData } = useSyncSources();

  const updateSpace = useUpdateSpace();
  const deleteSpace = useDeleteSpace();
  const shareSpace = useShareSpace();
  const unshareSpace = useUnshareSpace();
  const createRule = useCreateRule();
  const deleteRule = useDeleteRule();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const deleteSyncSource = useDeleteSyncSource();

  const [section, setSection] = useState<Section>("general");
  const [spaceName, setSpaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (space) {
      setSpaceName(space.name);
    }
  }, [space]);

  const rules: RuleRow[] = rulesData?.data ?? [];
  const members: MemberRow[] = membersData?.data ?? [];
  const syncSources: SyncSourceWithSpace[] = (syncData?.data ?? []).filter(
    (s) => s.space_id === id,
  );

  if (spaceLoading) {
    return <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading...</div>;
  }

  if (!space) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Space not found.</div>;

  const navItems: { label: string; value: Section }[] = [
    { label: "General", value: "general" },
    { label: "Categorization", value: "rules" },
    { label: "Collaborators", value: "collaborators" },
    { label: "Sync sources", value: "sync" },
    { label: "Public sharing", value: "sharing" },
  ];

  const handleCopy = () => {
    if (space.share_token) {
      void navigator.clipboard.writeText(`https://brainfeed.app/p/${space.share_token}`);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const syncStatusColor = (isActive: boolean) =>
    isActive ? "var(--color-success)" : "var(--text-muted)";

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

  return (
    <div style={{ padding: "24px 24px", maxWidth: 800, animation: "fadeIn 240ms both" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <Link to={`/spaces/${id}`} style={{ fontSize: 13, color: "var(--accent)" }}>
          {space.name}
        </Link>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{"\u203A"}</span>
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
                  defaultValue={space.description ?? ""}
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
                onClick={() => updateSpace.mutate({ id: id!, name: spaceName })}
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
                  onClick={() => {
                    deleteSpace.mutate(id!, {
                      onSuccess: () => navigate("/spaces"),
                    });
                  }}
                  style={{
                    height: 36,
                    padding: "0 18px",
                    background: "transparent",
                    border: "1px solid var(--color-error)",
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
                    onClick={() => updateSpace.mutate({ id: id!, ai_auto_categorize: !space.ai_auto_categorize })}
                    style={{
                      width: 36,
                      height: 20,
                      background: space.ai_auto_categorize ? "var(--accent)" : "var(--border-strong)",
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
                        left: space.ai_auto_categorize ? 19 : 3,
                        transition: "left var(--transition-fast)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {rules.map((rule) => (
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
                  <code style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: 12 }}>{rule.rule_type}</code>
                  <span>contains</span>
                  <code style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: 12 }}>&quot;{rule.rule_value}&quot;</code>
                  <button
                    onClick={() => deleteRule.mutate({ spaceId: id!, ruleId: rule.id })}
                    style={{ marginLeft: "auto", color: "var(--color-error)", fontSize: 11, background: "none", border: "none", cursor: "pointer" }}
                  >
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
                  onClick={() => {
                    if (inviteEmail) {
                      inviteMember.mutate(
                        { spaceId: id!, email: inviteEmail, role: "viewer" },
                        { onSuccess: () => setInviteEmail("") },
                      );
                    }
                  }}
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
                {members.map((m) => (
                  <div
                    key={m.id}
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
                        background: `hsl(${(m.profiles.id.charCodeAt(1) * 37) % 360}, 40%, 55%)`,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-ui)",
                      }}
                    >
                      {m.profiles.display_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{m.profiles.display_name}</p>
                      <p className="text-meta">{m.role}</p>
                    </div>
                    <span
                      style={{
                        padding: "2px 8px",
                        background: m.role === "owner" ? "var(--accent-subtle)" : "var(--bg-raised)",
                        border: `1px solid ${m.role === "owner" ? "var(--terra-100)" : "var(--border-subtle)"}`,
                        borderRadius: 4,
                        fontSize: 10,
                        fontFamily: "var(--font-ui)",
                        fontWeight: 500,
                        color: m.role === "owner" ? "var(--accent-text)" : "var(--text-secondary)",
                        textTransform: "capitalize",
                      }}
                    >
                      {m.role}
                    </span>
                    {m.role !== "owner" && (
                      <button
                        onClick={() => removeMember.mutate({ spaceId: id!, memberId: m.id })}
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
              {syncSources.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {syncSources.map((src) => (
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
                            background: syncStatusColor(src.is_active),
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", flex: 1 }}>
                          {src.external_name ?? src.platform}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "var(--font-ui)",
                            color: syncStatusColor(src.is_active),
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {src.is_active ? "active" : "inactive"}
                        </span>
                        <button
                          onClick={() => deleteSyncSource.mutate(src.id)}
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
                          <span className="text-meta">{src.sync_frequency}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Connect new source */}
              <p className="text-label" style={{ marginBottom: 10, color: "var(--text-muted)" }}>Connect a source</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { type: "youtube", label: "YouTube", icon: "\u25B6", color: "#ff0000" },
                  { type: "spotify", label: "Spotify", icon: "\u266A", color: "#1db954" },
                  { type: "reddit", label: "Reddit", icon: "\u25CE", color: "#ff4500" },
                  { type: "rss", label: "RSS feed", icon: "\u229B", color: "#f79c42" },
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

              {space.share_token ? (
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
                      https://brainfeed.app/p/{space.share_token}
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
                  onClick={() => shareSpace.mutate(id!)}
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

              {space.share_token && (
                <button
                  onClick={() => unshareSpace.mutate(id!)}
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
