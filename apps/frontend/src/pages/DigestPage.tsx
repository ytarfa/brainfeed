import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "../lib/utils";

import { useDigest, useSaveCandidate, useDismissCandidate, useDismissGroup } from "../api/hooks";
import type { DigestCandidate } from "../data/mock";

// ---------------------------------------------------------------------------
// Type icon/color maps
// ---------------------------------------------------------------------------

const typeIcons: Record<string, string> = {
  github: "\u2B21", youtube: "\u25B6", twitter: "\uD835\uDD4F",
  news: "\u25C9", amazon: "\u2606", paper: "\u222B",
  generic: "\u25C8", note: "\u270E", reddit: "\u25CE",
  spotify: "\u266A", article: "\u25C9", academic: "\u222B",
  instagram: "\u25CB",
};

const typeColors: Record<string, string> = {
  github: "#24292e", youtube: "#ff0000", twitter: "#1da1f2",
  news: "#d4845a", amazon: "#ff9900", paper: "#4a7a5b",
  generic: "#6a6660", note: "#8b5e3c", reddit: "#ff4500",
  spotify: "#1db954", article: "#d4845a", academic: "#4a7a5b",
  instagram: "#c13584",
};

// ---------------------------------------------------------------------------
// DigestCandidateCard
// ---------------------------------------------------------------------------

interface DigestCandidateCardProps {
  candidate: DigestCandidate;
  index: number;
  onSave: (id: string) => void;
  onDismiss: (id: string) => void;
  savingId: string | null;
  dismissingId: string | null;
}

