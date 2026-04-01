import React, { useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Film,
  Globe,
  Heart,
  Image,
  MessageCircle,
  Play,
} from "lucide-react";

import type { Bookmark, MediaItem } from "@brain-feed/types";

import { cn } from "../../../lib/utils";
import ThumbnailPlaceholder from "../../ThumbnailPlaceholder";
import DetailSummary from "../shared/DetailSummary";
import DetailTopics from "../shared/DetailTopics";
import DetailEntities from "../shared/DetailEntities";
import DetailTags from "../shared/DetailTags";
import DetailSpace from "../shared/DetailSpace";
import DetailNotes from "../shared/DetailNotes";
import DetailFooter from "../shared/DetailFooter";
import type { DetailViewProps } from "../types";
import { registerDetailView } from "../registry";

/* ------------------------------------------------------------------ */
/*  Metadata helpers                                                   */
/* ------------------------------------------------------------------ */

type Meta = Record<string, string | number> | null | undefined;

function meta(b: Bookmark): Meta {
  return b.enriched_data?.metadata;
}

function str(m: Meta, key: string): string | undefined {
  if (!m || !(key in m)) return undefined;
  return String(m[key]);
}

function num(m: Meta, key: string): number | undefined {
  if (!m || !(key in m)) return undefined;
  const v = m[key];
  return typeof v === "number" ? v : Number(v) || undefined;
}

/* ------------------------------------------------------------------ */
/*  Carousel                                                          */
/* ------------------------------------------------------------------ */

interface CarouselProps {
  items: MediaItem[];
  isReel: boolean;
}

