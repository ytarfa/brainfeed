import React from "react";

interface DetailTopicsProps {
  topics: string[];
}

/**
 * Topic pills section.
 *
 * Renders a labeled row of rounded topic chips with hover accents.
 * Only render when `topics.length > 0`.
 */
export default function DetailTopics({ topics }: DetailTopicsProps) {
  if (topics.length === 0) return null;

  return (
    <div>
      <p className="text-label mb-2 text-[var(--text-muted)]">Topics</p>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((topic, i) => (
          <span
            key={topic}
            className="cursor-default rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-[4px] font-ui text-[11.5px] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
}
