import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import SaveItemModal from "../components/SaveItemModal";
import GlobalSearch from "../components/GlobalSearch";
import BookmarkDetail from "../components/BookmarkDetail";
import { mockBookmarks } from "../data/mock";

interface AppLayoutProps {
  dark: boolean;
  onToggleDark: () => void;
}

export default function AppLayout({ dark, onToggleDark }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [saveOpen, setSaveOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailBookmarkId, setDetailBookmarkId] = useState<string | null>(null);
  const navigate = useNavigate();

  const detailBookmark = detailBookmarkId
    ? mockBookmarks.find((b) => b.id === detailBookmarkId) ?? null
    : null;

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearchSelect = useCallback((id: string) => {
    setDetailBookmarkId(id);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-base)",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        dark={dark}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          onAddClick={() => setSaveOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
          view={view}
          onViewChange={setView}
          onToggleDark={onToggleDark}
          dark={dark}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />

        {/* Page content via Outlet, with view context */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Outlet context={{ view, onCardClick: setDetailBookmarkId }} />
        </main>
      </div>

      {/* Modals & overlays */}
      <SaveItemModal open={saveOpen} onClose={() => setSaveOpen(false)} />
      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSearchSelect}
      />
      <BookmarkDetail
        bookmark={detailBookmark}
        onClose={() => setDetailBookmarkId(null)}
      />
    </div>
  );
}
