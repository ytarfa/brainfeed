import React from "react";
import { Clock } from "lucide-react";
import type { Bookmark } from "@brain-feed/types";

interface YouTubeMetaProps {
  bookmark: Bookmark;
}

export default function YouTubeMeta({ bookmark }: YouTubeMetaProps) {
  const meta = bookmark.enriched_data?.metadata;
  if (!meta) return null;

  const duration = typeof meta.duration === "string" ? meta.duration : null;
  const channel = typeof meta.channel === "string" ? meta.channel : null;

  if (!duration && !channel) return null;

  return (
    <div className="mb-1.5 flex items-center gap-2.5 font-ui text-[11px] text-[var(--text-muted)]">
      {channel && <span>{channel}</span>}
      {duration && (
        <span className="inline-flex items-center gap-1">
          <Clock size={10} />
          {duration}
        </span>
      )}
    </div>
  );
}
