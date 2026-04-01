import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import SaveItemModal from "../components/SaveItemModal";
import GlobalSearch from "../components/GlobalSearch";
import BookmarkDetail from "../components/BookmarkDetail";
import { useBookmark, useSpaces, toBookmark } from "../api/hooks";
import { cn } from "../lib/utils";

interface AppLayoutProps {
  dark: boolean;
  onToggleDark: () => void;
}

export default function AppLayout({ dark, onToggleDark }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailBookmarkId, setDetailBookmarkId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: rawDetail } = useBookmark(detailBookmarkId);
  const { data: spacesData } = useSpaces();
  const spaces = spacesData?.data ?? [];

  const detailBookmark = rawDetail ? toBookmark(rawDetail) : null;
  const detailSpace = detailBookmark
    ? spaces.find((s) => s.id === detailBookmark.spaceId)
    : undefined;

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
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        dark={dark}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onAddClick={() => setSaveOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
          onToggleDark={onToggleDark}
          dark={dark}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />

        {/* Page content via Outlet, with view context */}
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ onCardClick: setDetailBookmarkId, onAddClick: () => setSaveOpen(true) }} />
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
        spaceName={detailSpace?.name}
        spaceColor={detailSpace?.color ?? undefined}
      />
    </div>
  );
}
