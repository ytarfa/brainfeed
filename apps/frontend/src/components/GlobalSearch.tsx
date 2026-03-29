import React, { useState, useEffect, useRef } from "react";
import { Search, Clock } from "lucide-react";
import { cn } from "../lib/utils";
import { useSearch, useBookmarks, toBookmark } from "../api/hooks";
import type { SearchBookmark } from "../api/hooks";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  onSelect: (bookmarkId: string) => void;
}

export default function GlobalSearch({ open, onClose, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchData } = useSearch({ q: query.trim() });
  const { data: recentData } = useBookmarks({ limit: 3 });

  const results: SearchBookmark[] = query.trim().length > 0 ? (searchData?.data ?? []) : [];
  const recentBookmarks = (recentData?.data ?? []).map(toBookmark);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => inputRef.current?.focus(), 80);
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  if (!open && !visible) return null;

  const getSpaceFromResult = (b: SearchBookmark) => {
    const join = b.bookmark_spaces?.[0];
    return join ? { name: join.spaces.name, color: "var(--text-muted)" } : null;
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[400] flex items-start justify-center bg-ink-DEFAULT/35 backdrop-blur-sm pt-[12vh] px-4 pb-4 transition-opacity duration-200",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          "w-full max-w-[560px] overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-xl transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
          visible ? "translate-y-0" : "-translate-y-3",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className={cn(
          "flex items-center gap-2.5 px-4",
          query && results.length > 0 && "border-b border-[var(--border-subtle)]",
        )}>
          <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && handleClose()}
            placeholder="Search everything..."
            className="h-[52px] flex-1 bg-transparent font-ui text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd
            className="cursor-pointer rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-ui text-2xs text-[var(--text-muted)]"
            onClick={handleClose}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        {query && results.length > 0 && (
          <div className="max-h-[360px] overflow-y-auto">
            {results.map((b, i) => {
              const space = getSpaceFromResult(b);
              const domain = b.url ? new URL(b.url).hostname.replace("www.", "") : undefined;
              return (
                <button
                  key={b.id}
                  onClick={() => { onSelect(b.id); handleClose(); }}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-[background] duration-[var(--transition-fast)] hover:bg-[var(--bg-surface)]",
                    i < results.length - 1 && "border-b border-[var(--border-subtle)]",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 truncate font-display text-sm font-medium text-[var(--text-primary)]">
                      {b.title}
                    </p>
                    {b.description && (
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {b.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {space && (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[7px] py-0.5 font-ui text-2xs font-medium text-[var(--text-secondary)]">
                        <span
                          className="h-[5px] w-[5px] rounded-full"
                          style={{ background: space.color }}
                        />
                        {space.name}
                      </span>
                    )}
                    {domain && <span className="text-meta">{domain}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-7 text-center text-[13px] text-[var(--text-muted)]">
            No results for <em>&quot;{query}&quot;</em> — try a broader search.
          </div>
        )}

        {!query && (
          <div className="px-4 py-5">
            <p className="text-label mb-2.5 text-[var(--text-muted)]">Recent</p>
            {recentBookmarks.map((b) => (
              <button
                key={b.id}
                onClick={() => { onSelect(b.id); handleClose(); }}
                className="flex w-full items-center gap-2 py-[7px] text-left font-ui text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <Clock size={12} className="shrink-0 text-[var(--text-muted)]" />
                <span className="truncate">{b.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
