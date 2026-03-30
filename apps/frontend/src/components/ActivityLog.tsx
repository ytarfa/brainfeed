import React, { useState } from "react";
import { ChevronDown, Check, Undo2 } from "lucide-react";

import { cn } from "../lib/utils";
import type { ActivityEntry } from "../data/mock";

interface ActivityLogProps {
  entries: ActivityEntry[];
  onAccept: (id: string) => void;
  onUndo: (id: string) => void;
}

export default function ActivityLog({ entries, onAccept, onUndo }: ActivityLogProps) {
  const [open, setOpen] = useState(false);

  const pendingCount = entries.filter((e) => e.accepted === undefined).length;

  return (
    <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 transition-all">
      {/* Trigger bar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full py-2.5 px-5 bg-transparent border-none cursor-pointer text-xs font-ui text-[var(--text-secondary)] text-left"
      >
        <ChevronDown
          size={12}
          className={cn(
            "transition-transform",
            !open && "-rotate-90",
          )}
        />
        <span className="font-medium tracking-wide uppercase text-[10px]">
          AI Activity Log
        </span>
        {pendingCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 bg-[var(--accent)] text-white rounded-full text-[9px] font-medium">
            {pendingCount}
          </span>
        )}
        <span className="ml-auto text-[var(--text-muted)] text-[10px]">
          AI corrections help improve future suggestions
        </span>
      </button>

      {/* Log entries */}
      {open && (
        <div className="px-5 pb-3.5 max-h-60 overflow-y-auto">
          {entries.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] py-2">No AI activity yet.</p>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-2.5 py-[7px] border-b border-[var(--border-subtle)] animate-fade-in"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text-primary)] leading-snug">
                  <em className="font-display italic font-medium">
                    {entry.bookmarkTitle.length > 36 ? entry.bookmarkTitle.slice(0, 36) + "\u2026" : entry.bookmarkTitle}
                  </em>{" "}
                  <span className="text-[var(--text-muted)]">{entry.action}</span>
                </p>
                <p className="text-meta mt-0.5">{entry.timestamp}</p>
              </div>

              {entry.accepted === undefined ? (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onAccept(entry.id)}
                    title="Accept"
                    className="w-6 h-6 rounded-[5px] bg-[rgba(61,214,140,0.12)] text-[var(--color-success)] border-none cursor-pointer flex items-center justify-center hover:bg-[rgba(61,214,140,0.2)] transition-colors"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => onUndo(entry.id)}
                    title="Undo"
                    className="w-6 h-6 rounded-[5px] bg-[var(--bg-raised)] text-[var(--text-muted)] border border-[var(--border-subtle)] cursor-pointer flex items-center justify-center hover:border-[var(--border-strong)] transition-colors"
                  >
                    <Undo2 size={10} />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-[var(--color-success)] font-ui font-medium">
                  Accepted
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
