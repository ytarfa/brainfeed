import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import Logo from "./Logo";
import { useSpaces } from "../api/hooks";
import { useAuth } from "../contexts/AuthContext";
import type { SpaceListItem } from "../api/hooks";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  dark?: boolean;
}

const SyncIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: "spin 2s linear infinite" }}>
    <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M6 1.5 L8 3.5 L6 3.5" fill="currentColor" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 14H3.333A1.333 1.333 0 0 1 2 12.667V3.333A1.333 1.333 0 0 1 3.333 2H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.667 11.333 14 8l-3.333-3.333M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LibraryIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 11V4.5L7 2l5 2.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M4.5 11V7h2v4M7.5 11V7h2v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 200ms ease" }}>
    <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Sidebar({ collapsed = false, onToggle, dark = false }: SidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [spacesOpen, setSpacesOpen] = useState(true);
  const { data: spacesData } = useSpaces();
  const spaces = spacesData?.data ?? [];

  const sidebarStyle: React.CSSProperties = {
    width: collapsed ? "var(--sidebar-rail-width)" : "var(--sidebar-width)",
    minWidth: collapsed ? "var(--sidebar-rail-width)" : "var(--sidebar-width)",
    height: "100%",
    background: "var(--bg-surface)",
    borderRight: "1px solid var(--border-subtle)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "width var(--transition-slow), min-width var(--transition-slow)",
    flexShrink: 0,
  };

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 16px" : "20px 20px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
        }}
        onClick={onToggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <Logo variant="mark" size="md" dark={dark} />
        ) : (
          <Logo variant="full" size="sm" dark={dark} />
        )}
      </div>

      {/* Library */}
      <NavLink
        to="/library"
        style={({ isActive }) => ({
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: collapsed ? "10px 0" : "10px 20px",
          justifyContent: collapsed ? "center" : "flex-start",
          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
          background: isActive ? "var(--bg-raised)" : "transparent",
          borderRight: isActive ? "2px solid var(--accent)" : "2px solid transparent",
          fontSize: 13.5,
          fontFamily: "var(--font-ui)",
          fontWeight: isActive ? 500 : 400,
          textDecoration: "none",
          transition: "background var(--transition-fast), color var(--transition-fast)",
          flexShrink: 0,
        })}
      >
        <LibraryIcon />
        {!collapsed && <span>Library</span>}
      </NavLink>

      {/* Spaces list */}
      <div style={{ flex: 1, overflowY: "auto", padding: collapsed ? "12px 8px" : "12px 0" }}>
        {!collapsed && (
          <button
            onClick={() => setSpacesOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              padding: "4px 20px",
              color: "var(--text-muted)",
              fontSize: 11,
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <ChevronIcon open={spacesOpen} />
            Spaces
          </button>
        )}

        {(spacesOpen || collapsed) && (
          <div style={{ marginTop: collapsed ? 0 : 4 }}>
            {spaces.map((space: SpaceListItem, i: number) => (
              <NavLink
                key={space.id}
                to={`/spaces/${space.id}`}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "9px 0" : "7px 20px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 0,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-raised)" : "transparent",
                  borderRight: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  fontSize: 13.5,
                  fontFamily: "var(--font-ui)",
                  fontWeight: isActive ? 500 : 400,
                  textDecoration: "none",
                  transition: "background var(--transition-fast), color var(--transition-fast)",
                  animation: `fadeIn 200ms ${i * 40}ms both`,
                })}
              >
                {/* Color dot */}
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: space.color ?? "var(--text-muted)",
                    flexShrink: 0,
                  }}
                />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {space.name}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      {space.space_members.length > 1 && (
                        <span style={{ display: "flex", gap: 1 }}>
                          {space.space_members.slice(0, 2).map((m) => (
                            <span
                              key={m.user_id}
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                background: "var(--sand-oat)",
                                color: "var(--text-secondary)",
                                fontSize: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 500,
                              }}
                            >
                              {m.profiles.display_name?.[0] ?? "?"}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: collapsed ? "12px 8px" : "12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <button
          onClick={() => navigate("/spaces")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: collapsed ? "8px" : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 6,
            color: "var(--text-secondary)",
            fontSize: 13,
            fontFamily: "var(--font-ui)",
            transition: "background var(--transition-fast), color var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          <PlusIcon />
          {!collapsed && <span>New Space</span>}
        </button>
        <button
          onClick={() => navigate("/settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: collapsed ? "8px" : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 6,
            color: "var(--text-secondary)",
            fontSize: 13,
            fontFamily: "var(--font-ui)",
            transition: "background var(--transition-fast), color var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          <SettingsIcon />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={signOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: collapsed ? "8px" : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 6,
            color: "var(--text-secondary)",
            fontSize: 13,
            fontFamily: "var(--font-ui)",
            transition: "background var(--transition-fast), color var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          <LogoutIcon />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
