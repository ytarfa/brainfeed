import React, { useState, useEffect } from "react";

interface DetailNotesProps {
  initialNotes: string;
}

/**
 * Notes textarea section.
 *
 * Manages its own local editing state seeded from `initialNotes`.
 * Re-syncs when `initialNotes` changes (e.g. bookmark switch).
 */
export default function DetailNotes({ initialNotes }: DetailNotesProps) {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  return (
    <div className="mb-2">
      <p className="text-label mb-2 text-[var(--text-muted)]">Notes</p>
      <textarea
        value={notes}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
        placeholder="Add a note..."
        className="w-full min-h-[90px] resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 font-ui text-[13px] leading-relaxed text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-subtle)]"
      />
    </div>
  );
}
