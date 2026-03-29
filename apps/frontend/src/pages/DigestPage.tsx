import React, { useState } from "react";

import { useDigest, useSaveCandidate, useDismissCandidate, useDismissGroup } from "../api/hooks";
import type { DigestCandidate } from "../data/mock";

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SkipIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const typeIcons: Record<string, string> = {
  github: "\u2B21",
  youtube: "\u25B6",
  twitter: "\uD835\uDD4F",
  news: "\u25C9",
  amazon: "\u2606",
  paper: "\u222B",
  generic: "\u25C8",
  note: "\u270E",
  reddit: "\u25CE",
  spotify: "\u266A",
  article: "\u25C9",
  academic: "\u222B",
  instagram: "\u25CB",
};

const typeColors: Record<string, string> = {
  github: "#24292e",
  youtube: "#ff0000",
  twitter: "#1da1f2",
  news: "#d4845a",
  amazon: "#ff9900",
  paper: "#4a7a5b",
  generic: "#6a6660",
  note: "#8b5e3c",
  reddit: "#ff4500",
  spotify: "#1db954",
  article: "#d4845a",
  academic: "#4a7a5b",
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

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-raised)",
    border: `1px solid ${hovered ? "var(--border-strong)" : "var(--border-subtle)"}`,
    borderRadius: 10,
    padding: "14px 14px 12px",
    transition: "border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast), opacity 200ms",
    transform: hovered ? "translateY(-1px)" : "none",
    boxShadow: hovered ? "0 4px 16px rgba(30,28,26,0.07)" : "none",
    animation: `fadeIn 240ms ${index * 30}ms both`,
    opacity: isBusy ? 0.5 : 1,
    pointerEvents: isBusy ? "none" : "auto",
  };

  return (
    <article
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      {candidate.thumbnail_url && (
        <div
          style={{
            width: "100%",
            height: 120,
            background: "var(--bg-surface)",
            borderRadius: 6,
            marginBottom: 10,
            overflow: "hidden",
          }}
        >
          <img
            src={candidate.thumbnail_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Source type badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 6px",
            background: "var(--accent-subtle)",
            border: "1px solid var(--terra-100)",
            borderRadius: 4,
            fontSize: 10,
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            color: "var(--accent-text)",
          }}
        >
          <span style={{ fontSize: 9, color: typeColors[candidate.source_type] ?? "var(--text-muted)" }}>
            {typeIcons[candidate.source_type] ?? "\u25C8"}
          </span>
          {candidate.source_type}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: 15,
          lineHeight: 1.35,
          color: "var(--text-primary)",
          marginBottom: 6,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {candidate.title ?? candidate.url}
      </h3>

      {/* Description */}
      {candidate.description && (
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--text-secondary)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          {candidate.description}
        </p>
      )}

      {/* Meta + actions row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="text-meta">
          {domain ?? ""}{candidate.published_at ? ` \u00B7 ${new Date(candidate.published_at).toLocaleDateString()}` : ""}
        </span>

        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onSave(candidate.id)}
            disabled={isBusy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              height: 26,
              padding: "0 10px",
              background: "var(--accent)",
              border: "none",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              color: "#fff",
              cursor: "pointer",
              transition: "opacity var(--transition-fast)",
              opacity: hovered ? 1 : 0.85,
            }}
            aria-label="Save to library"
          >
            <SaveIcon /> Save
          </button>
          <button
            onClick={() => onDismiss(candidate.id)}
            disabled={isBusy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              height: 26,
              padding: "0 10px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "opacity var(--transition-fast)",
              opacity: hovered ? 1 : 0.85,
            }}
            aria-label="Skip"
          >
            <SkipIcon /> Skip
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
    saveCandidate.mutate(id, {
      onSettled: () => setSavingId(null),
    });
  };

  const handleDismiss = (id: string) => {
    setDismissingId(id);
    dismissCandidate.mutate(id, {
      onSettled: () => setDismissingId(null),
    });
  };

  const handleSkipGroup = (sourceName: string, sourceType: string) => {
    dismissGroup.mutate({ source_name: sourceName, source_type: sourceType });
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: 24,
            color: "var(--text-primary)",
            marginBottom: 2,
          }}
        >
          Digest
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {totalCandidates} new {totalCandidates === 1 ? "item" : "items"} to review
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)", fontSize: 13 }}>
          Loading digest...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && totalCandidates === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 24px",
            animation: "fadeIn 320ms both",
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
              opacity: 0.3,
              fontFamily: "var(--font-display)",
              color: "var(--accent)",
            }}
          >
            b.
          </div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 20,
              marginBottom: 8,
            }}
          >
            You're all caught up
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              maxWidth: 300,
              margin: "0 auto",
            }}
          >
            No new content to review right now. Check back later or connect more sources.
          </p>
        </div>
      )}

      {/* Grouped feed */}
      {!isLoading && groups && groups.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {groups.map((group, gi) => (
            <section
              key={`${group.source_name}-${group.source_type}`}
              style={{ animation: `fadeIn 240ms ${gi * 60}ms both` }}
            >
              {/* Group header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 14,
                      color: typeColors[group.source_type] ?? "var(--text-muted)",
                    }}
                  >
                    {typeIcons[group.source_type] ?? "\u25C8"}
                  </span>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                      fontSize: 16,
                      color: "var(--text-primary)",
                    }}
                  >
                    {group.source_name}
                  </h2>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--font-ui)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {group.candidates.length} {group.candidates.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <button
                  onClick={() => handleSkipGroup(group.source_name, group.source_type)}
                  disabled={dismissGroup.isPending}
                  style={{
                    height: 26,
                    padding: "0 10px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"; }}
                >
                  Skip All
                </button>
              </div>

              {/* Candidate cards grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 14,
                }}
              >
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
