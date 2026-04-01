import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import type { Bookmark } from "@brain-feed/types";
import { resolveDetailView, setDefaultDetailView } from "./detailViews/registry";
import DefaultDetailView from "./detailViews/views/DefaultDetailView";

// Self-registering detail views (side-effect imports)
import "./detailViews/views/GitHubDetailView";
import "./detailViews/views/YouTubeDetailView";
import "./detailViews/views/InstagramDetailView";
import "./detailViews/views/ArticleDetailView";

// Register the default/fallback view
setDefaultDetailView(DefaultDetailView);

interface BookmarkDetailProps {
  bookmark: Bookmark | null;
  onClose: () => void;
  spaceName?: string;
  spaceColor?: string;
}

/**
 * Modal shell for bookmark detail views.
 *
 * Handles overlay, animation, escape key, close button, and dialog ARIA.
 * Delegates the scrollable body to the resolved detail view component
 * via the registry.
 */
export default function BookmarkDetail({ bookmark, onClose, spaceName, spaceColor }: BookmarkDetailProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (bookmark) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [bookmark]);

  useEffect(() => {
    if (!bookmark) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bookmark]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!bookmark) return null;

  // Resolve the appropriate detail view for this bookmark type
  const DetailView = resolveDetailView(bookmark);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[200] flex items-center justify-center transition-all duration-[320ms]",
          visible ? "opacity-100" : "opacity-0",
          bookmark ? "pointer-events-auto" : "pointer-events-none",
        )}
        onClick={handleClose}
        style={{
          background: visible
            ? "rgba(0, 0, 0, 0.45)"
            : "rgba(0, 0, 0, 0)",
          backdropFilter: visible ? "blur(12px) saturate(0.8)" : "blur(0px)",
          WebkitBackdropFilter: visible ? "blur(12px) saturate(0.8)" : "blur(0px)",
        }}
      >

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex max-h-[min(92vh,1080px)] w-[min(1200px,94vw)] flex-col overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-base)] transition-all duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          visible ? "scale-100 opacity-100" : "scale-[0.94] opacity-0 translate-y-3",
        )}
        style={{
          boxShadow: visible
            ? "0 24px 80px rgba(0, 0, 0, 0.18), 0 8px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)"
            : "0 0 0 rgba(0,0,0,0)",
        }}
      >
        {/* Close button — floating over content */}
        <button
          onClick={handleClose}
          className={cn(
            "absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
            "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]",
          )}
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        {/* Delegated detail view content */}
        <DetailView
          bookmark={bookmark}
          spaceName={spaceName}
          spaceColor={spaceColor}
        />
      </div>
      </div>
    </>
  );
}
