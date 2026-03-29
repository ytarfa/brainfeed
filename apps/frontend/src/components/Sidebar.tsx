import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Library,
  Newspaper,
  ChevronDown,
  Plus,
  Settings,
  LogOut,
  RefreshCw,
} from "lucide-react";

import Logo from "./Logo";
import { useSpaces, useDigestSummary } from "../api/hooks";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import type { SpaceListItem } from "../api/hooks";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  dark?: boolean;
}

export default function Sidebar({ collapsed = false, onToggle, dark = false }: SidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [spacesOpen, setSpacesOpen] = useState(true);
  const { data: spacesData } = useSpaces();
  const { data: digestSummary } = useDigestSummary();
  const spaces = spacesData?.data ?? [];
  const digestCount = digestSummary?.total ?? 0;

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]",
        "transition-[width,min-width] duration-300 ease-in-out",
      )}
      style={{
        width: collapsed ? "var(--sidebar-rail-width)" : "var(--sidebar-width)",
        minWidth: collapsed ? "var(--sidebar-rail-width)" : "var(--sidebar-width)",
      }}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex cursor-pointer items-center border-b border-[var(--border-subtle)]",
          collapsed ? "justify-center px-4 py-5" : "justify-between px-5 pb-4 pt-5",
        )}
        onClick={onToggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <Logo variant="mark" size="md" dark={dark} />
        ) : (
          <Logo variant="full" size="sm" dark={dark} />
        )}
      </div>

      {/* Nav links */}
      <NavLink
        to="/library"
        className={({ isActive }) =>
          cn(
            "group flex shrink-0 items-center gap-2 border-r-2 font-ui text-[13.5px] no-underline",
            "transition-[background,color] duration-[120ms] ease-in-out",
            collapsed ? "justify-center py-2.5" : "justify-start px-5 py-2.5",
            isActive
              ? "border-[var(--accent)] bg-[var(--bg-raised)] font-medium text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
          )
        }
      >
        <Library size={14} strokeWidth={1.6} />
        {!collapsed && <span>Library</span>}
      </NavLink>

      <NavLink
        to="/digest"
        className={({ isActive }) =>
          cn(
            "group flex shrink-0 items-center gap-2 border-r-2 font-ui text-[13.5px] no-underline",
            "transition-[background,color] duration-[120ms] ease-in-out",
            collapsed ? "justify-center py-2.5" : "justify-start px-5 py-2.5",
            isActive
              ? "border-[var(--accent)] bg-[var(--bg-raised)] font-medium text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
          )
        }
      >
        <Newspaper size={14} strokeWidth={1.6} />
        {!collapsed && (
          <>
            <span className="flex-1">Digest</span>
            {digestCount > 0 && (
              <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-1 font-ui text-[9px] font-medium text-white">
                {digestCount > 99 ? "99+" : digestCount}
              </span>
            )}
          </>
        )}
      </NavLink>

      {/* Spaces list */}
      <div
        className={cn(
          "flex-1 overflow-y-auto",
          collapsed ? "px-2 py-3" : "py-3",
        )}
      >
        {!collapsed && (
          <button
            onClick={() => setSpacesOpen((v) => !v)}
            className="flex w-full cursor-pointer items-center gap-1.5 px-5 py-1 text-left font-ui text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            <ChevronDown
              size={12}
              strokeWidth={1.8}
              className={cn(
                "transition-transform duration-200",
                !spacesOpen && "-rotate-90",
              )}
            />
            Spaces
          </button>
        )}

        {(spacesOpen || collapsed) && (
          <div className={cn(!collapsed && "mt-1")}>
            {spaces.map((space: SpaceListItem, i: number) => (
              <NavLink
                key={space.id}
                to={`/spaces/${space.id}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 border-r-2 font-ui text-[13.5px] no-underline",
                    "transition-[background,color] duration-[120ms] ease-in-out",
                    collapsed ? "justify-center py-2.5" : "justify-start px-5 py-[7px]",
                    isActive
                      ? "border-[var(--accent)] bg-[var(--bg-raised)] font-medium text-[var(--text-primary)]"
                      : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
                  )
                }
                style={{
                  animation: `fade-in 200ms ${i * 40}ms both`,
                }}
              >
                {/* Color dot */}
                <span
                  className="h-[7px] w-[7px] shrink-0 rounded-full"
                  style={{ background: space.color ?? "var(--text-muted)" }}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {space.name}
                    </span>
                    {space.space_members.length > 1 && (
                      <span className="flex shrink-0 items-center gap-1">
                        <span className="flex gap-px">
                          {space.space_members.slice(0, 2).map((m) => (
                            <span
                              key={m.user_id}
                              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sand-oat text-[8px] font-medium text-[var(--text-secondary)]"
                            >
                              {m.profiles.display_name?.[0] ?? "?"}
                            </span>
                          ))}
                        </span>
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div
        className={cn(
          "flex flex-col gap-0.5 border-t border-[var(--border-subtle)]",
          collapsed ? "px-2 py-3" : "px-3 py-3",
        )}
      >
        <button
          onClick={() => navigate("/spaces")}
          className={cn(
            "flex items-center gap-2 rounded-md font-ui text-[13px] text-[var(--text-secondary)]",
            "transition-[background,color] duration-[120ms] ease-in-out",
            "hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
            collapsed ? "justify-center p-2" : "justify-start px-2.5 py-2",
          )}
        >
          <Plus size={14} strokeWidth={1.8} />
          {!collapsed && <span>New Space</span>}
        </button>
        <button
          onClick={() => navigate("/settings")}
          className={cn(
            "flex items-center gap-2 rounded-md font-ui text-[13px] text-[var(--text-secondary)]",
            "transition-[background,color] duration-[120ms] ease-in-out",
            "hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
            collapsed ? "justify-center p-2" : "justify-start px-2.5 py-2",
          )}
        >
          <Settings size={16} strokeWidth={1.4} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-2 rounded-md font-ui text-[13px] text-[var(--text-secondary)]",
            "transition-[background,color] duration-[120ms] ease-in-out",
            "hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
            collapsed ? "justify-center p-2" : "justify-start px-2.5 py-2",
          )}
        >
          <LogOut size={16} strokeWidth={1.4} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
