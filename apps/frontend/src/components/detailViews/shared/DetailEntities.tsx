import React from "react";

interface Entity {
  name: string;
  type: string;
}

interface DetailEntitiesProps {
  entities: Entity[];
}

/**
 * Entity chips section.
 *
 * Renders a labeled row of structured entity chips showing `type | name`.
 * Only render when `entities.length > 0`.
 */
export default function DetailEntities({ entities }: DetailEntitiesProps) {
  if (entities.length === 0) return null;

  return (
    <div>
      <p className="text-label mb-2 text-[var(--text-muted)]">Entities</p>
      <div className="flex flex-wrap gap-1.5">
        {entities.map((entity) => (
          <div
            key={`${entity.name}-${entity.type}`}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-[4px] font-ui text-[11.5px] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-strong)]"
          >
            <span className="text-[10px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
              {entity.type}
            </span>
            <span className="h-2.5 w-px bg-[var(--border-subtle)]" />
            {entity.name}
          </div>
        ))}
      </div>
    </div>
  );
}
