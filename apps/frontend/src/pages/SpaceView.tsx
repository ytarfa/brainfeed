import React, { useMemo } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";

import BookmarkCard from "../components/BookmarkCard";
import ActivityLog from "../components/ActivityLog";
import { useSpace, useActivity, toBookmark } from "../api/hooks";
import type { ActivityRow } from "../api/hooks";

interface LayoutContext {
  view: "grid" | "list";
  onCardClick: (id: string) => void;
}

export default function SpaceView() {
  const { id } = useParams<{ id: string }>();
  const { view, onCardClick } = useOutletContext<LayoutContext>();

  const { data: space, isLoading: spaceLoading } = useSpace(id);
  const { data: activityData } = useActivity(id);

  const bookmarks = useMemo(
    () => (space?.bookmarks?.data ?? []).map((raw) => toBookmark({ ...raw, bookmark_spaces: raw.bookmark_spaces.map((bs) => ({ ...bs, spaces: { id: bs.space_id, name: space?.name ?? "" } })) })),
    [space],
  );
  const activityEntries: ActivityRow[] = activityData?.data ?? [];
  const itemCount = space?.bookmarks?.total ?? bookmarks.length;
  const memberCount = space?.space_members?.length ?? 0;

  if (spaceLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading space...</p>
      </div>
    );
  }

  if (!space) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Space not found.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {/* Space header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
            gap: 16,
            animation: "fadeIn 240ms both",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: space.color ?? "var(--text-muted)",
                  flexShrink: 0,
                }}
              />
              <h1 className="text-display" style={{ color: "var(--text-primary)" }}>
                {space.name}
              </h1>
            </div>
            {space.description && (
              <p className="text-body" style={{ color: "var(--text-secondary)", maxWidth: 560 }}>
                {space.description}
              </p>
            )}
            <p className="text-meta" style={{ marginTop: 6 }}>
              {itemCount} items
              {memberCount > 1 && ` \u00B7 shared with ${memberCount - 1} others`}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Collaborator avatars */}
            {memberCount > 1 && (
              <div style={{ display: "flex" }}>
                {space.space_members.slice(0, 3).map((m, i) => (
                  <div
                    key={m.user_id}
                    title={m.profiles.display_name}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: `hsl(${(m.user_id.charCodeAt(1) * 37) % 360}, 40%, 55%)`,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--bg-base)",
                      marginLeft: i > 0 ? -8 : 0,
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    {m.profiles.display_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                ))}
              </div>
            )}

            <Link
              to={`/spaces/${id}/settings`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                height: 30,
                padding: "0 12px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 7,
                fontSize: 12,
                fontFamily: "var(--font-ui)",
                color: "var(--text-secondary)",
                textDecoration: "none",
                transition: "border-color var(--transition-fast)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M6 1v1M6 10v1M1 6h1M10 6h1M2.4 2.4l.7.7M8.9 8.9l.7.7M2.4 9.6l.7-.7M8.9 3.1l.7-.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              Settings
            </Link>
          </div>
        </div>

        {/* Empty state */}
        {bookmarks.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 24px", animation: "fadeIn 320ms both" }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: "var(--bg-surface)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 24,
                color: "var(--accent)",
              }}
            >
              \u25C8
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 18, marginBottom: 8 }}>
              This Space is empty
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 280, margin: "0 auto 20px" }}>
              Add a bookmark or connect a sync source to start filling this Space.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                style={{
                  height: 34,
                  padding: "0 16px",
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: 7,
                  fontSize: 13,
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                + Add bookmark
              </button>
              <Link
                to={`/spaces/${id}/settings`}
                style={{
                  height: 34,
                  padding: "0 16px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 7,
                  fontSize: 13,
                  fontFamily: "var(--font-ui)",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                Connect sync source
              </Link>
            </div>
          </div>
        )}

        {/* Cards */}
        <div
          style={{
            display: view === "grid" ? "grid" : "flex",
            gridTemplateColumns: view === "grid" ? "repeat(auto-fill, minmax(260px, 1fr))" : undefined,
            flexDirection: view === "list" ? "column" : undefined,
            gap: view === "grid" ? 14 : 8,
          }}
        >
          {bookmarks.map((bookmark, i) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              view={view}
              onClick={() => onCardClick(bookmark.id)}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Activity log */}
      {activityEntries.length > 0 && (
        <ActivityLog
          entries={activityEntries.map((a) => ({
            id: a.id,
            action: a.action,
            bookmarkTitle: a.bookmarks?.title ?? "",
            timestamp: a.created_at,
            space_id: id ?? "",
            bookmark_id: a.bookmarks?.id ?? "",
            user_id: a.profiles?.id ?? "",
            created_at: a.created_at,
            details: a.details,
          }))}
          onAccept={() => {}}
          onUndo={() => {}}
        />
      )}
    </div>
  );
}
