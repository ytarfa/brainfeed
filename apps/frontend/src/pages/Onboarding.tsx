import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

type Step = 0 | 1 | 2 | 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDesc, setSpaceDesc] = useState("");

  const steps = [
    { label: "Create Space" },
    { label: "Browser extension" },
    { label: "Sync source" },
    { label: "Done" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", right: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,132,90,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,122,91,0.06) 0%, transparent 70%)" }} />
      </div>

      <div
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 16,
          padding: "36px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 8px 40px rgba(30,28,26,0.07)",
          animation: "fadeIn 320ms both",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Logo variant="full" size="lg" />
        </div>

        {/* Step progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 32 }}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div
                style={{
                  flex: i < steps.length - 1 ? undefined : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: i < step ? "var(--accent)" : i === step ? "var(--accent)" : "var(--bg-surface)",
                    border: `1.5px solid ${i <= step ? "var(--accent)" : "var(--border-subtle)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    color: i <= step ? "#fff" : "var(--text-muted)",
                    transition: "all var(--transition-base)",
                    flexShrink: 0,
                  }}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-ui)",
                    fontWeight: i === step ? 500 : 400,
                    color: i === step ? "var(--text-primary)" : "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? "var(--accent)" : "var(--border-subtle)", transition: "background var(--transition-slow)" }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div key={step} style={{ animation: "slideInUp 200ms both" }}>
          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 20, marginBottom: 8 }}>
                Create your first Space
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
                Spaces are folders for your saved content. Give this one a name.
              </p>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 5, fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                  Space name
                </label>
                <input
                  type="text"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  placeholder="e.g. Dev tools, Recipes, Reading list…"
                  style={inputStyle}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--accent)")}
                  onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border-subtle)")}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 5, fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={spaceDesc}
                  onChange={(e) => setSpaceDesc(e.target.value)}
                  placeholder="What will you save here?"
                  style={inputStyle}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--accent)")}
                  onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border-subtle)")}
                />
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!spaceName.trim()}
                style={{
                  width: "100%",
                  height: 40,
                  background: spaceName.trim() ? "var(--accent)" : "var(--border-subtle)",
                  border: "none",
                  borderRadius: 9,
                  fontSize: 14,
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  color: spaceName.trim() ? "#fff" : "var(--text-muted)",
                  cursor: spaceName.trim() ? "pointer" : "default",
                  transition: "background var(--transition-fast)",
                }}
              >
                Create Space →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 20, marginBottom: 8 }}>
                Install the browser extension
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
                Save any page to brainfeed in one click, directly from your browser.
              </p>
              <div
                style={{
                  padding: "16px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div style={{ fontSize: 28 }}>🧩</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                    Chrome / Edge / Brave
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Available on the Chrome Web Store</p>
                </div>
                <button
                  style={{
                    marginLeft: "auto",
                    height: 32,
                    padding: "0 14px",
                    background: "var(--accent)",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 12,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    color: "#fff",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Install
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setStep(0)}
                  style={{ flex: 1, height: 38, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 9, fontSize: 13, fontFamily: "var(--font-ui)", color: "var(--text-secondary)", cursor: "pointer" }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  style={{ flex: 2, height: 38, background: "var(--accent)", border: "none", borderRadius: 9, fontSize: 13, fontFamily: "var(--font-ui)", fontWeight: 500, color: "#fff", cursor: "pointer" }}
                >
                  Next →
                </button>
              </div>
              <button
                onClick={() => setStep(2)}
                style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", fontSize: 12, color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-ui)" }}
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 20, marginBottom: 8 }}>
                Connect a sync source
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
                Automatically pull content from YouTube, Reddit, Spotify, or RSS feeds.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {[
                  { icon: "▶", label: "YouTube", color: "#ff0000", desc: "Saved videos, liked videos, watch later" },
                  { icon: "♪", label: "Spotify", color: "#1db954", desc: "Saved podcasts and playlists" },
                  { icon: "◎", label: "Reddit", color: "#ff4500", desc: "Saved posts and upvoted content" },
                  { icon: "⊛", label: "RSS / Atom", color: "#f79c42", desc: "Any blog or feed via URL" },
                ].map((src) => (
                  <div
                    key={src.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 9,
                    }}
                  >
                    <span style={{ fontSize: 16, color: src.color }}>{src.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{src.label}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{src.desc}</p>
                    </div>
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
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ flex: 1, height: 38, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 9, fontSize: 13, fontFamily: "var(--font-ui)", color: "var(--text-secondary)", cursor: "pointer" }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  style={{ flex: 2, height: 38, background: "var(--accent)", border: "none", borderRadius: 9, fontSize: 13, fontFamily: "var(--font-ui)", fontWeight: 500, color: "#fff", cursor: "pointer" }}
                >
                  Done →
                </button>
              </div>
              <button
                onClick={() => setStep(3)}
                style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", fontSize: 12, color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-ui)" }}
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "var(--accent-subtle)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: 28,
                  color: "var(--accent)",
                }}
              >
                ✓
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 22, marginBottom: 8 }}>
                You're all set!
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28, maxWidth: 280, margin: "0 auto 28px" }}>
                Your Space <strong style={{ color: "var(--text-secondary)" }}>{spaceName}</strong> is ready.
                Start saving.
              </p>
              <button
                onClick={() => navigate("/library")}
                style={{
                  height: 42,
                  padding: "0 32px",
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Go to my library →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