function Carousel({ items, isReel }: CarouselProps) {
  const [idx, setIdx] = useState(0);
  const multi = items.length > 1;
  const current = items[idx];

  const prev = () => setIdx((i) => (i === 0 ? items.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === items.length - 1 ? 0 : i + 1));

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--bg-sunken,#0a0a0a)]">
      {current.type === "video" || isReel ? (
        <div className="relative h-full w-full">
          {current.url ? (
            <img
              src={current.url}
              alt={current.alt || "Instagram media"}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <ThumbnailPlaceholder sourceType="instagram" height={400} />
          )}
          <ReelOverlay />
        </div>
      ) : current.url ? (
        <img
          src={current.url}
          alt={current.alt || "Instagram media"}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <ThumbnailPlaceholder sourceType="instagram" height={400} />
      )}

      {/* Arrows */}
      {multi && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white backdrop-blur-sm transition-all duration-150 hover:scale-105 hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white backdrop-blur-sm transition-all duration-150 hover:scale-105 hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {multi && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-sm">
          {items.map((_, i) => (
            <div
              key={i}
              role="button"
              aria-label={`Go to image ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-200 cursor-pointer",
                i === idx
                  ? "h-[7px] w-[7px] bg-white"
                  : "h-1.5 w-1.5 bg-white/40",
              )}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reel play overlay                                                 */
/* ------------------------------------------------------------------ */

function ReelOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-black/50 backdrop-blur-sm">
        <Play size={24} color="#fff" fill="#fff" className="ml-0.5" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single image display                                               */
/* ------------------------------------------------------------------ */

interface SingleImageProps {
  url: string | null | undefined;
  alt?: string;
  isReel: boolean;
}

function SingleImage({ url, alt, isReel }: SingleImageProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--bg-sunken,#0a0a0a)]">
      {url && !imgError ? (
        <img
          src={url}
          alt={alt || "Instagram post"}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <ThumbnailPlaceholder sourceType="instagram" height={400} />
      )}

      {isReel && <ReelOverlay />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Body sections (shared blocks composition)                          */
/* ------------------------------------------------------------------ */

interface BodySectionsProps {
  bookmark: Bookmark;
  spaceName?: string;
  spaceColor?: string;
}

function BodySections({ bookmark, spaceName, spaceColor }: BodySectionsProps) {
  const hasTopics = bookmark.enriched_data?.topics && bookmark.enriched_data.topics.length > 0;
  const hasEntities = bookmark.enriched_data?.entities && bookmark.enriched_data.entities.length > 0;

  return (
    <>
      <DetailSummary bookmark={bookmark} />

      {(hasTopics || hasEntities) && (
        <div className="mb-6 flex flex-col gap-4">
          {hasTopics && <DetailTopics topics={bookmark.enriched_data!.topics!} />}
          {hasEntities && <DetailEntities entities={bookmark.enriched_data!.entities!} />}
        </div>
      )}

      {/* Divider */}
      <div className="mb-5 h-px bg-[var(--border-subtle)]" />

      <DetailTags tags={bookmark.tags ?? []} />
      {spaceName && (
        <DetailSpace spaceName={spaceName} spaceColor={spaceColor} />
      )}
      <DetailNotes initialNotes={bookmark.notes ?? ""} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main view                                                          */
/* ------------------------------------------------------------------ */

export default function InstagramDetailView({
  bookmark,
  spaceName,
  spaceColor,
}: DetailViewProps) {
  const m = meta(bookmark);
  const instagramType = str(m, "instagramType");
  const mediaType = str(m, "mediaType");
  const username = str(m, "username");
  const shortcode = str(m, "shortcode");
  const carouselMediaCount = num(m, "carouselMediaCount");
  const likes = num(m, "likes");
  const comments = num(m, "comments");

  const isReel = instagramType === "reel" || mediaType === "video";

  /* Resolve images: prefer enriched_data.media, fall back to thumbnail_url */
  const mediaItems: MediaItem[] =
    bookmark.enriched_data?.media && bookmark.enriched_data.media.length > 0
      ? bookmark.enriched_data.media
      : bookmark.thumbnail_url
        ? [{ url: bookmark.thumbnail_url, type: "image" as const }]
        : [];

  const hasCarousel = mediaItems.length > 1;
  const hasImage = mediaItems.length > 0;

  /* Deduplicate description when title already contains it */
  const showDescription = (() => {
    if (!bookmark.description) return false;
    const desc = bookmark.description.trim();
    const title = (bookmark.title ?? "").trim();
    if (!title) return true;
    /* Hide if description starts with the title or title starts with the description */
    if (desc.startsWith(title.slice(0, 80))) return false;
    if (title.startsWith(desc.slice(0, 80))) return false;
    return true;
  })();

  /* Type label */
  const typeLabel = isReel ? "Reel" : "Post";
  const TypeIcon = isReel ? Film : Image;

  return (
    <>
      {/* Two-column layout: stacked on small screens, side-by-side on md+ */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* ---- Left column: image / carousel ---- */}
        <div className="relative flex w-full shrink-0 items-center bg-[var(--bg-sunken,#0a0a0a)] max-h-[40vh] md:max-h-none md:w-[55%]">
          {hasCarousel ? (
            <Carousel items={mediaItems} isReel={isReel} />
          ) : hasImage ? (
            <SingleImage
              url={mediaItems[0].url}
              alt={mediaItems[0].alt}
              isReel={isReel}
            />
          ) : (
            <ThumbnailPlaceholder sourceType="instagram" height={400} />
          )}
        </div>

        {/* ---- Right column: metadata & content ---- */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="px-7 pb-5 pt-6">
            {/* Type badge + shortcode */}
            <div className="mb-2 flex items-center gap-2">
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-[3px] font-ui text-[11px] font-semibold uppercase tracking-[0.04em]",
                  isReel
                    ? "bg-[#E1306C]/12 text-[#E1306C]"
                    : "bg-[#833AB4]/12 text-[#833AB4]",
                )}
              >
                <TypeIcon size={11} />
                {typeLabel}
              </div>
              {shortcode && (
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {shortcode}
                </span>
              )}
              {carouselMediaCount && carouselMediaCount > 1 && (
                <span className="flex items-center gap-1 font-ui text-[11px] text-[var(--text-muted)]">
                  <Camera size={11} />
                  {carouselMediaCount} photos
                </span>
              )}
            </div>

            {/* Username */}
            {username && (
              <p className="mb-1.5 font-ui text-[13px] font-medium">
                <span
                  className="bg-clip-text font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  @{username}
                </span>
              </p>
            )}

            {/* Title / caption */}
            {bookmark.title && (
              <h2 className="line-clamp-3 font-display text-[22px] font-medium leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)]">
                {bookmark.title}
              </h2>
            )}

            {/* Engagement stats */}
            {(likes || comments) && (
              <div className="mt-2.5 flex items-center gap-3">
                {likes != null && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-surface)] px-3 py-1.5 font-ui text-[12px] text-[var(--text-secondary)]">
                    <Heart size={12} />
                    {likes.toLocaleString()}
                  </span>
                )}
                {comments != null && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-surface)] px-3 py-1.5 font-ui text-[12px] text-[var(--text-secondary)]">
                    <MessageCircle size={12} />
                    {comments.toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Description — hidden when it largely duplicates the title */}
            {showDescription && (
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words font-ui text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {bookmark.description}
              </p>
            )}

            {/* Saved-at context */}
            <div className="mb-5 mt-3 flex items-center gap-2 font-ui text-[12px] text-[var(--text-muted)]">
              <Globe size={11} />
              {bookmark.domain && <span>{bookmark.domain}</span>}
              {bookmark.domain && bookmark.savedAt && (
                <span className="text-[var(--border-strong)]">&middot;</span>
              )}
              {bookmark.savedAt && <span>{bookmark.savedAt}</span>}
            </div>

            {/* Shared body sections */}
            <BodySections
              bookmark={bookmark}
              spaceName={spaceName}
              spaceColor={spaceColor}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      {bookmark.url && <DetailFooter url={bookmark.url} label="Open on Instagram" />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Register                                                           */
/* ------------------------------------------------------------------ */

registerDetailView("link:instagram", InstagramDetailView);
