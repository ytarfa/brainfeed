import React from "react";
import type { Bookmark, SourceType } from "@brain-feed/types";

import GitHubMeta from "./GitHubMeta";
import YouTubeMeta from "./YouTubeMeta";

type VariantComponent = React.ComponentType<{ bookmark: Bookmark }>;

const variantMap: Partial<Record<SourceType, VariantComponent>> = {
  github: GitHubMeta,
  youtube: YouTubeMeta,
};

/**
 * Factory: renders a source-specific metadata line for a bookmark card.
 * Returns `null` for source types that don't need extra inline metadata (generic).
 */
export default function renderSourceMeta(bookmark: Bookmark): React.ReactNode {
  const sourceType = bookmark.source_type;
  if (!sourceType) return null;

  const Variant = variantMap[sourceType];
  if (!Variant) return null;

  return <Variant bookmark={bookmark} />;
}
