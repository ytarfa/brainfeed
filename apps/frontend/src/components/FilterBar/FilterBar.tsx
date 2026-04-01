import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ChevronDown,
  Check,
  Tag,
  ArrowUpDown,
  Code2,
  Play,
  FileText,
  Camera,
  Diamond,
  Layers,
} from "lucide-react";
import { cn } from "../../lib/utils";

import { useFilterContext } from "./FilterContext";
import { useTags } from "../../api/hooks";
import type { SourceType, SortField } from "./FilterContext";

// ─── Source pill config ───────────────────────────────────

interface SourceOption {
  value: SourceType | null;
  label: string;
  icon: React.ReactNode;
}

const SOURCE_OPTIONS: SourceOption[] = [
  { value: null, label: "All", icon: <Layers size={12} /> },
  { value: "github", label: "GitHub", icon: <Code2 size={12} /> },
  { value: "youtube", label: "YouTube", icon: <Play size={12} /> },
  { value: "article", label: "Article", icon: <FileText size={12} /> },
  { value: "instagram", label: "Instagram", icon: <Camera size={12} /> },
  { value: "generic", label: "Generic", icon: <Diamond size={12} /> },
];

// ─── Sort config ──────────────────────────────────────────

interface SortOption {
  value: SortField;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "created_at", label: "Date saved" },
  { value: "title", label: "Title" },
  { value: "source_type", label: "Source" },
];

const SORT_LABELS: Record<SortField, string> = {
  created_at: "Date saved",
  title: "Title",
  source_type: "Source",
};

// ─── Source labels for active filters ─────────────────────

const SOURCE_LABELS: Record<SourceType, string> = {
  github: "GitHub",
  youtube: "YouTube",
  article: "Article",
  instagram: "Instagram",
  generic: "Generic",
};

// ═══════════════════════════════════════════════════════════
//  FilterBar — layout container
// ═══════════════════════════════════════════════════════════

