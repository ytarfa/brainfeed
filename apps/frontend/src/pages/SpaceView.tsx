import React, { useState } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import BookmarkCard from "../components/BookmarkCard";
import ActivityLog from "../components/ActivityLog";
import { mockSpaces, mockBookmarks, mockActivity, type ActivityEntry } from "../data/mock";

interface LayoutContext {
  view: "grid" | "list";
  onCardClick: (id: string) => void;
}

export default function SpaceView() {
  const { id } = useParams<{ id: string }>();
  const { view, onCardClick } = useOutletContext<LayoutContext>();

  const space = mockSpaces.find((s) => s.id === id);
  const bookmarks = mockBookmarks.filter((b) => b.spaceId === id);
  const [activity, setActivity] = useState<ActivityEntry[]>(
    mockActivity.filter((a) => a.spaceId === id)
  );

  if (!space) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Space not found.</p>
      </div>
    );
  }

  const handleAccept = (entryId: string) => {
    setActivity((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, accepted: true } : e))
    );
  };
  const handleUndo = (entryId: string) => {
    setActivity((prev) => prev.filter((e) => e.id !== entryId));
  };

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
                  background: space.color,
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
              {space.itemCount} items
              {space.isShared && ` · shared with ${space.collaborators.length - 1} others`}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Collaborator avatars */}
            {space.isShared && (
              <div style={{ display: "flex" }}>
                {space.collaborators.slice(0, 3).map((c, i) => (
                  <div
                    key={c.id}
                    title={c.name}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: `hsl(${(c.id.charCodeAt(1) * 37) % 360}, 40%, 55%)`,
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
                    {c.avatar}
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
              ◈
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
      {activity.length > 0 && (
        <ActivityLog
          entries={activity}
          onAccept={handleAccept}
          onUndo={handleUndo}
        />
      )}
    </div>
  );
}
