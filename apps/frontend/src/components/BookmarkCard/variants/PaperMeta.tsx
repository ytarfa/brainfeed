import React from "react";
import type { Bookmark } from "@brain-feed/types";

interface PaperMetaProps {
  bookmark: Bookmark;
}

export default function PaperMeta({ bookmark }: PaperMetaProps) {
  const meta = bookmark.metadata;
  if (!meta) return null;

  const authors = typeof meta.authors === "string" ? meta.authors : null;
  const year = typeof meta.year === "number" ? meta.year : null;

  if (!authors && !year) return null;

  return (
    <div className="mb-1.5 font-ui text-[11px] text-[var(--text-muted)] truncate">
      {authors && <span>{authors}</span>}
      {authors && year && <span className="mx-1">&middot;</span>}
      {year && <span>{year}</span>}
    </div>
  );
}
