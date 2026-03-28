import React, { useState } from "react";
import { mockUser } from "../data/mock";

type Tab = "profile" | "accounts" | "notifications" | "danger";

export default function UserSettings() {
  const [tab, setTab] = useState<Tab>("profile");
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);

  const tabs: { label: string; value: Tab }[] = [
    { label: "Profile", value: "profile" },
    { label: "Connected accounts", value: "accounts" },
    { label: "Notifications", value: "notifications" },
    { label: "Danger zone", value: "danger" },
  ];

  const inputStyle: React.CSSProperties = {
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
    transition: "border-color var(--transition-fast)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 5,
    fontSize: 11,
    fontFamily: "var(--font-ui)",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--text-secondary)",
  };

  return (
    <div style={{ padding: "24px 24px", maxWidth: 740, animation: "fadeIn 240ms both" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 24, marginBottom: 24, color: "var(--text-primary)" }}>
        Settings
      </h1>

      <div style={{ display: "flex", gap: 28 }}>
        {/* Nav */}
        <nav style={{ width: 160, flexShrink: 0 }}>
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "7px 10px",
                borderRadius: 7,
                fontSize: 13,
                fontFamily: "var(--font-ui)",
                background: tab === t.value ? "var(--bg-surface)" : "transparent",
                color: t.value === "danger"
                  ? tab === t.value ? "var(--color-error)" : "var(--color-error)"
                  : tab === t.value ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: tab === t.value ? 500 : 400,
                border: "none",
                cursor: "pointer",
                marginBottom: 2,
                transition: "background var(--transition-fast)",
                opacity: t.value === "danger" ? 0.75 : 1,
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === "profile" && (
            <div>
              {/* Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 22,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-ui)",
                    flexShrink: 0,
                  }}
                >
                  {mockUser.avatar}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3 }}>
                    {mockUser.name}
                  </p>
                  <button
                    style={{
                      fontSize: 12,
                      color: "var(--accent)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    Upload photo
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--accent)")}
                  onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border-subtle)")}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--accent)")}
                  onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border-subtle)")}
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
                }}
              >
                Save changes
              </button>
            </div>
          )}

          {tab === "accounts" && (
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16, marginBottom: 4 }}>
                Connected accounts
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
                These accounts can sync content to your Spaces.
              </p>
              {[
                { icon: "G", label: "Google", connected: true, color: "#4285F4" },
                { icon: "▶", label: "YouTube", connected: false, color: "#ff0000" },
                { icon: "♪", label: "Spotify", connected: false, color: "#1db954" },
                { icon: "◎", label: "Reddit", connected: false, color: "#ff4500" },
              ].map((acc) => (
                <div
                  key={acc.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 9,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: acc.color + "18",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      color: acc.color,
                      flexShrink: 0,
                    }}
                  >
                    {acc.icon}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {acc.label}
                  </span>
                  {acc.connected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-success)" }} />
                      <span style={{ fontSize: 12, color: "var(--color-success)" }}>Connected</span>
                      <button style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      style={{
                        height: 28,
                        padding: "0 12px",
                        background: "var(--bg-raised)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: "var(--font-ui)",
                        fontWeight: 500,
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "notifications" && (
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16, marginBottom: 20 }}>
                Notification preferences
              </h3>
              {[
                { label: "AI categorization activity", desc: "When AI adds items to your Spaces", enabled: true },
                { label: "Sync errors", desc: "When a sync source fails to connect", enabled: true },
                { label: "Collaborator activity", desc: "When someone joins or edits your Spaces", enabled: false },
                { label: "Weekly digest", desc: "A summary of what's been saved", enabled: false },
              ].map((pref) => (
                <div
                  key={pref.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>{pref.label}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{pref.desc}</p>
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 20,
                      background: pref.enabled ? "var(--accent)" : "var(--border-strong)",
                      borderRadius: 10,
                      position: "relative",
                      cursor: "pointer",
                      flexShrink: 0,
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
                        left: pref.enabled ? 19 : 3,
                        transition: "left var(--transition-fast)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "danger" && (
            <div>
              <div
                style={{
                  padding: 20,
                  background: "rgba(192,57,43,0.04)",
                  border: "1px solid rgba(192,57,43,0.18)",
                  borderRadius: 10,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--color-error)", marginBottom: 6 }}>
                  Delete account
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
                  This permanently deletes your account, all Spaces, and all saved content. This cannot be undone.
                </p>
                <button
                  style={{
                    height: 36,
                    padding: "0 18px",
                    background: "var(--color-error)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Delete my account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
