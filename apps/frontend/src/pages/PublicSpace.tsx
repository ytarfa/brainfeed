import React, { useState } from "react";
import { useParams } from "react-router-dom";
import BookmarkCard from "../components/BookmarkCard";
import Logo from "../components/Logo";
import BookmarkDetail from "../components/BookmarkDetail";
import { mockSpaces, mockBookmarks } from "../data/mock";

export default function PublicSpace() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const space = mockSpaces.find((s) => s.shareToken === shareToken);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = detailId ? (mockBookmarks.find((b) => b.id === detailId) ?? null) : null;

  if (!space) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Logo variant="mark" size="lg" />
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>This Space doesn't exist or the link has been revoked.</p>
      </div>
    );
  }

  const bookmarks = mockBookmarks.filter((b) => b.spaceId === space.id);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Minimal top bar */}
      <header
        style={{
          height: 52,
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 12,
        }}
      >
        <Logo variant="full" size="sm" />
        <div
          style={{
            marginLeft: "auto",
            padding: "3px 10px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 20,
            fontSize: 11,
            fontFamily: "var(--font-ui)",
            color: "var(--text-muted)",
            fontWeight: 500,
            letterSpacing: "0.04em",
          }}
        >
          Read only
        </div>
      </header>

      {/* Space header */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "32px 24px 20px",
          animation: "fadeIn 320ms both",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: space.color }} />
          <h1 className="text-display">{space.name}</h1>
        </div>
        {space.description && (
          <p className="text-body" style={{ color: "var(--text-secondary)", maxWidth: 540 }}>
            {space.description}
          </p>
        )}
        <p className="text-meta" style={{ marginTop: 6 }}>
          {space.itemCount} items
        </p>
      </div>

      {/* Cards */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 24px 48px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {bookmarks.map((b, i) => (
          <BookmarkCard
            key={b.id}
            bookmark={b}
            view="grid"
            onClick={() => setDetailId(b.id)}
            index={i}
            readonly
          />
        ))}
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "16px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Curated with{" "}
          <a
            href="/"
            style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}
          >
            brainfeed
          </a>
        </p>
      </footer>

      <BookmarkDetail bookmark={detail} onClose={() => setDetailId(null)} />
    </div>
  );
}
