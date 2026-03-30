import React, { useState, useEffect, useRef } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { useCreateBookmark } from "../api/hooks";

interface SaveItemModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "input" | "saving" | "done" | "error";

export default function SaveItemModal({ open, onClose }: SaveItemModalProps) {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createBookmark = useCreateBookmark();

  useEffect(() => {
    if (open) {
      setStep("input");
      setUrl("");
      setErrorMessage("");
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
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!/^https?:\/\//i.test(trimmed)) {
      setErrorMessage("Please enter a valid URL starting with http:// or https://");
      setStep("error");
      return;
    }

    setStep("saving");

    createBookmark.mutate(
      {
        content_type: "link",
        url: trimmed,
      },
      {
        onSuccess: () => setStep("done"),
        onError: (err) => {
          setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
          setStep("error");
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  };

  if (!open && !visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[300] flex items-center justify-center p-4 bg-ink-DEFAULT/35 backdrop-blur-sm transition-opacity duration-[220ms]",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "w-full max-w-[480px] overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-xl transition-[transform,opacity] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          visible ? "scale-100 translate-y-0 opacity-100" : "scale-[0.97] translate-y-2 opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <h2 className="font-display text-[17px] font-medium">Save to brainfeed</h2>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {step === "input" && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3.5">
                <label className="text-label mb-1.5 block text-[var(--text-muted)]">
                  URL
                </label>
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 font-ui text-sm text-[var(--text-primary)] outline-none transition-[border-color] duration-[var(--transition-fast)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 font-ui text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className={cn(
                    "h-9 rounded-lg border-none px-5 font-ui text-[13px] font-medium transition-[background] duration-[var(--transition-fast)]",
                    url.trim()
                      ? "cursor-pointer bg-[var(--accent)] text-white hover:bg-terra-600"
                      : "cursor-default bg-[var(--border-subtle)] text-[var(--text-muted)]",
                  )}
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {step === "saving" && (
            <div className="py-5">
              <p className="text-label mb-4 text-[var(--text-muted)]">
                Saving...
              </p>
              <div className="flex flex-col gap-2.5">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-[85%] rounded" />
                <div className="skeleton h-3 w-3/5 rounded" />
                <div className="skeleton mt-1 h-20 w-full rounded-md" />
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
                <Check size={22} />
              </div>
              <p className="mb-1.5 font-display text-base font-medium">Saved!</p>
              <p className="text-[13px] text-[var(--text-muted)]">
                Your bookmark has been added to your library.
              </p>
              <button
                onClick={handleClose}
                className="mt-5 h-9 cursor-pointer rounded-lg border-none bg-[var(--accent)] px-5 font-ui text-[13px] font-medium text-white hover:bg-terra-600"
              >
                Done
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertCircle size={22} />
              </div>
              <p className="mb-1.5 font-display text-base font-medium">Failed to save</p>
              <p className="text-[13px] text-[var(--text-muted)]">
                {errorMessage}
              </p>
              <button
                onClick={() => setStep("input")}
                className="mt-5 h-9 cursor-pointer rounded-lg border-none bg-[var(--accent)] px-5 font-ui text-[13px] font-medium text-white hover:bg-terra-600"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
