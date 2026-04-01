import React from "react";
import {
  Star,
  GitFork,
  Circle,
  Code2,
  Eye,
  Scale,
  MessageSquare,
  GitPullRequest,
  GitMerge,
  CircleDot,
  CircleCheck,
  CircleX,
  FileCode,
  Plus,
  Minus,
  Files,
  Tag as TagIcon,
} from "lucide-react";

import type { DetailViewProps } from "../types";
import { registerDetailView } from "../registry";

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

function fmt(val: unknown): string {
  const n = num(val);
  return n != null ? n.toLocaleString() : str(val);
}

function labels(val: unknown): string[] {
  if (!val) return [];
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

/** Inline stat pill — icon + value. */
function Stat({
  icon,
  value,
  title,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  title?: string;
  accent?: boolean;
}) {
  return (
    <div
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[5px] font-ui text-[12px] font-medium ${
        accent
          ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]"
          : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
      }`}
    >
      {icon}
      {value}
    </div>
  );
}

/** Colored label pill. */
function LabelPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-[2px] font-ui text-[11px] font-medium text-[var(--text-secondary)]">
      <TagIcon size={9} strokeWidth={2.5} className="opacity-50" />
      {text}
    </span>
  );
}

/** Issue/PR state indicator with colored dot + text. */
function StateIndicator({
  state,
  merged,
  type,
}: {
  state: string;
  merged?: boolean;
  type: "issue" | "pr";
}) {
  if (type === "pr" && merged) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8250df1a] px-2.5 py-[3px] font-ui text-[11.5px] font-semibold text-[#8250df]">
        <GitMerge size={12} strokeWidth={2.5} />
        Merged
      </span>
    );
  }

  const isOpen = state.toLowerCase() === "open";

  if (type === "pr") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] font-ui text-[11.5px] font-semibold ${
          isOpen
            ? "bg-[#238636]/15 text-[#3fb950]"
            : "bg-[#da3633]/15 text-[#f85149]"
        }`}
      >
        {isOpen ? (
          <GitPullRequest size={12} strokeWidth={2.5} />
        ) : (
          <CircleX size={12} strokeWidth={2.5} />
        )}
        {isOpen ? "Open" : "Closed"}
      </span>
    );
  }

  // Issue
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] font-ui text-[11.5px] font-semibold ${
        isOpen
          ? "bg-[#238636]/15 text-[#3fb950]"
          : "bg-[#8250df1a] text-[#8250df]"
      }`}
    >
      {isOpen ? (
        <CircleDot size={12} strokeWidth={2.5} />
      ) : (
        <CircleCheck size={12} strokeWidth={2.5} />
      )}
      {isOpen ? "Open" : "Closed"}
    </span>
  );
}

/* ================================================================== */
/*  Sub-type layouts                                                   */
/* ================================================================== */

/** GitHub Repository header */
function RepoHeader({ bookmark }: DetailViewProps) {
  const m = meta(bookmark);
  const owner = str(m.owner);
  const repo = str(m.repo);
  const language = str(m.language);
  const license = str(m.license);
  const stars = num(m.stars);
  const forks = num(m.forks);
  const openIssues = num(m.openIssues);
  const topicsCsv = str(m.topics);
  const homepage = str(m.homepage);

  return (
    <div className="mb-5">
      {/* Owner / Repo identity */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 font-ui text-[12px] text-[var(--text-muted)]">
          <Code2 size={13} strokeWidth={2} className="text-[var(--text-muted)]" />
          {owner && (
            <>
              <span>{owner}</span>
              <span className="text-[var(--border-strong)]">/</span>
            </>
          )}
        </div>
        <h2 className="mt-1 font-display text-[22px] font-medium leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)]">
          {bookmark.title || repo || "Untitled Repository"}
        </h2>
        {bookmark.description && (
          <p className="mt-1.5 font-ui text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {bookmark.description}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-2">
        {stars != null && (
          <Stat icon={<Star size={12} strokeWidth={2} />} value={stars.toLocaleString()} title="Stars" accent />
        )}
        {forks != null && (
          <Stat icon={<GitFork size={12} strokeWidth={2} />} value={forks.toLocaleString()} title="Forks" />
        )}
        {openIssues != null && (
          <Stat icon={<Eye size={12} strokeWidth={2} />} value={openIssues.toLocaleString()} title="Open issues" />
        )}
        {language && (
          <Stat
            icon={<Circle size={8} strokeWidth={0} fill="var(--accent)" />}
            value={language}
            title="Primary language"
          />
        )}
        {license && (
          <Stat icon={<Scale size={12} strokeWidth={2} />} value={license} title="License" />
        )}
      </div>

      {/* Topics */}
      {topicsCsv && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topicsCsv.split(",").map((t) => t.trim()).filter(Boolean).map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-[var(--accent-subtle)] px-2.5 py-[2px] font-ui text-[10.5px] font-medium text-[var(--accent-text)]"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Homepage link */}
      {homepage && (
        <a
          href={homepage.startsWith("http") ? homepage : `https://${homepage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-ui text-[12px] text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-2 transition-colors duration-150 hover:text-[var(--accent-text)]"
        >
          {homepage}
        </a>
      )}
    </div>
  );
}

