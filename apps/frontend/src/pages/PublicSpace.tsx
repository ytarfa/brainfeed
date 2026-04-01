import React, { useState } from "react";
import { useParams } from "react-router-dom";

import BookmarkCard from "../components/BookmarkCard";
import Logo from "../components/Logo";
import BookmarkDetail from "../components/BookmarkDetail";
import { usePublicSpace } from "../api/hooks";
import type { PublicSpaceBookmark } from "../api/hooks";
import { timeAgo } from "../lib/utils";
import type { Bookmark } from "@brain-feed/types";

export default function PublicSpace() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { data, isLoading } = usePublicSpace(shareToken);
  const [detailId, setDetailId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <p className="text-[var(--text-muted)] text-sm">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center flex-col gap-3">
        <Logo variant="mark" size="lg" />
        <p className="text-[var(--text-muted)] text-sm">This Space doesn&apos;t exist or the link has been revoked.</p>
      </div>
    );
  }

  const { space, bookmarks: bookmarksData } = data;
  const bookmarks = bookmarksData.data;

  const toDisplayBookmark = (b: PublicSpaceBookmark): Bookmark => ({
    id: b.id,
    title: b.title ?? "",
    url: b.url,
    description: b.description,
    notes: null,
    content_type: b.content_type as Bookmark["content_type"],
    source_type: (b.source_type ?? null) as Bookmark["source_type"],
    tags: (b.tags ?? []).map((t) => ({ id: t, label: t })),
    thumbnail_url: b.thumbnail_url,
    created_at: b.created_at,
    updated_at: b.created_at,
    user_id: "",
    spaceId: space.id,
    savedAt: timeAgo(b.created_at),
    domain: b.url ? new URL(b.url).hostname.replace("www.", "") : undefined,
    raw_content: null,
    file_path: null,
    enriched_data: null,
    enrichment_status: "pending",
    digest_status: null,
    source_name: null,
    source_id: null,
    published_at: null,
    expires_at: null,
  });

  const detailBookmark = detailId
    ? bookmarks.find((b) => b.id === detailId)
    : undefined;
  const detail = detailBookmark ? toDisplayBookmark(detailBookmark) : null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Minimal top bar */}
      <header className="h-[52px] border-b border-[var(--border-subtle)] flex items-center px-6 gap-3">
        <Logo variant="full" size="sm" />
        <div className="ml-auto py-[3px] px-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full text-[11px] font-ui text-[var(--text-muted)] font-medium tracking-wide">
          Read only
        </div>
      </header>

      {/* Space header */}
      <div className="max-w-[900px] mx-auto pt-8 px-6 pb-5 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-3 h-3 rounded-full bg-[var(--accent)]" />
          <h1 className="text-display">{space.name}</h1>
        </div>
        {space.description && (
          <p className="text-body text-[var(--text-secondary)] max-w-[540px]">
            {space.description}
          </p>
        )}
        <p className="text-meta mt-1.5">
          {bookmarksData.total ?? bookmarks.length} items
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-[900px] mx-auto px-6 pb-12 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {bookmarks.map((b, i) => (
          <BookmarkCard
            key={b.id}
            bookmark={toDisplayBookmark(b)}

            onClick={() => setDetailId(b.id)}
            index={i}
            readonly
          />
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-4 px-6 text-center">
        <p className="text-xs text-[var(--text-muted)]">
          Curated with{" "}
          <a
            href="/"
            className="text-[var(--accent)] font-medium no-underline hover:underline"
          >
            brainfeed
          </a>
        </p>
      </footer>

      <BookmarkDetail
        bookmark={detail}
        onClose={() => setDetailId(null)}
        spaceName={space.name}
      />
    </div>
  );
}
