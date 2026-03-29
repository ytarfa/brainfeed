## Context

Brainfeed is a monorepo (Express backend + React/Vite frontend) backed by Supabase. Users currently manage bookmarks organized into Spaces. Sync source configuration exists (YouTube, RSS, Reddit, Spotify) but no sync worker or fetch pipeline is implemented — sources are just stored configs.

The bookmark table already has `enrichment_status` and `enriched_data` columns (unused). The `bookmark_spaces` join table supports multi-space assignment with `added_by` tracking. None of this is relevant to Digest v1 — saved candidates become plain bookmarks with no space and `enrichment_status: 'pending'`.

The frontend uses inline `React.CSSProperties` styling with CSS custom properties, imperative hover handling, and local `useState` only (no global store). Route pages receive shared state via `useOutletContext` from `AppLayout`.

## Goals / Non-Goals

**Goals:**
- Introduce a `digest_candidates` table as a lightweight staging area for content candidates
- Build a REST API for candidate lifecycle: list, save (promote to bookmark), dismiss, bulk dismiss, purge expired
- Build a grouped-feed review page at `/digest` for fast visual triage
- Add a library banner nudge showing candidate count and group summary
- Add a sidebar "Digest" nav item with badge count between Library and Spaces
- Seed mock candidates so the feature is exercisable before sync workers exist

**Non-Goals:**
- Sync workers or actual content fetching from external sources
- AI space suggestion or auto-categorization on save
- Space assignment during save (bookmarks are created space-less)
- Deep enrichment pipeline (candidate save sets `enrichment_status: 'pending'`, nothing processes it)
- Push notifications or email digest summaries
- Undo dismiss functionality
- AI pre-ranking of candidates

## Decisions

### 1. Separate `digest_candidates` table (not a status field on bookmarks)

**Decision:** Candidates live in their own table, not as a status on the bookmarks table.

**Rationale:** Candidates are intentionally lighter — no tags, no notes, no space, no enriched data. Mixing them into the bookmarks table would bloat it with transient data and complicate queries. A separate table keeps the bookmarks table clean and makes expiry/purge trivial (DELETE from one table).

**Alternatives considered:**
- `status` field on bookmarks: Simpler promotion (just flip a flag), but mixes transient and permanent data, complicates bookmark queries with status filters everywhere, and makes the "candidates are lighter" invariant hard to enforce.

### 2. Grouped feed UI (not card stack, not flat list)

**Decision:** The Digest page shows candidates grouped by source (source_id when present, source_type as fallback), with per-group "Skip All" for bulk dismiss.

**Rationale:** The spec calls for "magazine flip" feel with batch efficiency — users should process 20 items in under a minute. Grouping by source lets users quickly dismiss entire feeds they don't care about while focusing on high-value sources. A flat list loses source context; a card stack (Tinder-style) is too slow for batch operations.

### 3. Space-agnostic save

**Decision:** Saving a candidate creates a bookmark with no space assignment. No `bookmark_spaces` row is created.

**Rationale:** The Digest is a triage layer, not an organization layer. Keeping save as a single action (no picker, no modal) maintains the fast review feel. Users organize bookmarks into spaces later, from the library — or never.

### 4. Silent expiry with read-time filtering + periodic purge

**Decision:** Expired candidates (past `expires_at`) are filtered out at query time. A `DELETE /api/digest/expired` endpoint exists for periodic cleanup. No user-facing expiry notifications.

**Rationale:** Expiry is a garbage-collection concern, not a user-facing event. Filtering at read time means expired items disappear immediately without waiting for a purge job. The purge endpoint keeps storage lean and can be called from a cron or manually.

### 5. Dual surface: sidebar page + library banner

**Decision:** The Digest is accessible both as a dedicated `/digest` page (via sidebar) and as a lightweight count banner at the top of the Library page.

**Rationale:** The banner creates a passive nudge without forcing a workflow change. Power users go to the full Digest page; casual users see the count while browsing the library and can click through. The banner is dismissible per-session (hides via local state, candidates persist).

### 6. Bottom-up build order

**Decision:** Build the table, API, and UX first with seeded mock data. Sync workers will write to `digest_candidates` later.

**Rationale:** The Digest review experience is valuable to design and validate independently of the sync pipeline. Mock data lets the feature be fully exercisable. When sync workers arrive, they just INSERT into the same table — no Digest changes needed.

## Risks / Trade-offs

- **[No real data]** The feature launches with mock/seed data only. Users can't experience it with their actual content until sync workers are built. → Mitigated by making mock data realistic and representative of various source types.

- **[Table growth without purge automation]** Without an automated cron, expired candidates accumulate until someone calls the purge endpoint manually. → Acceptable for v1. The read-time filter means users never see expired items. Automated purge can be added when there's a job runner.

- **[No undo dismiss]** Dismissed candidates are gone (until they're purged, the row exists with `status: 'dismissed'`, but the UI doesn't surface it). → Accepted trade-off per the spec. A future "undo" toast is a straightforward addition if needed.

- **[Badge count requires an extra query]** The sidebar badge needs a count of active candidates on every page load. → Use the `/api/digest/summary` endpoint which returns just a count, making it lightweight. Can be cached or polled infrequently.
