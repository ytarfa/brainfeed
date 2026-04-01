import React, { useCallback, useRef, useState, useMemo } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { Settings, Diamond } from "lucide-react";

import BookmarkCard from "../components/BookmarkCard";
import ActivityLog from "../components/ActivityLog";
import { useSpace, useActivity, useDeleteBookmark, toBookmark } from "../api/hooks";
import type { ActivityRow } from "../api/hooks";

interface LayoutContext {
  onCardClick: (id: string) => void;
  onAddClick: () => void;
}

export default function SpaceView() {
  const { id } = useParams<{ id: string }>();
  const { onCardClick, onAddClick } = useOutletContext<LayoutContext>();

  const { data: space, isLoading: spaceLoading } = useSpace(id);
  const { data: activityData } = useActivity(id);
  const deleteBookmark = useDeleteBookmark();
  const [exitingId, setExitingId] = useState<string | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleDelete = useCallback((id: string) => {
    deleteBookmark.mutate(id, {
      onSuccess: () => {
        setExitingId(id);
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = setTimeout(() => setExitingId(null), 600);
      },
    });
  }, [deleteBookmark]);

  const bookmarks = useMemo(
    () => (space?.bookmarks?.data ?? []).map((raw) => toBookmark({ ...raw, bookmark_spaces: raw.bookmark_spaces.map((bs) => ({ ...bs, spaces: { id: bs.space_id, name: space?.name ?? "" } })) })),
    [space],
  );
  const activityEntries: ActivityRow[] = activityData?.data ?? [];
  const itemCount = space?.bookmarks?.total ?? bookmarks.length;
  const memberCount = space?.space_members?.length ?? 0;

  if (spaceLoading) {
    return (
      <div className="p-10 text-center">
        <p className="text-[var(--text-muted)]">Loading space...</p>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="p-10 text-center">
        <p className="text-[var(--text-muted)]">Space not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Space header */}
        <div className="mb-6 flex items-start justify-between gap-4 animate-fade-in">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2.5">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: space.color ?? "var(--text-muted)" }}
              />
              <h1 className="text-display text-[var(--text-primary)]">{space.name}</h1>
            </div>
            {space.description && (
              <p className="text-body max-w-[560px] text-[var(--text-secondary)]">
                {space.description}
              </p>
            )}
            <p className="text-meta mt-1.5">
              {itemCount} items
              {memberCount > 1 && ` \u00B7 shared with ${memberCount - 1} others`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Collaborator avatars */}
            {memberCount > 1 && (
              <div className="flex">
                {space.space_members.slice(0, 3).map((m, i) => (
                  <div
                    key={m.user_id}
                    title={m.profiles.display_name}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg-base)] font-ui text-[11px] font-medium text-white"
                    style={{
                      background: `hsl(${(m.user_id.charCodeAt(1) * 37) % 360}, 40%, 55%)`,
                      marginLeft: i > 0 ? -8 : 0,
                    }}
                  >
                    {m.profiles.display_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                ))}
              </div>
            )}

            <Link
              to={`/spaces/${id}/settings`}
              className="flex h-[30px] items-center gap-[5px] rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 font-ui text-xs text-[var(--text-secondary)] no-underline transition-[border-color] duration-[var(--transition-fast)] hover:border-[var(--border-strong)]"
            >
              <Settings size={12} />
              Settings
            </Link>
          </div>
        </div>

        {/* Empty state */}
        {bookmarks.length === 0 && (
          <div className="animate-fade-in py-[60px] text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] bg-[var(--bg-surface)] text-2xl text-[var(--accent)]">
              <Diamond size={24} />
            </div>
            <h3 className="mb-2 font-display text-lg font-medium">This Space is empty</h3>
            <p className="mx-auto mb-5 max-w-[280px] text-[13px] text-[var(--text-muted)]">
              Add a bookmark or connect a sync source to start filling this Space.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={onAddClick}
                className="h-[34px] cursor-pointer rounded-[7px] bg-[var(--accent)] px-4 font-ui text-[13px] font-medium text-white hover:bg-terra-600"
              >
                + Add bookmark
              </button>
              <Link
                to={`/spaces/${id}/settings`}
                className="flex h-[34px] items-center rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 font-ui text-[13px] text-[var(--text-secondary)] no-underline hover:border-[var(--border-strong)]"
              >
                Connect sync source
              </Link>
            </div>
          </div>
        )}

        {/* Cards */}
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-4"
        >
          {bookmarks.map((bookmark, i) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onClick={() => onCardClick(bookmark.id)}
              onDelete={handleDelete}
              isDeleting={deleteBookmark.isPending && deleteBookmark.variables === bookmark.id}
              isExiting={exitingId === bookmark.id}
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
