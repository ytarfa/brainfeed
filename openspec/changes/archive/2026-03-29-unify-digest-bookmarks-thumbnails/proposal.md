## Why

Digest candidates and bookmarks share most of their data (url, title, description, thumbnail_url, source_type) but live in separate tables. The upcoming enrichment worker needs to process both uniformly — resolving thumbnails, extracting metadata, populating enriched_data. Two tables means two processing paths, two sets of status tracking, and a wasteful copy-on-save flow. Unifying them into a single table gives the enrichment worker one target and simplifies the save flow from a 3-query INSERT+UPDATE dance to a single UPDATE.

Additionally, bookmarks with `content_type: "link"` currently have no thumbnail resolution. The `thumbnail_url` column exists but is never populated during bookmark creation. This change adds inline thumbnail resolution at creation time, so bookmarks (and digest candidates, now stored as bookmarks) have thumbnails immediately.

## What Changes

- **Unify digest candidates into the bookmarks table**: Add `digest_status`, `source_name`, `source_id`, `published_at`, and `expires_at` columns to bookmarks. Digest candidates become bookmark rows with `digest_status = 'active'`. Drop the `digest_candidates` table.
- **Simplify the save flow**: Promoting a digest candidate from a 3-query cross-table operation to a single `UPDATE bookmarks SET digest_status = 'saved'`.
- **Add inline thumbnail resolution**: When creating a bookmark with `content_type: "link"`, resolve `thumbnail_url` synchronously before INSERT. Platform-specific strategies (YouTube, GitHub) construct URLs directly; generic/other source types fetch and parse `og:image` from the target URL.
- **Add backend dependencies**: `cheerio` for HTML parsing, a fetch timeout utility for OG image resolution.
- **Rewrite digest API endpoints**: All digest routes query the `bookmarks` table filtered by `digest_status` instead of the `digest_candidates` table.
- **Update library/search queries**: Exclude rows with `digest_status IN ('active', 'dismissed')` so digest candidates don't leak into the library.
- **Update types**: `DigestCandidate` becomes a type alias or narrowed view of `Bookmark`. Remove the separate `digest_candidates` DB types.
- **Update frontend hooks**: `useDigest` hooks work with Bookmark objects filtered by digest_status.

## Capabilities

### New Capabilities
- `thumbnail-resolution`: Inline thumbnail resolution for `content_type: "link"` bookmarks at creation time. Platform-specific URL construction (YouTube, GitHub) plus generic `og:image` fetch/parse fallback using cheerio.

### Modified Capabilities
- `digest`: Digest candidates are now stored as bookmark rows with `digest_status` instead of in a separate `digest_candidates` table. The save flow simplifies to a status update. All digest API endpoints query bookmarks with digest_status filters. **BREAKING**: `digest_candidates` table is dropped; the `DigestCandidate` type becomes a narrowed view of `Bookmark`.

## Impact

- **Database**: Migration adds 5 columns + 2 indexes to bookmarks, migrates existing digest_candidates data, drops digest_candidates table and its RLS policies/indexes.
- **Backend routes**: `apps/backend/src/routes/digest.ts` fully rewritten. `apps/backend/src/routes/bookmarks.ts` gains thumbnail resolution on creation and digest_status filtering on list/search.
- **Backend dependencies**: New deps: `cheerio` (HTML parsing). Node 18+ built-in `fetch` used for HTTP requests (no axios/node-fetch needed).
- **Types package**: `packages/types/src/database.types.ts` regenerated. `packages/types/src/app.types.ts` updated — `DigestCandidate` redefined as Bookmark subset.
- **Frontend**: `useDigest.ts` hooks updated for new response shape. `DigestPage.tsx` receives Bookmark objects. `useBookmarks.ts` unaffected if API filters correctly. Minimal rendering changes.
- **Existing data**: Any rows in `digest_candidates` are migrated to bookmarks during the schema migration.
