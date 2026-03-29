## Context

The application has two separate tables for URL-based content: `bookmarks` (permanent user-saved items with enrichment infrastructure) and `digest_candidates` (transient items from sync sources awaiting user triage). They share 5 overlapping columns (url, title, description, thumbnail_url, source_type) but have different lifecycle semantics. When a user "saves" a digest candidate, 5 fields are copied into a new bookmark row and the candidate is marked as saved — a 3-query cross-table operation.

An enrichment worker is planned that will resolve thumbnails, extract metadata, and populate `enriched_data`. With two tables, this worker would need two processing paths. Unifying the tables gives it a single target.

Currently, `thumbnail_url` is never populated during bookmark creation — it exists in the schema but is always NULL for bookmarks created via `POST /api/v1/bookmarks`. The only path that writes it is the digest save flow, which copies it from the candidate (where it was presumably set during ingestion).

No HTTP fetching or HTML parsing libraries exist in the backend. The backend uses Node 18+ with built-in `fetch` available.

## Goals / Non-Goals

**Goals:**
- Unify `digest_candidates` into the `bookmarks` table so both share a single enrichment path
- Resolve thumbnails inline (synchronously) at bookmark creation time for `content_type: "link"`
- Simplify the digest save flow to a single-field UPDATE
- Maintain all existing digest UX (grouped feed, save, dismiss, bulk dismiss, expiry)
- Lay the foundation for a future enrichment worker that processes all bookmarks uniformly

**Non-Goals:**
- Building the async enrichment worker or job queue (future work)
- Resolving thumbnails for non-link content types (notes, images, PDFs, files)
- Changing the frontend digest page UX or card design
- Adding new digest features (filtering, sorting, etc.)
- Full metadata enrichment (reading time, author extraction, etc.) — only thumbnails for now

## Decisions

### 1. Digest candidates stored as bookmark rows with `digest_status` column

**Decision:** Add a nullable `digest_status` column to `bookmarks` with values `'active'`, `'saved'`, `'dismissed'`. Regular bookmarks have `digest_status = NULL`. Digest candidates have `digest_status = 'active'`.

**Rationale:** This is the simplest unification approach. A nullable column cleanly separates the two concerns — NULL means "regular bookmark," non-NULL means "came from digest." The save operation becomes `UPDATE SET digest_status = 'saved'` instead of a cross-table INSERT+UPDATE.

**Alternatives considered:**
- *System space / inbox pattern:* Digest candidates as bookmarks in a special space. Rejected because spaces are a user concept, and the digest-specific fields (source_name, expires_at) still need a home. Adds complexity for no clear benefit.
- *Separate tables with shared enrichment service:* Keeps the current architecture but shares the thumbnail resolution function. Rejected because the enrichment worker would still need two processing paths, and the save flow remains a 3-query operation.

### 2. Five new columns on bookmarks for digest-specific data

**Decision:** Add `digest_status` (text, nullable), `source_name` (text, nullable), `source_id` (uuid, nullable FK to sync_sources), `published_at` (timestamptz, nullable), `expires_at` (timestamptz, nullable) to bookmarks.

**Rationale:** These columns capture the digest-specific provenance and lifecycle data that regular bookmarks don't need. Making them all nullable means regular bookmark creation is unaffected — these columns simply stay NULL. The alternative of stuffing them into `enriched_data` JSONB was rejected because `digest_status` and `expires_at` need to be indexed and queried efficiently.

### 3. Library/search queries filter by digest_status

**Decision:** All bookmark listing and search queries add `WHERE digest_status IS NULL OR digest_status = 'saved'` (or equivalently, `digest_status NOT IN ('active', 'dismissed') OR digest_status IS NULL`).

**Rationale:** Active and dismissed digest candidates should not appear in the library. Saved candidates (promoted from digest) should appear — they're full bookmarks now. Using an explicit filter rather than a DB view keeps the queries transparent and avoids introducing a new abstraction.

### 4. Inline thumbnail resolution using platform strategies + generic OG fetch

