import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "../lib/utils";

import { useSpaces } from "../api/hooks";
import type { SpaceListItem } from "../api/hooks";

export default function AllSpaces() {
  const { data: spacesData, isLoading } = useSpaces();
  const spaces: SpaceListItem[] = spacesData?.data ?? [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="mb-0.5 font-display text-2xl font-medium text-[var(--text-primary)]">Spaces</h1>
          <p className="text-[13px] text-[var(--text-muted)]">
            {spaces.length} spaces &middot; organize your saved content
          </p>
        </div>
        <button className="flex h-9 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 font-ui text-[13px] font-medium text-white hover:bg-terra-600">
          <Plus size={16} />
          New Space
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-[60px] text-center text-[13px] text-[var(--text-muted)]">
          Loading spaces...
        </div>
      )}

      {/* Space cards grid */}
      {!isLoading && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
          {spaces.map((space, i) => {
            const itemCount = space.bookmark_spaces?.[0]?.count ?? 0;
            const hasMembers = space.space_members.length > 1;
            return (
              <Link
                key={space.id}
                to={`/spaces/${space.id}`}
                className="block no-underline"
                style={{ animation: `fade-in 240ms ${i * 40}ms both` }}
              >
                <div className="cursor-pointer rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-[18px_18px_16px] transition-[border-color,transform] duration-[var(--transition-fast)] hover:-translate-y-px hover:border-[var(--border-strong)]">
                  {/* Space color bar */}
                  <div
                    className="mb-3 h-1 w-8 rounded-sm opacity-80"
                    style={{ background: space.color ?? "var(--text-muted)" }}
                  />

                  <h3 className="mb-1.5 font-display text-[15px] font-medium leading-[1.3] text-[var(--text-primary)]">
                    {space.name}
                  </h3>

                  {space.description && (
                    <p className="mb-3 line-clamp-2 text-xs leading-[1.5] text-[var(--text-muted)]">
                      {space.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-meta">{itemCount} items</span>

                    <div className="flex items-center gap-1.5">
                      {hasMembers && (
                        <div className="flex">
                          {space.space_members.slice(0, 3).map((m, ci) => (
                            <div
                              key={m.user_id}
                              title={m.profiles.display_name}
                              className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-[var(--bg-raised)] font-ui text-[8px] font-medium text-white"
                              style={{
                                background: `hsl(${(m.user_id.charCodeAt(1) * 37) % 360}, 40%, 55%)`,
                                marginLeft: ci > 0 ? -5 : 0,
                              }}
                            >
                              {m.profiles.display_name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Create new Space card */}
          <button
            onClick={() => {/* open create modal */}}
            className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-[var(--border-strong)] bg-transparent p-[18px] text-[var(--text-muted)] transition-[border-color,color] duration-[var(--transition-fast)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            style={{ animation: `fade-in 240ms ${spaces.length * 40}ms both` }}
          >
            <Plus size={24} />
            <span className="font-ui text-xs font-medium">New Space</span>
          </button>
        </div>
      )}
    </div>
  );
}
