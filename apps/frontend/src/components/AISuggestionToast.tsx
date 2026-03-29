import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

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

  return (
    <div
      className="fixed bottom-6 right-6 bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl shadow-[0_8px_32px_rgba(30,28,26,0.14)] py-3.5 px-4 max-w-80 z-[500]"
      style={{
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
        opacity: visible ? 1 : 0,
        transition: "transform 280ms cubic-bezier(0.32,0.72,0,1), opacity 280ms ease",
      }}
    >
      <p className="text-[13px] font-ui text-[var(--text-secondary)] mb-3 leading-relaxed">
        <span className="text-[var(--text-muted)] text-[11px] block mb-0.5">AI suggestion</span>
        Save{" "}
        <em className="font-display italic text-[var(--text-primary)]">
          {bookmarkTitle.length > 40 ? bookmarkTitle.slice(0, 40) + "\u2026" : bookmarkTitle}
        </em>{" "}
        to{" "}
        <strong className="text-[var(--text-primary)] font-medium">{spaceName}</strong>?
      </p>
      <div className="flex gap-1.5">
        <button
          onClick={onConfirm}
          className="flex-1 h-[30px] bg-[var(--accent)] text-white border-none rounded-[7px] text-xs font-ui font-medium cursor-pointer transition-colors hover:bg-[var(--terra-600)]"
        >
          Confirm
        </button>
        <button
          onClick={onReassign}
          className="flex-1 h-[30px] bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-[7px] text-xs font-ui cursor-pointer transition-colors hover:border-[var(--border-strong)]"
        >
          Reassign
        </button>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 280); }}
          className="w-[30px] h-[30px] bg-transparent text-[var(--text-muted)] border-none rounded-[7px] cursor-pointer flex items-center justify-center hover:text-[var(--text-secondary)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
