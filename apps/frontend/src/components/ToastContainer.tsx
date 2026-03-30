import React, { useState, useEffect } from "react";
import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

import { useToast } from "../contexts/ToastContext";

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
} as const;

const colorMap = {
  error: {
    border: "border-[var(--color-error)]",
    icon: "text-[var(--color-error)]",
    bg: "bg-[color-mix(in_srgb,var(--color-error)_8%,var(--bg-raised))]",
  },
  warning: {
    border: "border-[var(--color-warning)]",
    icon: "text-[var(--color-warning)]",
    bg: "bg-[color-mix(in_srgb,var(--color-warning)_8%,var(--bg-raised))]",
  },
  info: {
    border: "border-[var(--border-subtle)]",
    icon: "text-[var(--text-secondary)]",
    bg: "bg-[var(--bg-raised)]",
  },
  success: {
    border: "border-[var(--color-success)]",
    icon: "text-[var(--color-success)]",
    bg: "bg-[color-mix(in_srgb,var(--color-success)_8%,var(--bg-raised))]",
  },
} as const;

// ---------------------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------------------

interface ToastItemProps {
  id: number;
  type: "error" | "warning" | "info" | "success";
  message: string;
  onDismiss: (id: number) => void;
}

function ToastItem({ id, type, message, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 280);
  };

  return (
    <div
      className={`flex items-start gap-2.5 ${colors.bg} border ${colors.border} rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] py-3 px-3.5 max-w-96 pointer-events-auto`}
      style={{
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
        opacity: visible ? 1 : 0,
        transition: "transform 280ms cubic-bezier(0.32,0.72,0,1), opacity 280ms ease",
      }}
    >
      <Icon className={`${colors.icon} shrink-0 mt-0.5`} size={16} />
      <p className="flex-1 text-[13px] font-ui text-[var(--text-primary)] leading-snug">
        {message}
      </p>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer bg-transparent border-none p-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast container (reads from context)
// ---------------------------------------------------------------------------

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[600] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}
