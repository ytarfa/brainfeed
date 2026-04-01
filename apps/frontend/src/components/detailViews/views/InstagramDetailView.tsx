import React, { useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Globe,
  Image,
  Play,
} from "lucide-react";

import type { Bookmark, MediaItem } from "@brain-feed/types";

import ThumbnailPlaceholder from "../../ThumbnailPlaceholder";
import DetailSummary from "../shared/DetailSummary";
import DetailTopics from "../shared/DetailTopics";
import DetailEntities from "../shared/DetailEntities";
import DetailTags from "../shared/DetailTags";
import DetailSpace from "../shared/DetailSpace";
import DetailNotes from "../shared/DetailNotes";
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

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: "4 / 5",
    maxHeight: "70vh",
    background: "var(--bg-sunken, #0a0a0a)",
    overflow: "hidden",
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  const arrowStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    top: "50%",
    [side]: 12,
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    cursor: "pointer",
    opacity: 0.85,
    transition: "opacity 180ms, transform 180ms",
  });

  const dotsContainerStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 14,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 12,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(6px)",
  };

  const dotStyle = (active: boolean): React.CSSProperties => ({
    width: active ? 7 : 6,
    height: active ? 7 : 6,
    borderRadius: "50%",
    background: active ? "#fff" : "rgba(255,255,255,0.4)",
    transition: "all 200ms",
    cursor: "pointer",
  });

  return (
    <div style={containerStyle}>
      {current.type === "video" || isReel ? (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {current.url ? (
            <img
              src={current.url}
              alt={current.alt || "Instagram media"}
              style={imgStyle}
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
          style={imgStyle}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <ThumbnailPlaceholder sourceType="instagram" height={400} />
      )}

      {/* Gradient fade at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          background:
            "linear-gradient(to top, var(--bg-primary, #111) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Arrows */}
      {multi && (
        <>
          <button
            onClick={prev}
            style={arrowStyle("left")}
            aria-label="Previous image"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-50%) scale(1.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.85";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-50%)";
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            style={arrowStyle("right")}
            aria-label="Next image"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-50%) scale(1.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.85";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-50%)";
            }}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {multi && (
        <div style={dotsContainerStyle}>
          {items.map((_, i) => (
            <div
              key={i}
              role="button"
              aria-label={`Go to image ${i + 1}`}
              style={dotStyle(i === idx)}
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
  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(8px)",
    border: "2px solid rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  };

  return (
    <div style={overlayStyle}>
      <Play size={26} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
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

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: "4 / 5",
    maxHeight: "70vh",
    background: "var(--bg-sunken, #0a0a0a)",
    overflow: "hidden",
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  return (
    <div style={containerStyle}>
      {url && !imgError ? (
        <img
          src={url}
          alt={alt || "Instagram post"}
          style={imgStyle}
          onError={() => setImgError(true)}
        />
      ) : (
        <ThumbnailPlaceholder sourceType="instagram" height={400} />
      )}

      {isReel && <ReelOverlay />}

      {/* Gradient fade at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          background:
            "linear-gradient(to top, var(--bg-primary, #111) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
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
  const ed = bookmark.enriched_data;
  return (
    <>
      <DetailSummary bookmark={bookmark} />
      <DetailTopics topics={ed?.topics ?? []} />
      <DetailEntities entities={ed?.entities ?? []} />

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "var(--border-primary, rgba(255,255,255,0.08))",
          margin: "8px 0 4px",
        }}
      />

      <DetailTags tags={bookmark.tags ?? []} />
      {spaceName && (
        <DetailSpace spaceName={spaceName} spaceColor={spaceColor} />
      )}
      <DetailNotes initialNotes={bookmark.notes ?? ""} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Instagram footer                                                   */
/* ------------------------------------------------------------------ */

interface InstaFooterProps {
  url: string;
}

function InstaFooter({ url }: InstaFooterProps) {
  const footerStyle: React.CSSProperties = {
    position: "sticky",
    bottom: 0,
    padding: "14px 28px",
    background: "var(--bg-primary, #111)",
    borderTop: "1px solid var(--border-primary, rgba(255,255,255,0.08))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const linkStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "var(--text-secondary, #aaa)",
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
    letterSpacing: 0.3,
    transition: "color 180ms",
    background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <div style={footerStyle}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "0.8";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "1";
        }}
      >
        <ExternalLink size={14} />
        Open on Instagram
      </a>
    </div>
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

  /* Type label */
  const typeLabel = isReel ? "Reel" : "Post";
  const TypeIcon = isReel ? Film : Image;

  const contentPadding: React.CSSProperties = {
    padding: "0 28px",
  };

  return (
    <div style={{ paddingBottom: 0 }}>
      {/* ---- Image / Carousel area ---- */}
      {hasCarousel ? (
        <Carousel items={mediaItems} isReel={isReel} />
      ) : hasImage ? (
        <SingleImage
          url={mediaItems[0].url}
          alt={mediaItems[0].alt}
          isReel={isReel}
        />
      ) : (
        <div style={{ position: "relative" }}>
          <ThumbnailPlaceholder sourceType="instagram" height={280} />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              background:
                "linear-gradient(to top, var(--bg-primary, #111) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* ---- Content area ---- */}
      <div style={contentPadding}>
        {/* Type badge + shortcode */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 16,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              background: isReel
                ? "rgba(231,48,96,0.12)"
                : "rgba(131,58,180,0.12)",
              color: isReel ? "#E1306C" : "#833AB4",
            }}
          >
            <TypeIcon size={11} />
            {typeLabel}
          </div>
          {shortcode && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted, #666)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {shortcode}
            </span>
          )}
          {carouselMediaCount && carouselMediaCount > 1 && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted, #666)",
              }}
            >
              <Camera
                size={11}
                style={{ marginRight: 3, verticalAlign: "middle" }}
              />
              {carouselMediaCount} photos
            </span>
          )}
        </div>

        {/* Username */}
        {username && (
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary, #fff)",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                background:
                  "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              @{username}
            </span>
          </div>
        )}

        {/* Title / caption */}
        {bookmark.title && (
          <h2
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "var(--text-primary, #fff)",
              lineHeight: 1.35,
              margin: "0 0 6px",
            }}
          >
            {bookmark.title}
          </h2>
        )}

        {/* Caption / description as distinct styled text */}
        {bookmark.description && (
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.55,
              color: "var(--text-secondary, #aaa)",
              margin: "0 0 12px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {bookmark.description}
          </p>
        )}

        {/* Saved-at context */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--text-muted, #666)",
            marginBottom: 16,
          }}
        >
          <Globe size={11} />
          {bookmark.domain && <span>{bookmark.domain}</span>}
          {bookmark.domain && bookmark.savedAt && (
            <span style={{ opacity: 0.4 }}>&middot;</span>
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

      {/* Footer */}
      {bookmark.url && <InstaFooter url={bookmark.url} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Register                                                           */
/* ------------------------------------------------------------------ */

registerDetailView("link:instagram", InstagramDetailView);
