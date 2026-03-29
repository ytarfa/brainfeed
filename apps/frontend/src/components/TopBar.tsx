import React, { useState } from "react";
import {
  Search,
  LayoutGrid,
  List,
  Moon,
  Sun,
  Menu,
  Plus,
} from "lucide-react";

import { cn } from "../lib/utils";

interface TopBarProps {
  onAddClick: () => void;
  onSearchClick: () => void;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  onToggleDark: () => void;
  dark: boolean;
  onToggleSidebar: () => void;
  title?: string;
}

export default function TopBar({
  onAddClick,
  onSearchClick,
  view,
  onViewChange,
  onToggleDark,
  dark,
  onToggleSidebar,
  title,
}: TopBarProps) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-base)] px-5">
      {/* Mobile menu toggle */}
      <button
        onClick={onToggleSidebar}
        className="hidden items-center justify-center rounded-[7px] text-[var(--text-secondary)] transition-[background,color] duration-[120ms] ease-in-out hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] mobile-menu-btn"
        aria-label="Toggle sidebar"
        style={{ width: 32, height: 32 }}
      >
        <Menu size={14} strokeWidth={1.6} />
      </button>

      {/* Search */}
      <button
        onClick={onSearchClick}
        className={cn(
          "flex h-[34px] flex-1 cursor-text items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-left font-ui text-[13px] text-[var(--text-muted)]",
          "transition-[border-color] duration-[120ms] ease-in-out",
          "hover:border-[var(--border-strong)]",
        )}
        style={{ maxWidth: 380 }}
      >
        <Search size={14} strokeWidth={1.6} />
        <span className="flex-1">Search everything...</span>
        <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-1.5 py-px text-[10px] tracking-wide text-[var(--text-muted)]">
          &#8984;K
        </span>
      </button>

      <div className="flex-1" />

      {/* View toggle */}
      <div className="flex overflow-hidden rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        {(["list", "grid"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={cn(
              "flex h-8 w-8 items-center justify-center transition-[background,color] duration-[120ms] ease-in-out",
              v === "list" && "border-r border-[var(--border-subtle)]",
              view === v
                ? "bg-[var(--bg-raised)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            )}
            title={v === "grid" ? "Grid view" : "List view"}
          >
            {v === "grid" ? (
              <LayoutGrid size={14} strokeWidth={1.6} fill={view === "grid" ? "currentColor" : "none"} />
            ) : (
              <List size={14} strokeWidth={view === "list" ? 2 : 1.6} />
            )}
          </button>
        ))}
      </div>

      {/* Dark toggle */}
      <button
        onClick={onToggleDark}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-[var(--text-secondary)] transition-[background,color] duration-[120ms] ease-in-out hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        title={dark ? "Light mode" : "Dark mode"}
      >
        {dark ? <Sun size={14} strokeWidth={1.6} /> : <Moon size={14} strokeWidth={1.6} />}
      </button>

      {/* Add button */}
      <button
        onClick={onAddClick}
        className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-md bg-[var(--accent)] px-3.5 font-ui text-[13px] font-medium text-white transition-[background] duration-[120ms] ease-in-out hover:bg-terra-600"
      >
        <Plus size={16} strokeWidth={2} />
        Save
      </button>
    </header>
  );
}
