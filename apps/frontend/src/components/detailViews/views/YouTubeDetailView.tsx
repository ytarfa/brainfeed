import React, { useState } from "react";
import {
  Play,
  Clock,
  Eye,
  Users,
  ListVideo,
  Film,
  ThumbsUp,
  Calendar,
} from "lucide-react";

import type { DetailViewProps } from "../types";
import { registerDetailView } from "../registry";

import ThumbnailPlaceholder from "../../ThumbnailPlaceholder";
import DetailSummary from "../shared/DetailSummary";
import DetailTopics from "../shared/DetailTopics";
import DetailEntities from "../shared/DetailEntities";
import DetailTags from "../shared/DetailTags";
import DetailSpace from "../shared/DetailSpace";
import DetailNotes from "../shared/DetailNotes";
import DetailFooter from "../shared/DetailFooter";

/* ------------------------------------------------------------------ */
/*  Metadata helpers                                                   */
/* ------------------------------------------------------------------ */

type Meta = Record<string, string | number>;

function meta(bookmark: DetailViewProps["bookmark"]): Meta {
  return (bookmark.enriched_data?.metadata as Meta) ?? {};
}

function str(val: unknown): string {
  return val != null ? String(val) : "";
}

function num(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function fmtCount(val: unknown): string {
  const n = num(val);
  if (n == null) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

/** Inline stat — icon + label + value. */
function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-3 py-2"
      title={label}
    >
      <span className="text-[var(--text-muted)]">{icon}</span>
      <div className="flex flex-col">
        <span className="font-ui text-[10px] uppercase tracking-[0.05em] text-[var(--text-muted)]">
          {label}
        </span>
        <span className="font-ui text-[13px] font-semibold text-[var(--text-primary)]">
          {value}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Video thumbnail with play overlay                                  */
/* ------------------------------------------------------------------ */

function VideoThumbnail({
  bookmark,
  duration,
}: {
  bookmark: DetailViewProps["bookmark"];
  duration: string;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasThumbnail = Boolean(bookmark.thumbnail_url) && !imgError;

  return (
    <a
      href={bookmark.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full overflow-hidden"
      aria-label="Watch on YouTube"
    >
      {hasThumbnail ? (
        <div className="relative" style={{ aspectRatio: "16 / 9" }}>
          <img
            src={bookmark.thumbnail_url!}
            alt={bookmark.title || "YouTube video thumbnail"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 300ms" }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 bg-[var(--bg-surface)]" />
          )}
        </div>
      ) : (
        <ThumbnailPlaceholder
          sourceType="youtube"
          height={220}
          showNoise
          fadeTarget="transparent"
          iconSize={48}
        />
      )}

      {/* Play button overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff0000] shadow-lg shadow-black/30 transition-transform duration-200 group-hover:scale-110">
          <Play size={24} fill="white" stroke="white" strokeWidth={0} className="ml-0.5" />
        </div>
      </div>

      {/* Duration badge */}
      {duration && (
        <div className="absolute bottom-2.5 right-2.5 rounded-md bg-black/80 px-2 py-0.5 font-mono text-[11.5px] font-medium text-white backdrop-blur-sm">
          {duration}
        </div>
      )}

      {/* Bottom fade for transition into content */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
        style={{
          background: "linear-gradient(to top, var(--bg-raised) 0%, transparent 100%)",
        }}
      />
    </a>
  );
}

/* ================================================================== */
/*  Sub-type layouts                                                   */
/* ================================================================== */

/** YouTube Video header */
function VideoHeader({ bookmark }: DetailViewProps) {
  const m = meta(bookmark);
  const channelTitle = str(m.channelTitle);
  const viewCount = fmtCount(m.viewCount);
  const likeCount = fmtCount(m.likeCount);
  const duration = str(m.duration);
  const publishedAt = str(m.publishedAt);

  return (
    <div className="mb-5">
      {/* Thumbnail + play overlay */}
      <VideoThumbnail bookmark={bookmark} duration={duration} />

      {/* Title */}
      <div className="mt-4 px-7">
        <h2 className="font-display text-[22px] font-medium leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)]">
          {bookmark.title || "Untitled Video"}
        </h2>

        {/* Channel name */}
        {channelTitle && (
          <p className="mt-1 font-ui text-[13px] font-medium text-[var(--text-secondary)]">
            {channelTitle}
          </p>
        )}

        {/* Stats row */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Stat icon={<Eye size={14} />} label="Views" value={viewCount} />
          <Stat icon={<ThumbsUp size={14} />} label="Likes" value={likeCount} />
          <Stat icon={<Clock size={14} />} label="Duration" value={duration} />
          {publishedAt && (
            <Stat
              icon={<Calendar size={14} />}
              label="Published"
              value={new Date(publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** YouTube Channel header */
function ChannelHeader({ bookmark }: DetailViewProps) {
  const m = meta(bookmark);
  const channelTitle = str(m.channelTitle);
  const subscriberCount = fmtCount(m.subscriberCount);
  const videoCount = fmtCount(m.videoCount);
  const viewCount = fmtCount(m.viewCount);
  const customUrl = str(m.customUrl);
  const country = str(m.country);

  return (
    <div className="mb-5">
      {/* Channel identity */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 font-ui text-[12px] text-[var(--text-muted)]">
          <Users size={13} strokeWidth={2} className="text-[var(--text-muted)]" />
          <span>Channel</span>
          {customUrl && (
            <>
              <span className="text-[var(--border-strong)]">&middot;</span>
              <span>{customUrl}</span>
            </>
          )}
        </div>
        <h2 className="mt-1 font-display text-[22px] font-medium leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)]">
          {channelTitle || bookmark.title || "Untitled Channel"}
        </h2>
        {country && (
          <span className="mt-1 inline-block font-ui text-[12px] text-[var(--text-muted)]">
            {country}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-2">
        <Stat icon={<Users size={14} />} label="Subscribers" value={subscriberCount} />
        <Stat icon={<Film size={14} />} label="Videos" value={videoCount} />
        <Stat icon={<Eye size={14} />} label="Total views" value={viewCount} />
      </div>
    </div>
  );
}

/** YouTube Playlist header */
function PlaylistHeader({ bookmark }: DetailViewProps) {
  const m = meta(bookmark);
  const title = str(m.title) || bookmark.title || "Untitled Playlist";
  const itemCount = num(m.itemCount);
  const channelTitle = str(m.channelTitle);
  const publishedAt = str(m.publishedAt);

  return (
    <div className="mb-5">
      {/* Playlist identity */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 font-ui text-[12px] text-[var(--text-muted)]">
          <ListVideo size={13} strokeWidth={2} className="text-[var(--text-muted)]" />
          <span>Playlist</span>
        </div>
        <h2 className="mt-1 font-display text-[22px] font-medium leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)]">
          {title}
        </h2>
        {channelTitle && (
          <p className="mt-1 font-ui text-[13px] font-medium text-[var(--text-secondary)]">
            {channelTitle}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        {itemCount != null && (
          <Stat icon={<ListVideo size={14} />} label="Videos" value={itemCount.toLocaleString()} />
        )}
        {publishedAt && (
          <Stat
            icon={<Calendar size={14} />}
            label="Created"
            value={new Date(publishedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Shared body sections helper                                        */
/* ================================================================== */

function BodySections({
  bookmark,
  spaceName,
  spaceColor,
}: DetailViewProps) {
  const hasTopics = bookmark.enriched_data?.topics && bookmark.enriched_data.topics.length > 0;
  const hasEntities = bookmark.enriched_data?.entities && bookmark.enriched_data.entities.length > 0;

  return (
    <>
      {/* AI Summary */}
      <DetailSummary bookmark={bookmark} />

      {/* Topics + Entities */}
      {(hasTopics || hasEntities) && (
        <div className="mb-6 flex flex-col gap-4">
          {hasTopics && <DetailTopics topics={bookmark.enriched_data!.topics!} />}
          {hasEntities && <DetailEntities entities={bookmark.enriched_data!.entities!} />}
        </div>
      )}

      {/* Divider */}
      <div className="mb-5 h-px bg-[var(--border-subtle)]" />

      {/* Tags */}
      <DetailTags tags={bookmark.tags} />

      {/* Space */}
      {spaceName && <DetailSpace spaceName={spaceName} spaceColor={spaceColor} />}

      {/* Notes */}
      <DetailNotes initialNotes={bookmark.notes || ""} />
    </>
  );
}

/* ================================================================== */
/*  Main view                                                          */
/* ================================================================== */

export default function YouTubeDetailView({ bookmark, spaceName, spaceColor }: DetailViewProps) {
  const m = meta(bookmark);

  // Detect sub-type from metadata keys
  const isVideo = Boolean(m.videoId);
  const isChannel = !isVideo && Boolean(m.channelId);
  // Playlist fallback if neither video nor channel

  if (isVideo) {
    return (
      <>
        {/* Video has full-bleed thumbnail — no outer padding */}
        <div className="flex-1 overflow-y-auto pb-5">
          <VideoHeader bookmark={bookmark} spaceName={spaceName} spaceColor={spaceColor} />

          {/* Rest of content gets side padding */}
          <div className="px-7">
            {/* Saved at context */}
            <div className="mb-5 flex items-center gap-2 font-ui text-[12px] text-[var(--text-muted)]">
              {bookmark.domain && <span>{bookmark.domain}</span>}
              {bookmark.domain && bookmark.savedAt && (
                <span className="text-[var(--border-strong)]">&middot;</span>
              )}
              {bookmark.savedAt && <span>{bookmark.savedAt}</span>}
            </div>

            <BodySections bookmark={bookmark} spaceName={spaceName} spaceColor={spaceColor} />
          </div>
        </div>

        {/* Footer */}
        {bookmark.url && <DetailFooter url={bookmark.url} label="Watch on YouTube" />}
      </>
    );
  }

  // Channel / Playlist — no hero image
  return (
    <>
      <div className="flex-1 overflow-y-auto px-7 pb-5 pt-6">
        {isChannel ? (
          <ChannelHeader bookmark={bookmark} spaceName={spaceName} spaceColor={spaceColor} />
        ) : (
          <PlaylistHeader bookmark={bookmark} spaceName={spaceName} spaceColor={spaceColor} />
        )}

        {/* Saved at context */}
        <div className="mb-5 flex items-center gap-2 font-ui text-[12px] text-[var(--text-muted)]">
          {bookmark.domain && <span>{bookmark.domain}</span>}
          {bookmark.domain && bookmark.savedAt && (
            <span className="text-[var(--border-strong)]">&middot;</span>
          )}
          {bookmark.savedAt && <span>{bookmark.savedAt}</span>}
        </div>

        <BodySections bookmark={bookmark} spaceName={spaceName} spaceColor={spaceColor} />
      </div>

      {/* Footer */}
      {bookmark.url && <DetailFooter url={bookmark.url} label="Open on YouTube" />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Self-register                                                      */
/* ------------------------------------------------------------------ */

registerDetailView("link:youtube", YouTubeDetailView);
