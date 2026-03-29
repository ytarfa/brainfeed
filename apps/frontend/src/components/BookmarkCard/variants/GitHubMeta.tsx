import React from "react";
import { Star } from "lucide-react";
import type { Bookmark } from "@brain-feed/types";

interface GitHubMetaProps {
  bookmark: Bookmark;
}

export default function GitHubMeta({ bookmark }: GitHubMetaProps) {
  const meta = bookmark.metadata;
  if (!meta) return null;

  const stars = typeof meta.stars === "number" ? meta.stars : null;
  const language = typeof meta.language === "string" ? meta.language : null;

  if (!stars && !language) return null;

  return (
    <div className="mb-1.5 flex items-center gap-2.5 font-ui text-[11px] text-[var(--text-muted)]">
      {stars !== null && (
        <span className="inline-flex items-center gap-1">
          <Star size={10} className="text-[var(--color-terra-DEFAULT)]" />
          {stars >= 1000 ? `${(stars / 1000).toFixed(stars >= 10000 ? 0 : 1)}k` : stars.toLocaleString()}
        </span>
      )}
      {language && (
        <span className="inline-flex items-center gap-1">
          <span className="h-[6px] w-[6px] rounded-full bg-[var(--accent)]" />
          {language}
        </span>
      )}
    </div>
  );
}
