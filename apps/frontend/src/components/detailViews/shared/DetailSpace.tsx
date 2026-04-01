import React from "react";
import { ChevronDown } from "lucide-react";

interface DetailSpaceProps {
  spaceName: string;
  spaceColor?: string;
}

/**
 * Space name with color dot.
 *
 * Renders a clickable-looking chip with the space color indicator,
 * name, and a chevron dropdown hint.
 */
export default function DetailSpace({ spaceName, spaceColor }: DetailSpaceProps) {
  return (
    <div className="mb-5">
      <p className="text-label mb-2 text-[var(--text-muted)]">Space</p>
      <div className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-[6px] font-ui text-[13px] text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--border-strong)]">
        <span
          className="h-2.5 w-2.5 rounded-full ring-2 ring-[var(--bg-base)]"
          style={{ background: spaceColor ?? "var(--text-muted)" }}
        />
        {spaceName}
        <ChevronDown size={11} className="ml-0.5 text-[var(--text-muted)]" />
      </div>
    </div>
  );
}
