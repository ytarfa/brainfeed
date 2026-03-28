import React, { useState } from "react";

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

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
    <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const GridIcon = ({ active }: { active: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill={active ? "currentColor" : "none"} />
    <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill={active ? "currentColor" : "none"} />
    <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill={active ? "currentColor" : "none"} />
    <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill={active ? "currentColor" : "none"} />
  </svg>
);

const ListIcon = ({ active }: { active: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth={active ? "1.8" : "1.3"} strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2a5 5 0 1 0 5 5 3.5 3.5 0 0 1-5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7 1.5v1M7 11.5v1M1.5 7h1M11.5 7h1M3 3l.7.7M10.3 10.3l.7.7M3 11l.7-.7M10.3 3.7l.7-.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const MenuIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1.5 3.5h11M1.5 7h11M1.5 10.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

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
  const [hoveringAdd, setHoveringAdd] = useState(false);

  const barStyle: React.CSSProperties = {
    height: 52,
    borderBottom: "1px solid var(--border-subtle)",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: 10,
    background: "var(--bg-base)",
    flexShrink: 0,
  };

  const iconBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 7,
    color: "var(--text-secondary)",
    transition: "background var(--transition-fast), color var(--transition-fast)",
    flexShrink: 0,
  };

  return (
    <header style={barStyle}>
      {/* Mobile menu toggle */}
      <button
        style={{ ...iconBtn, display: "none" }}
        onClick={onToggleSidebar}
        className="mobile-menu-btn"
        aria-label="Toggle sidebar"
      >
        <MenuIcon />
      </button>

      {/* Search */}
      <button
        onClick={onSearchClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          maxWidth: 380,
          height: 34,
          padding: "0 12px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 8,
          color: "var(--text-muted)",
          fontSize: 13,
          fontFamily: "var(--font-ui)",
          cursor: "text",
          textAlign: "left",
          transition: "border-color var(--transition-fast)",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)")}
      >
        <SearchIcon />
        <span style={{ flex: 1 }}>Search everything…</span>
        <span
          style={{
            fontSize: 10,
            background: "var(--bg-raised)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 4,
            padding: "1px 5px",
            letterSpacing: "0.03em",
            color: "var(--text-muted)",
          }}
        >
          ⌘K
        </span>
      </button>

      <div style={{ flex: 1 }} />

      {/* View toggle */}
      <div
        style={{
          display: "flex",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 7,
          overflow: "hidden",
        }}
      >
        {(["list", "grid"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            style={{
              ...iconBtn,
              borderRadius: 0,
              background: view === v ? "var(--bg-raised)" : "transparent",
              color: view === v ? "var(--text-primary)" : "var(--text-muted)",
              borderRight: v === "list" ? "1px solid var(--border-subtle)" : "none",
            }}
            title={v === "grid" ? "Grid view" : "List view"}
          >
            {v === "grid" ? <GridIcon active={view === "grid"} /> : <ListIcon active={view === "list"} />}
          </button>
        ))}
      </div>

      {/* Dark toggle */}
      <button
        onClick={onToggleDark}
        style={{ ...iconBtn }}
        title={dark ? "Light mode" : "Dark mode"}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
        }}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Add button */}
      <button
        onClick={onAddClick}
        onMouseEnter={() => setHoveringAdd(true)}
        onMouseLeave={() => setHoveringAdd(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 34,
          padding: "0 14px",
          background: hoveringAdd ? "var(--terra-600)" : "var(--accent)",
          color: "#fff",
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "var(--font-ui)",
          fontWeight: 500,
          transition: "background var(--transition-fast)",
          border: "none",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>+</span>
        Save
      </button>
    </header>
  );
}