function DigestCandidateCard({ candidate, index, onSave, onDismiss, savingId, dismissingId }: DigestCandidateCardProps) {
  const [hovered, setHovered] = useState(false);
  const isBusy = savingId === candidate.id || dismissingId === candidate.id;
  const domain = candidate.url ? (() => { try { return new URL(candidate.url).hostname.replace("www.", ""); } catch { return null; } })() : null;

  return (
    <article
      className={cn(
        "rounded-[10px] border bg-[var(--bg-raised)] p-[14px_14px_12px] transition-[border-color,transform,box-shadow,opacity] duration-[var(--transition-fast)]",
        hovered
          ? "border-[var(--border-strong)] -translate-y-px shadow-md"
          : "border-[var(--border-subtle)] translate-y-0 shadow-none",
        isBusy && "pointer-events-none opacity-50",
      )}
      style={{ animation: `fade-in 240ms ${index * 30}ms both` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      {candidate.thumbnail_url && (
        <div className="mb-2.5 h-[120px] w-full overflow-hidden rounded-md bg-[var(--bg-surface)]">
          <img
            src={candidate.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Source type badge */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-sm border border-terra-100 bg-[var(--accent-subtle)] px-1.5 py-0.5 font-ui text-2xs font-medium text-[var(--accent-text)]">
          <span className="text-[9px]" style={{ color: typeColors[candidate.source_type] ?? "var(--text-muted)" }}>
            {typeIcons[candidate.source_type] ?? "\u25C8"}
          </span>
          {candidate.source_type}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-1.5 line-clamp-2 font-display text-[15px] font-medium leading-[1.35] text-[var(--text-primary)]">
        {candidate.title ?? candidate.url}
      </h3>

      {/* Description */}
      {candidate.description && (
        <p className="mb-2 line-clamp-3 font-ui text-[13px] leading-[1.55] text-[var(--text-secondary)]">
          {candidate.description}
        </p>
      )}

      {/* Meta + actions row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-meta">
          {domain ?? ""}{candidate.published_at ? ` \u00B7 ${new Date(candidate.published_at).toLocaleDateString()}` : ""}
        </span>

        <div className="flex gap-1">
          <button
            onClick={() => onSave(candidate.id)}
            disabled={isBusy}
            className={cn(
              "inline-flex h-[26px] items-center gap-1 rounded-md bg-[var(--accent)] px-2.5 font-ui text-[11px] font-medium text-white transition-opacity duration-[var(--transition-fast)]",
              hovered ? "opacity-100" : "opacity-85",
            )}
            aria-label="Save to library"
          >
            <Plus size={12} /> Save
          </button>
          <button
            onClick={() => onDismiss(candidate.id)}
            disabled={isBusy}
            className={cn(
              "inline-flex h-[26px] items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 font-ui text-[11px] font-medium text-[var(--text-secondary)] transition-opacity duration-[var(--transition-fast)]",
              hovered ? "opacity-100" : "opacity-85",
            )}
            aria-label="Skip"
          >
            <X size={12} /> Skip
          </button>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// DigestPage
// ---------------------------------------------------------------------------

export default function DigestPage() {
  const { data: groups, isLoading } = useDigest();
  const saveCandidate = useSaveCandidate();
  const dismissCandidate = useDismissCandidate();
  const dismissGroup = useDismissGroup();

  const [savingId, setSavingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const totalCandidates = (groups ?? []).reduce((sum, g) => sum + g.candidates.length, 0);

  const handleSave = (id: string) => {
    setSavingId(id);
    saveCandidate.mutate(id, { onSettled: () => setSavingId(null) });
  };

  const handleDismiss = (id: string) => {
    setDismissingId(id);
    dismissCandidate.mutate(id, { onSettled: () => setDismissingId(null) });
  };

  const handleSkipGroup = (sourceName: string, sourceType: string) => {
    dismissGroup.mutate({ source_name: sourceName, source_type: sourceType });
  };

  return (
    <div className="px-6 py-5">
      {/* Header */}
      <div className="mb-5">
        <h1 className="mb-0.5 font-display text-2xl font-medium text-[var(--text-primary)]">Digest</h1>
        <p className="text-[13px] text-[var(--text-muted)]">
          {totalCandidates} new {totalCandidates === 1 ? "item" : "items"} to review
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-[60px] text-center text-[13px] text-[var(--text-muted)]">
          Loading digest...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && totalCandidates === 0 && (
        <div className="animate-fade-in py-20 text-center">
          <div className="mb-4 font-display text-5xl text-[var(--accent)] opacity-30">b.</div>
          <h3 className="mb-2 font-display text-xl font-medium">You're all caught up</h3>
          <p className="mx-auto max-w-[300px] text-[13px] text-[var(--text-muted)]">
            No new content to review right now. Check back later or connect more sources.
          </p>
        </div>
      )}

      {/* Grouped feed */}
      {!isLoading && groups && groups.length > 0 && (
        <div className="flex flex-col gap-8">
          {groups.map((group, gi) => (
            <section
              key={`${group.source_name}-${group.source_type}`}
              style={{ animation: `fade-in 240ms ${gi * 60}ms both` }}
            >
              {/* Group header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm"
                    style={{ color: typeColors[group.source_type] ?? "var(--text-muted)" }}
                  >
                    {typeIcons[group.source_type] ?? "\u25C8"}
                  </span>
                  <h2 className="font-display text-base font-medium text-[var(--text-primary)]">
                    {group.source_name}
                  </h2>
                  <span className="font-ui text-xs text-[var(--text-muted)]">
                    {group.candidates.length} {group.candidates.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <button
                  onClick={() => handleSkipGroup(group.source_name, group.source_type)}
                  disabled={dismissGroup.isPending}
                  className="h-[26px] rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 font-ui text-[11px] font-medium text-[var(--text-secondary)] transition-all duration-[var(--transition-fast)] hover:bg-[var(--bg-raised)]"
                >
                  Skip All
                </button>
              </div>

              {/* Candidate cards grid */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
                {group.candidates.map((candidate, ci) => (
                  <DigestCandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    index={ci}
                    onSave={handleSave}
                    onDismiss={handleDismiss}
                    savingId={savingId}
                    dismissingId={dismissingId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
