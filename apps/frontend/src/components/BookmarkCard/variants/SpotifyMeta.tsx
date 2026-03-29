import React from "react";
import type { Bookmark } from "@brain-feed/types";

interface SpotifyMetaProps {
  bookmark: Bookmark;
}

export default function SpotifyMeta({ bookmark }: SpotifyMetaProps) {
  const meta = bookmark.enriched_data?.metadata;
  if (!meta) return null;

  const artist = typeof meta.artist === "string" ? meta.artist : null;
  const album = typeof meta.album === "string" ? meta.album : null;

  if (!artist && !album) return null;

  return (
    <div className="mb-1.5 font-ui text-[11px] text-[var(--text-muted)] truncate">
      {artist && <span>{artist}</span>}
      {artist && album && <span className="mx-1">&middot;</span>}
      {album && <span>{album}</span>}
    </div>
  );
}
