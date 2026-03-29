import React from "react";
import type { Bookmark } from "@brain-feed/types";

interface TwitterMetaProps {
  bookmark: Bookmark;
}

export default function TwitterMeta({ bookmark }: TwitterMetaProps) {
  // Try to extract @handle from URL (e.g. twitter.com/username/... or x.com/username/...)
  const url = bookmark.url;
  if (!url) return null;

  const match = url.match(/(?:twitter|x)\.com\/(@?[A-Za-z0-9_]+)/i);
  const handle = match?.[1];

  if (!handle) return null;

  return (
    <div className="mb-1.5 font-ui text-[11px] text-[var(--text-muted)]">
      @{handle.replace(/^@/, "")}
    </div>
  );
}
