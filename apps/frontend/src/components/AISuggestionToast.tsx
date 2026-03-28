import React, { useState, useEffect } from "react";

interface AISuggestionToastProps {
  spaceName: string;
  bookmarkTitle: string;
  onConfirm: () => void;
  onReassign: () => void;
  onDismiss: () => void;
}

export default function AISuggestionToast({
  spaceName,
  bookmarkTitle,
  onConfirm,
  onReassign,
  onDismiss,
}: AISuggestionToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 280);
    }, 7000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const toastStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 24,
    right: 24,
    background: "var(--bg-raised)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(30,28,26,0.14)",
    padding: "14px 16px",
    maxWidth: 320,
    zIndex: 500,
    transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
    opacity: visible ? 1 : 0,
    transition: "transform 280ms cubic-bezier(0.32,0.72,0,1), opacity 280ms ease",
  };

  return (
    <div style={toastStyle}>
      <p
        style={{
          fontSize: 13,
          fontFamily: "var(--font-ui)",
          color: "var(--text-secondary)",
          marginBottom: 12,
          lineHeight: 1.5,
        }}
      >
        <span style={{ color: "var(--text-muted)", fontSize: 11, display: "block", marginBottom: 3 }}>AI suggestion</span>
        Save{" "}
        <em style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--text-primary)" }}>
          {bookmarkTitle.length > 40 ? bookmarkTitle.slice(0, 40) + "…" : bookmarkTitle}
        </em>{" "}
        to{" "}
        <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>{spaceName}</strong>?
      </p>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            height: 30,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontSize: 12,
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Confirm
        </button>
        <button
          onClick={onReassign}
          style={{
            flex: 1,
            height: 30,
            background: "var(--bg-surface)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 7,
            fontSize: 12,
            fontFamily: "var(--font-ui)",
            cursor: "pointer",
          }}
        >
          Reassign
        </button>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 280); }}
          style={{
            width: 30,
            height: 30,
            background: "transparent",
            color: "var(--text-muted)",
            border: "none",
            borderRadius: 7,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