function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 flex-wrap pb-2.5">
        {children}
      </div>
      {/* Anchoring rule — thin line connecting filters to content */}
      <div
        className="h-px w-full"
        style={{
          background: "linear-gradient(90deg, var(--border-subtle) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  FilterBar.SourcePills — typographic tab navigation
// ═══════════════════════════════════════════════════════════

function SourcePills() {
  const { source, setSource } = useFilterContext();

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg bg-[var(--bg-surface)] p-0.5"
      role="radiogroup"
      aria-label="Filter by source type"
      style={{
        border: "1px solid var(--border-subtle)",
      }}
    >
      {SOURCE_OPTIONS.map((opt) => {
        const selected = source === opt.value;
        return (
          <button
            key={opt.label}
            role="radio"
            aria-checked={selected}
            onClick={() => setSource(opt.value)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-2.5 py-[5px] font-ui text-xs",
              "cursor-pointer select-none whitespace-nowrap",
              "transition-all duration-[160ms] ease-out",
              selected
                ? "bg-[var(--bg-base)] text-[var(--text-primary)] shadow-sm"
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            )}
          >
            <span
              className={cn(
                "flex items-center transition-colors duration-[160ms]",
                selected ? "text-[var(--accent)]" : "",
              )}
            >
              {opt.icon}
            </span>
            <span className="tracking-[0.01em]">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  FilterBar.TagSelect — editorial metadata selector
// ═══════════════════════════════════════════════════════════

function TagSelect() {
  const { tags: selectedTags, toggleTag, removeTag } = useFilterContext();
  const { data: availableTags = [] } = useTags();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  // Close on Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
    }
  }, []);

  // Filter tags by search
  const filteredTags = search
    ? availableTags.filter((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    : availableTags;

  // Hide when no tags available
  if (availableTags.length === 0) return null;

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-2.5 py-[5px] font-ui text-xs",
          "cursor-pointer select-none whitespace-nowrap",
          "transition-all duration-[160ms] ease-out",
          selectedTags.length > 0
            ? "border-[var(--accent)] text-[var(--accent-text)] bg-[var(--bg-base)]"
            : "border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]",
        )}
      >
        <Tag size={12} className={selectedTags.length > 0 ? "text-[var(--accent)]" : ""} />
        <span className="tracking-[0.01em]">Tags</span>
        {selectedTags.length > 0 && (
          <span
            className="flex items-center justify-center rounded bg-[var(--accent)] text-white font-ui text-2xs font-medium min-w-[16px] h-[16px] px-1 leading-none"
          >
            {selectedTags.length}
          </span>
        )}
        <ChevronDown
          size={11}
          className={cn(
            "transition-transform duration-[160ms] opacity-50",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label="Select tags"
          className={cn(
            "absolute left-0 top-full z-50 mt-1",
            "w-[240px] overflow-hidden",
            "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]",
            "animate-fade-in",
          )}
          style={{
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px var(--border-subtle)",
          }}
        >
          {/* Search input */}
          <div className="px-2.5 pt-2.5 pb-1.5">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags..."
              className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-[5px] font-ui text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-[border-color] duration-[120ms] focus:border-[var(--accent)]"
            />
          </div>

          {/* Tag list */}
          <div className="max-h-[220px] overflow-y-auto px-1 pb-1.5">
            {filteredTags.length === 0 && (
              <div className="px-2.5 py-3 text-center font-ui text-xs text-[var(--text-muted)]">
                No tags found
              </div>
            )}
            {filteredTags.map((tag) => {
              const checked = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "flex items-center gap-2 w-full px-2.5 py-[6px] text-left font-ui text-xs rounded-md",
                    "transition-all duration-[100ms] cursor-pointer",
                    checked
                      ? "text-[var(--accent-text)] bg-[var(--accent-subtle)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-3.5 h-3.5 rounded-[3px] border transition-all duration-[100ms]",
                      checked
                        ? "border-[var(--accent)] bg-[var(--accent)]"
                        : "border-[var(--border-strong)] bg-transparent",
                    )}
                  >
                    {checked && <Check size={9} className="text-white" />}
                  </span>
                  <span className="truncate">{tag}</span>
                </button>
              );
            })}
          </div>

          {/* Selected count footer */}
          {selectedTags.length > 0 && (
            <div className="border-t border-[var(--border-subtle)] px-2.5 py-2 flex items-center justify-between">
              <span className="font-ui text-2xs text-[var(--text-muted)]">
                {selectedTags.length} selected
              </span>
              <button
                onClick={() => {
                  selectedTags.forEach((t) => removeTag(t));
                  setSearch("");
                }}
                className="font-ui text-2xs text-[var(--accent-text)] hover:underline cursor-pointer"
              >
                Clear tags
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  FilterBar.Sort — editorial sort control
// ═══════════════════════════════════════════════════════════

function Sort() {
  const { sort, setSort } = useFilterContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative ml-auto">
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-2.5 py-[5px] font-ui text-xs",
          "cursor-pointer select-none whitespace-nowrap",
          "transition-all duration-[160ms] ease-out",
          "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]",
          "hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]",
        )}
      >
        <ArrowUpDown size={12} />
        <span className="tracking-[0.01em]">{SORT_LABELS[sort]}</span>
        <ChevronDown
          size={11}
          className={cn(
            "transition-transform duration-[160ms] opacity-50",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Sort by"
          className={cn(
            "absolute right-0 top-full z-50 mt-1",
            "min-w-[160px] overflow-hidden",
            "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]",
            "py-1 px-1",
            "animate-fade-in",
          )}
          style={{
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px var(--border-subtle)",
          }}
        >
          {SORT_OPTIONS.map((opt) => {
            const selected = sort === opt.value;
            return (
              <button
                key={opt.value}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setSort(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-2.5 py-[6px] text-left font-ui text-xs rounded-md",
                  "transition-all duration-[100ms] cursor-pointer",
                  selected
                    ? "text-[var(--accent-text)] bg-[var(--accent-subtle)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]",
                )}
              >
                {selected && <Check size={11} className="text-[var(--accent-text)]" />}
                {!selected && <span className="w-[11px]" />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  FilterBar.ActiveFilters — muted informational strip
// ═══════════════════════════════════════════════════════════

function ActiveFilters() {
  const { source, tags, hasActiveFilters, setSource, removeTag, clearAll } = useFilterContext();

  if (!hasActiveFilters) return null;

  return (
    <div
      className="flex items-center gap-1.5 flex-wrap pt-2.5 animate-fade-in"
    >
      <span className="font-ui text-label text-[var(--text-muted)] mr-1 tracking-[0.08em]">
        FILTERED BY
      </span>

      {/* Source chip */}
      {source && (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-[3px] font-ui text-2xs text-[var(--text-secondary)] transition-colors duration-[120ms] hover:border-[var(--border-strong)]">
          {SOURCE_LABELS[source]}
          <button
            onClick={() => setSource(null)}
            aria-label={`Remove ${SOURCE_LABELS[source]} filter`}
            className="flex items-center justify-center rounded-sm hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-all duration-[100ms] cursor-pointer -mr-0.5 p-0.5"
          >
            <X size={10} />
          </button>
        </span>
      )}

      {/* Tag chips */}
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-[3px] font-ui text-2xs text-[var(--text-secondary)] transition-colors duration-[120ms] hover:border-[var(--border-strong)]"
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            aria-label={`Remove tag ${tag}`}
            className="flex items-center justify-center rounded-sm hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-all duration-[100ms] cursor-pointer -mr-0.5 p-0.5"
          >
            <X size={10} />
          </button>
        </span>
      ))}

      {/* Clear all — subtle text button */}
      <button
        onClick={clearAll}
        className="font-ui text-2xs text-[var(--text-muted)] hover:text-[var(--accent-text)] cursor-pointer ml-1 transition-colors duration-[120ms]"
      >
        Clear all
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  Compound exports
// ═══════════════════════════════════════════════════════════

FilterBar.SourcePills = SourcePills;
FilterBar.TagSelect = TagSelect;
FilterBar.Sort = Sort;
FilterBar.ActiveFilters = ActiveFilters;

export default FilterBar;
