import React, { useState, useEffect, useRef } from "react";
import { useSpaces } from "../api/hooks";

interface SaveItemModalProps {
  open: boolean;
  onClose: () => void;
}

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

type Step = "input" | "enriching" | "done";

export default function SaveItemModal({ open, onClose }: SaveItemModalProps) {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [selectedSpace, setSelectedSpace] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: spacesData } = useSpaces();
  const spaces = spacesData?.data ?? [];

  useEffect(() => {
    if (open) {
      setStep("input");
      setUrl("");
      setSelectedSpace("");
      requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 220);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setStep("enriching");
    setTimeout(() => setStep("done"), 2200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(30,28,26,0.35)",
    backdropFilter: "blur(3px)",
    zIndex: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    opacity: visible ? 1 : 0,
    transition: "opacity 220ms ease",
    pointerEvents: open ? "all" : "none",
  };

  const modalStyle: React.CSSProperties = {
    background: "var(--bg-base)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 14,
    boxShadow: "0 24px 64px rgba(30,28,26,0.18)",
    width: "100%",
    maxWidth: 480,
    overflow: "hidden",
    transform: visible ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
    transition: "transform 220ms cubic-bezier(0.32,0.72,0,1), opacity 220ms ease",
    opacity: visible ? 1 : 0,
  };

  if (!open && !visible) return null;

  return (
    <div style={overlayStyle} onClick={handleClose} onKeyDown={handleKeyDown}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 17 }}>
            Save to brainfeed
          </h2>
          <button
            onClick={handleClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {step === "input" && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label className="text-label" style={{ display: "block", marginBottom: 6, color: "var(--text-muted)" }}>
                  URL or paste text
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com or paste any text…"
                  style={{
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
                  }}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--accent)")}
                  onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border-subtle)")}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="text-label" style={{ display: "block", marginBottom: 6, color: "var(--text-muted)" }}>
                  Space (optional)
                </label>
                <select
                  value={selectedSpace}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: "var(--font-ui)",
                    color: selectedSpace ? "var(--text-primary)" : "var(--text-muted)",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="">Let AI suggest a Space…</option>
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    height: 36,
                    padding: "0 16px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "var(--font-ui)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!url.trim()}
                  style={{
                    height: 36,
                    padding: "0 20px",
                    background: url.trim() ? "var(--accent)" : "var(--border-subtle)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    color: url.trim() ? "#fff" : "var(--text-muted)",
                    cursor: url.trim() ? "pointer" : "default",
                    transition: "background var(--transition-fast)",
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {step === "enriching" && (
            <div style={{ padding: "20px 0" }}>
              <p className="text-label" style={{ marginBottom: 16, color: "var(--text-muted)" }}>
                Enriching content…
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="skeleton" style={{ height: 16, width: "75%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: "100%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: "85%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: "60%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 80, width: "100%", borderRadius: 6, marginTop: 4 }} />
              </div>
            </div>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "var(--accent-subtle)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  fontSize: 22,
                  color: "var(--accent)",
                }}
              >
                ✓
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16, marginBottom: 6 }}>
                Saved!
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Added to <strong style={{ color: "var(--text-secondary)" }}>Dev Tools</strong> by AI
              </p>
              <button
                onClick={handleClose}
                style={{
                  marginTop: 20,
                  height: 36,
                  padding: "0 20px",
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
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
