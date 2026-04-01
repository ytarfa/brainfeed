import React from "react";

interface DetailMetadataProps {
  metadata: Record<string, string | number>;
  /** Optional list of keys to exclude from display. */
  excludeKeys?: string[];
}

/**
 * Generic key-value metadata chips.
 *
 * Renders a labeled row of structured chips showing `KEY | value`.
 * Views can pass `excludeKeys` to hide internal/discriminator keys
 * (e.g. `githubType`, `videoId`) that they render structurally instead.
 */
export default function DetailMetadata({ metadata, excludeKeys }: DetailMetadataProps) {
  const excluded = excludeKeys ? new Set(excludeKeys) : null;
  const entries = Object.entries(metadata).filter(
    ([key]) => !excluded || !excluded.has(key),
  );

  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-label mb-2 text-[var(--text-muted)]">Details</p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-[4px] font-ui text-[11.5px]"
          >
            <span className="text-[10px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
              {key}
            </span>
            <span className="h-2.5 w-px bg-[var(--border-subtle)]" />
            <span className="text-[var(--text-secondary)]">
              {typeof val === "number" ? val.toLocaleString() : String(val)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
