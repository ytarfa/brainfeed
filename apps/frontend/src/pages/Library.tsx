import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import BookmarkCard from "../components/BookmarkCard";
import { mockBookmarks } from "../data/mock";

type ContentFilter = "all" | "link" | "note" | "image" | "pdf" | "file";
type SortOption = "saved" | "title" | "source";

interface LayoutContext {
  view: "grid" | "list";
  onCardClick: (id: string) => void;
}

export default function Library() {
  const { view, onCardClick } = useOutletContext<LayoutContext>();
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [sort, setSort] = useState<SortOption>("saved");

  const filtered = mockBookmarks.filter((b) => filter === "all" || b.content_type === filter);

  const filters: { label: string; value: ContentFilter }[] = [
    { label: "All", value: "all" },
    { label: "Links", value: "link" },
    { label: "Notes", value: "note" },
    { label: "Images", value: "image" },
    { label: "PDFs", value: "pdf" },
    { label: "Files", value: "file" },
  ];

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
          Library
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {mockBookmarks.length} items across all Spaces
        </p>
      </div>

      {/* Filter + Sort bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                height: 28,
                padding: "0 12px",
                background: filter === f.value ? "var(--accent-subtle)" : "var(--bg-surface)",
                border: `1px solid ${filter === f.value ? "var(--terra-100)" : "var(--border-subtle)"}`,
                borderRadius: 20,
                fontSize: 12,
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                color: filter === f.value ? "var(--accent-text)" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="text-meta" style={{ flexShrink: 0 }}>Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            style={{
              height: 28,
              padding: "0 8px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "var(--font-ui)",
              color: "var(--text-secondary)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="saved">Date saved</option>
            <option value="title">Title</option>
            <option value="source">Source</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
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
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 20, marginBottom: 8 }}>
            Nothing saved yet
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 300, margin: "0 auto 20px" }}>
            Save your first bookmark or install the browser extension to start building your library.
          </p>
          <button
            style={{
              height: 36,
              padding: "0 20px",
              background: "var(--accent)",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            + Save something
          </button>
        </div>
      )}

      {/* Card grid / list */}
      <div
        style={{
          display: view === "grid" ? "grid" : "flex",
          gridTemplateColumns: view === "grid" ? "repeat(auto-fill, minmax(260px, 1fr))" : undefined,
          flexDirection: view === "list" ? "column" : undefined,
          gap: view === "grid" ? 14 : 8,
        }}
      >
        {filtered.map((bookmark, i) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            view={view}
            onClick={() => onCardClick(bookmark.id)}
            showSpace
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