**Decision:** Resolve thumbnails synchronously during `POST /api/v1/bookmarks` for `content_type: "link"`. Use a strategy dispatch based on `source_type`:
- **YouTube:** Construct `https://img.youtube.com/vi/{videoId}/hqdefault.jpg` — no HTTP request needed.
- **GitHub:** Construct `https://opengraph.githubassets.com/1/{owner}/{repo}` — no HTTP request needed.
- **All others (generic, twitter, reddit, etc.):** Fetch the URL, parse HTML with cheerio, extract `og:image` meta tag content.

**Rationale:** YouTube and GitHub have deterministic thumbnail URL patterns, so there's no reason to make an HTTP request. For everything else, `og:image` is the most reliable cross-platform thumbnail source. Cheerio is lightweight (~200KB) and parses HTML without executing JavaScript, which is appropriate for meta tag extraction.

**Alternatives considered:**
- *Use a thumbnail API service (e.g., microlink, urlbox):* Rejected — adds an external dependency and cost. OG image extraction covers the vast majority of cases.
- *Use puppeteer/playwright for screenshot-based thumbnails:* Rejected — heavy dependency, slow, overkill for meta tag extraction.

### 5. Use cheerio for HTML parsing, built-in fetch for HTTP

**Decision:** Add `cheerio` as a backend dependency. Use Node 18+ built-in `fetch` (globally available) for HTTP requests. No additional HTTP client library.

**Rationale:** The backend runs on Node 18+ where `fetch` is stable and globally available. Adding axios or node-fetch would be redundant. Cheerio is the standard lightweight choice for server-side HTML parsing — it provides a jQuery-like API for traversing HTML without a full DOM implementation.

### 6. Thumbnail resolution is best-effort, non-blocking to save

**Decision:** If thumbnail resolution fails (network error, no og:image found, invalid URL), the bookmark is still created with `thumbnail_url = NULL`. Errors are logged but do not fail the request.

**Rationale:** The thumbnail is a nice-to-have enhancement, not a critical field. A failed URL fetch (timeout, 403, CORS) should not prevent the user from saving their bookmark. The future enrichment worker can retry failed resolutions.

### 7. Fetch timeout of 5 seconds for OG image resolution

**Decision:** HTTP requests to resolve OG images use a 5-second timeout via `AbortController`.

**Rationale:** The user is waiting synchronously. Anything beyond 5 seconds is likely a slow or unreachable server, and the save should complete. YouTube and GitHub strategies avoid this entirely since they construct URLs without fetching.

### 8. Migration strategy: data migration + table drop

**Decision:** The DB migration will:
1. Add the 5 new columns to bookmarks
2. INSERT INTO bookmarks from digest_candidates (mapping fields)
3. Drop the digest_candidates table

**Rationale:** This is a single migration that handles the transition atomically. Existing digest candidates are preserved as bookmark rows. The migration is applied via `supabase_apply_migration` (the project uses Supabase-managed migrations).

## Risks / Trade-offs

**[Inline resolution adds latency to bookmark creation]** → Accepted trade-off. YouTube/GitHub are instant (URL construction). Generic OG fetch adds 1-5 seconds. The user is already waiting for a save confirmation. If this becomes a UX issue, the future enrichment worker provides an upgrade path to async resolution.

**[Some sites block server-side fetches or return different content]** → Thumbnail resolution is best-effort. Sites that block, require JavaScript rendering, or return 403/CAPTCHA will result in `thumbnail_url = NULL`. This is acceptable — the frontend already handles missing thumbnails gracefully.

**[Adding 5 nullable columns to bookmarks increases table width]** → Minimal impact. The columns are nullable and NULL values consume negligible storage in Postgres. The digest-specific indexes add slight write overhead but are necessary for query performance.

**[Library queries must always filter digest_status]** → If a developer forgets the filter, active digest candidates could leak into the library. Mitigated by: (1) making this a documented convention, (2) the filter is simple and consistent, (3) future option to create a Postgres view if this becomes error-prone.

**[Migration drops digest_candidates — no rollback]** → The migration is one-way. Rolling back requires restoring from backup. Mitigated by: migration correctly copies all data before dropping, and the application can be tested on a branch database first.
