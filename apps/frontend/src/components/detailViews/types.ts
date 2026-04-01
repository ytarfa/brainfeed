import type { Bookmark } from "@brain-feed/types";

/**
 * Props contract for all detail view components.
 *
 * Views receive the bookmark data + optional space context.
 * They do NOT receive modal-level props (onClose, animation state).
 */
export interface DetailViewProps {
  bookmark: Bookmark;
  spaceName?: string;
  spaceColor?: string;
}

/**
 * Composite keys used to resolve detail views from the registry.
 *
 * For `content_type: "link"`, the key is `link:<source_type>` (e.g. `link:github`).
 * For other content types, the key is the content_type directly (e.g. `note`, `pdf`).
 * If source_type is null for links, falls back to `link:generic`.
 */
export type DetailViewKey =
  | "link:github"
  | "link:youtube"
  | "link:article"
  | "link:instagram"
  | "link:generic"
  | "note"
  | "image"
  | "pdf"
  | (string & {}); // allow future keys without breaking the union
