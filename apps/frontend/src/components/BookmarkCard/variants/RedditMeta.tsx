import React from "react";
import type { Bookmark } from "@brain-feed/types";

interface RedditMetaProps {
  bookmark: Bookmark;
}

export default function RedditMeta({ bookmark }: RedditMetaProps) {
  // Extract subreddit from domain or URL (e.g. "reddit.com" → try to parse /r/...)
  const url = bookmark.url;
  if (!url) return null;

  const match = url.match(/reddit\.com\/r\/([^/?\s]+)/i);
  const subreddit = match?.[1];

  if (!subreddit) return null;

  return (
    <div className="mb-1.5 font-ui text-[11px] text-[var(--text-muted)]">
      r/{subreddit}
    </div>
  );
}
