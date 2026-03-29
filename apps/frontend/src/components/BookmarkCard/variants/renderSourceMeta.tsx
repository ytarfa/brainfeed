import React from "react";
import type { Bookmark, SourceType } from "@brain-feed/types";

import GitHubMeta from "./GitHubMeta";
import YouTubeMeta from "./YouTubeMeta";
import PaperMeta from "./PaperMeta";
import RedditMeta from "./RedditMeta";
import TwitterMeta from "./TwitterMeta";
import SpotifyMeta from "./SpotifyMeta";

type VariantComponent = React.ComponentType<{ bookmark: Bookmark }>;

const variantMap: Partial<Record<SourceType, VariantComponent>> = {
  github: GitHubMeta,
  youtube: YouTubeMeta,
  paper: PaperMeta,
  reddit: RedditMeta,
  twitter: TwitterMeta,
  spotify: SpotifyMeta,
};

/**
 * Factory: renders a source-specific metadata line for a bookmark card.
 * Returns `null` for source types that don't need extra inline metadata
 * (news, rss, generic, note, image, pdf, file).
 */
export default function renderSourceMeta(bookmark: Bookmark): React.ReactNode {
  const sourceType = bookmark.source_type;
  if (!sourceType) return null;

  const Variant = variantMap[sourceType];
  if (!Variant) return null;

  return <Variant bookmark={bookmark} />;
}
