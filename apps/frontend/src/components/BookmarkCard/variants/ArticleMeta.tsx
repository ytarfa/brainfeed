import React from "react";
import { User } from "lucide-react";
import type { Bookmark } from "@brain-feed/types";

interface ArticleMetaProps {
  bookmark: Bookmark;
}

export default function ArticleMeta({ bookmark }: ArticleMetaProps) {
  const meta = bookmark.enriched_data?.metadata;
  if (!meta) return null;

  const author = typeof meta.author === "string" ? meta.author : null;
  const siteName = typeof meta.siteName === "string" ? meta.siteName : null;

  if (!author && !siteName) return null;

  return (
    <div className="mb-1.5 flex items-center gap-2.5 font-ui text-[11px] text-[var(--text-muted)]">
      {author && (
        <span className="inline-flex items-center gap-1">
          <User size={10} />
          {author}
        </span>
      )}
      {siteName && (
        <span className="inline-flex items-center gap-1">
          <span className="h-[6px] w-[6px] rounded-full bg-[var(--accent)]" />
          {siteName}
        </span>
      )}
    </div>
  );
}
