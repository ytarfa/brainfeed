/**
 * App-layer types derived from Supabase DB row types.
 *
 * - Types that map directly to a DB table extend `Tables<"table_name">`,
 *   inheriting all persisted fields and adding UI-only / computed fields.
 * - Types that have no DB counterpart are defined independently.
 *
 * Do NOT edit database.types.ts — it is auto-generated.
 * Run `pnpm sync:types` to regenerate it from Supabase.
 */

import type { Tables } from "./database.types";
import type { EnrichedData } from "./enriched-data.types";

// ---------------------------------------------------------------------------
// Primitive / shared types
// ---------------------------------------------------------------------------

export type ContentType = "link";

export type SourceType = "github" | "youtube" | "article" | "instagram" | "generic";

export type DigestStatus = "active" | "saved" | "dismissed";

export type EnrichmentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "unsupported";

// Re-export EnrichedData so existing `import { EnrichedData } from "./app.types"` keeps working.
export type { EnrichedData } from "./enriched-data.types";

/** A resolved tag object used in the UI (DB stores raw string arrays). */
export interface Tag {
  id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Collaborator — derived from space_members row joined with profiles
// ---------------------------------------------------------------------------

export interface Collaborator {
  /** profiles.id */
  id: string;
  /** profiles.display_name */
  name: string;
  /** Not stored in profiles — populated from auth metadata or omitted */
  email: string;
  /** profiles.avatar_url abbreviated to a single char for the UI fallback */
  avatar: string;
  /** space_members.role */
  role: "owner" | "editor" | "viewer";
}

// ---------------------------------------------------------------------------
// CategorizationRule — derived from categorization_rules row
// ---------------------------------------------------------------------------

export interface CategorizationRule extends Tables<"categorization_rules"> {
  /** UI alias for rule_type (e.g. "domain", "tag") */
  field: string;
  /** UI alias for rule_value comparison operator (e.g. "contains", "is") */
  operator: string;
  /** UI alias for rule_value */
  value: string;
}

// ---------------------------------------------------------------------------
// Space — derived from spaces row with UI-layer additions
// ---------------------------------------------------------------------------

export interface Space extends Tables<"spaces"> {
  /** UI-only presentation colour (not stored in DB) */
  color: string;
  /** Computed aggregate: number of bookmarks in this space */
  itemCount: number;
  /** Joined from space_members + profiles */
  collaborators: Collaborator[];
  /** Derived from is_public */
  isShared: boolean;
  /** Joined from categorization_rules */
  rules: CategorizationRule[];
  /** Alias for ai_auto_categorize */
  aiEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Bookmark — derived from bookmarks row with UI-layer additions
// ---------------------------------------------------------------------------

export interface Bookmark extends Omit<Tables<"bookmarks">, "content_type" | "source_type" | "tags" | "digest_status" | "enrichment_status" | "enriched_data"> {
  /** bookmarks.content_type narrowed to known values */
  content_type: ContentType;
  /** bookmarks.source_type narrowed to known values */
  source_type: SourceType | null;
  /** bookmarks.tags promoted from string[] to Tag[] for the UI */
  tags: Tag[];
  /** bookmarks.digest_status narrowed to known values (null for regular bookmarks) */
  digest_status: DigestStatus | null;
  /** bookmarks.enrichment_status narrowed to the EnrichmentStatus union */
  enrichment_status: EnrichmentStatus;
  /** The space this bookmark belongs to (from bookmark_spaces join) */
  spaceId: string;
  /** Computed from url (e.g. "github.com") */
  domain?: string;
  /** UI alias for thumbnail_url */
  favicon?: string;
  /** UI alias for description */
  summary?: string;
  /** Human-readable relative time string for the UI (e.g. "3 min ago") */
  savedAt: string;
  /** Structured enrichment pipeline output (null until enrichment completes) */
  enriched_data: EnrichedData | null;
}

// ---------------------------------------------------------------------------
// ActivityEntry — derived from activity_log row with UI-layer additions
// ---------------------------------------------------------------------------

export interface ActivityEntry extends Tables<"activity_log"> {
  /** Denormalised title of the referenced bookmark for display */
  bookmarkTitle: string;
  /** Human-readable relative time string for the UI (e.g. "3 min ago") */
  timestamp: string;
  /** Whether an AI suggestion was accepted by the user */
  accepted?: boolean;
}

// ---------------------------------------------------------------------------
// Profile — re-exported as a named alias for convenience
// ---------------------------------------------------------------------------

export type Profile = Tables<"profiles">;

// ---------------------------------------------------------------------------
// DigestCandidate — a Bookmark with digest_status = 'active'
// ---------------------------------------------------------------------------

export type DigestCandidateStatus = DigestStatus;

/** A digest candidate is a bookmark in the "active" digest state. */
export type DigestCandidate = Bookmark & { digest_status: "active" };
