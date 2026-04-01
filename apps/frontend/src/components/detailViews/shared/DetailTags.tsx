import React from "react";
import { Hash } from "lucide-react";

import type { Tag } from "@brain-feed/types";

interface DetailTagsProps {
  tags: Tag[];
}

/**
 * Tag pills with "+ Add tag" button.
 *
 * Renders colored accent pills for each tag plus a dashed
 * "add" button at the end.
 */
export default function DetailTags({ tags }: DetailTagsProps) {
  return (
    <div className="mb-5">
      <p className="text-label mb-2 text-[var(--text-muted)]">Tags</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="flex cursor-default items-center gap-1 rounded-full bg-[var(--accent-subtle)] px-2.5 py-[3px] font-ui text-[11px] font-medium text-[var(--accent-text)]"
          >
            <Hash size={9} strokeWidth={2.5} className="opacity-60" />
            {tag.label}
          </span>
        ))}
        <button className="rounded-full border border-dashed border-[var(--border-strong)] bg-transparent px-2.5 py-[3px] font-ui text-[11px] text-[var(--text-muted)] transition-colors duration-150 hover:border-[var(--accent)] hover:text-[var(--accent-text)]">
          + Add tag
        </button>
      </div>
    </div>
  );
}
