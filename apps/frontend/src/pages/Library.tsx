import React, { useCallback, useRef, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

import BookmarkCard from "../components/BookmarkCard";
import { useBookmarks, useSpaces, useDeleteBookmark, toBookmark, useDigestSummary } from "../api/hooks";

type SortOption = "saved" | "title" | "source";

interface LayoutContext {
  view: "grid" | "list";
  onCardClick: (id: string) => void;
  onAddClick: () => void;
}

const sortMap: Record<SortOption, string> = {
  saved: "created_at",
  title: "title",
  source: "source_type",
};

export default function Library() {
  const { view, onCardClick, onAddClick } = useOutletContext<LayoutContext>();
  const [sort, setSort] = useState<SortOption>("saved");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const navigate = useNavigate();

  const { data: bookmarksData, isLoading } = useBookmarks({
    sort: sortMap[sort],
    order: "desc",
  });
  const { data: spacesData } = useSpaces();
  const { data: digestSummary } = useDigestSummary();
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
    () => (bookmarksData?.data ?? []).map(toBookmark),
    [bookmarksData],
  );
  const spaces = spacesData?.data ?? [];
  const total = bookmarksData?.total ?? bookmarks.length;

  const getSpace = (spaceId: string) => spaces.find((s) => s.id === spaceId);

  const digestCount = digestSummary?.total ?? 0;
  const digestGroups = digestSummary?.groups ?? [];
  const showBanner = digestCount > 0 && !bannerDismissed;

  return (
    <div className="px-6 py-5">
      {/* Digest banner */}
      {showBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-terra-100 bg-[var(--accent-subtle)] px-4 py-3 animate-fade-in">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-[5px] font-ui text-2xs font-medium text-white">
              {digestCount}
            </span>
            <span className="truncate font-ui text-[13px] text-[var(--text-primary)]">
              new {digestCount === 1 ? "item" : "items"} in your Digest
              {digestGroups.length > 0 && (
                <span className="ml-1 text-[var(--text-muted)]">
                  from {digestGroups.map((g) => g.source_name).join(", ")}
                </span>
              )}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => navigate("/digest")}
              className="h-7 cursor-pointer rounded-md bg-[var(--accent)] px-3.5 font-ui text-xs font-medium text-white transition-opacity duration-[var(--transition-fast)] hover:opacity-90"
            >
              Review
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Dismiss banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <h1 className="mb-0.5 font-display text-2xl font-medium text-[var(--text-primary)]">Library</h1>
        <p className="text-[13px] text-[var(--text-muted)]">{total} items across all Spaces</p>
      </div>

      {/* Sort bar */}
      <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-meta shrink-0">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="h-7 cursor-pointer rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 font-ui text-xs text-[var(--text-secondary)] outline-none"
          >
            <option value="saved">Date saved</option>
            <option value="title">Title</option>
            <option value="source">Source</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-[60px] text-center text-[13px] text-[var(--text-muted)]">
          Loading bookmarks...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && bookmarks.length === 0 && (
        <div className="animate-fade-in py-20 text-center">
          <div className="mb-4 font-display text-5xl text-[var(--accent)] opacity-30">b.</div>
          <h3 className="mb-2 font-display text-xl font-medium">Nothing saved yet</h3>
          <p className="mx-auto mb-5 max-w-[300px] text-[13px] text-[var(--text-muted)]">
            Save your first bookmark or install the browser extension to start building your library.
          </p>
          <button
            onClick={onAddClick}
            className="h-9 cursor-pointer rounded-lg bg-[var(--accent)] px-5 font-ui text-[13px] font-medium text-white hover:bg-terra-600"
          >
            + Save something
          </button>
        </div>
      )}

      {/* Card grid / list */}
      {!isLoading && bookmarks.length > 0 && (
        <div
          className={cn(
            view === "grid"
              ? "grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-4"
              : "flex flex-col gap-2.5",
          )}
        >
          {bookmarks.map((bookmark, i) => {
            const space = getSpace(bookmark.spaceId);
            return (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                view={view}
                onClick={() => onCardClick(bookmark.id)}
                onDelete={handleDelete}
                isDeleting={deleteBookmark.isPending && deleteBookmark.variables === bookmark.id}
                isExiting={exitingId === bookmark.id}
                showSpace
                spaceName={space?.name}
                spaceColor={space?.color ?? undefined}
                index={i}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