/** GitHub Issue header */
function IssueHeader({ bookmark }: DetailViewProps) {
  const m = meta(bookmark);
  const owner = str(m.owner);
  const repo = str(m.repo);
  const issueNumber = num(m.issueNumber);
  const state = str(m.state);
  const author = str(m.author);
  const commentsCount = num(m.commentsCount);
  const issueLabels = labels(m.labels);

  return (
    <div className="mb-5">
      {/* Repo context + issue number */}
      <div className="mb-2 flex items-center gap-2 font-ui text-[12px] text-[var(--text-muted)]">
        <CircleDot size={13} strokeWidth={2} />
        {owner && repo && <span>{owner}/{repo}</span>}
        {issueNumber != null && (
          <span className="text-[var(--text-secondary)] font-semibold">#{issueNumber}</span>
        )}
      </div>

      {/* Title */}
      <h2 className="font-display text-[22px] font-medium leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)]">
        {bookmark.title || "Untitled Issue"}
      </h2>

      {/* State + meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {state && <StateIndicator state={state} type="issue" />}
        {author && (
          <span className="font-ui text-[12px] text-[var(--text-muted)]">
            by <span className="font-medium text-[var(--text-secondary)]">{author}</span>
          </span>
        )}
        {commentsCount != null && (
          <Stat
            icon={<MessageSquare size={11} strokeWidth={2} />}
            value={commentsCount.toLocaleString()}
            title="Comments"
          />
        )}
      </div>

      {/* Labels */}
      {issueLabels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {issueLabels.map((label) => (
            <LabelPill key={label} text={label} />
          ))}
        </div>
      )}
    </div>
  );
}

/** GitHub Pull Request header */
function PRHeader({ bookmark }: DetailViewProps) {
  const m = meta(bookmark);
  const owner = str(m.owner);
  const repo = str(m.repo);
  const prNumber = num(m.prNumber);
  const state = str(m.state);
  const merged = str(m.merged) === "true";
  const author = str(m.author);
  const additions = num(m.additions);
  const deletions = num(m.deletions);
  const changedFiles = num(m.changedFiles);
  const prLabels = labels(m.labels);

  return (
    <div className="mb-5">
      {/* Repo context + PR number */}
      <div className="mb-2 flex items-center gap-2 font-ui text-[12px] text-[var(--text-muted)]">
        <GitPullRequest size={13} strokeWidth={2} />
        {owner && repo && <span>{owner}/{repo}</span>}
        {prNumber != null && (
          <span className="text-[var(--text-secondary)] font-semibold">#{prNumber}</span>
        )}
      </div>

      {/* Title */}
      <h2 className="font-display text-[22px] font-medium leading-[1.28] tracking-[-0.01em] text-[var(--text-primary)]">
        {bookmark.title || "Untitled Pull Request"}
      </h2>

      {/* State + author */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {state && <StateIndicator state={state} merged={merged} type="pr" />}
        {author && (
          <span className="font-ui text-[12px] text-[var(--text-muted)]">
            by <span className="font-medium text-[var(--text-secondary)]">{author}</span>
          </span>
        )}
      </div>

      {/* Diff stats */}
      {(additions != null || deletions != null || changedFiles != null) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {additions != null && (
            <Stat
              icon={<Plus size={11} strokeWidth={2.5} />}
              value={additions.toLocaleString()}
              title="Additions"
            />
          )}
          {deletions != null && (
            <Stat
              icon={<Minus size={11} strokeWidth={2.5} />}
              value={deletions.toLocaleString()}
              title="Deletions"
            />
          )}
          {changedFiles != null && (
            <Stat
              icon={<Files size={11} strokeWidth={2} />}
              value={`${changedFiles.toLocaleString()} files`}
              title="Changed files"
            />
          )}
        </div>
      )}

      {/* Labels */}
      {prLabels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prLabels.map((label) => (
            <LabelPill key={label} text={label} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main view                                                          */
/* ================================================================== */

export default function GitHubDetailView({ bookmark, spaceName, spaceColor }: DetailViewProps) {
  const m = meta(bookmark);
  const githubType = str(m.githubType);
  const hasTopics = bookmark.enriched_data?.topics && bookmark.enriched_data.topics.length > 0;
  const hasEntities = bookmark.enriched_data?.entities && bookmark.enriched_data.entities.length > 0;

  return (
    <>
      {/* Scrollable body — no hero image for GitHub */}
      <div className="flex-1 overflow-y-auto px-7 pb-5 pt-6">
        {/* Sub-type header */}
        {githubType === "issue" ? (
          <IssueHeader bookmark={bookmark} spaceName={spaceName} spaceColor={spaceColor} />
        ) : githubType === "pr" ? (
          <PRHeader bookmark={bookmark} spaceName={spaceName} spaceColor={spaceColor} />
        ) : (
          <RepoHeader bookmark={bookmark} spaceName={spaceName} spaceColor={spaceColor} />
        )}

        {/* Saved at context */}
        <div className="mb-5 flex items-center gap-2 font-ui text-[12px] text-[var(--text-muted)]">
          {bookmark.domain && <span>{bookmark.domain}</span>}
          {bookmark.domain && bookmark.savedAt && (
            <span className="text-[var(--border-strong)]">&middot;</span>
          )}
          {bookmark.savedAt && <span>{bookmark.savedAt}</span>}
        </div>

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
      </div>

      {/* Footer */}
      {bookmark.url && <DetailFooter url={bookmark.url} label="Open on GitHub" />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Self-register                                                      */
/* ------------------------------------------------------------------ */

registerDetailView("link:github", GitHubDetailView);
