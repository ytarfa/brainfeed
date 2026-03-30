## Context

The bookmark system currently supports 5 content types (`link`, `note`, `image`, `pdf`, `file`) and 14 source types in TypeScript, with the database allowing 18 source types (including ghost types `article`, `academic`, `instagram`, `manual` not present in TS). The enrichment pipeline defines 9 route nodes, all stubs. Only GitHub and YouTube have real thumbnail resolution strategies; all other source types fall through to generic OG image fetch.

The codebase has grown ahead of what is actually built. This change cuts back to a focused core: everything is a link, source types are github/youtube/generic, enrichment routes match.

## Goals / Non-Goals

**Goals:**
- Eliminate all content types except `"link"` from the entire stack (TS types, DB constraints, backend logic, frontend UI, worker pipeline)
- Restrict source types to `"github" | "youtube" | "generic"` across all layers
- Delete dead enrichment route nodes and routing logic
- Remove the sync sources feature entirely (not yet functional)
- Fix all DB/TS type discrepancies (ghost types, mismatched values)
- Provide a clean, minimal base to extend deliberately

**Non-Goals:**
- Adding new enrichment logic for github/youtube (stubs remain as-is)
- Changing the `EnrichedData` structure or enrichment status flow
- Modifying the digest feature (digest candidates are links, unaffected)
- Updating `supabase/migrations.sql` baseline (incremental migrations only)
- Regenerating `database.types.ts` (remains auto-generated with string types)

## Decisions

### 1. Hard cutover, no deprecation

**Decision:** Remove all non-link content types and non-core source types in a single change. No feature flags, no gradual migration.

**Rationale:** The removed types have no production data behind them (the app is pre-launch). A hard cutover avoids carrying dead-code paths and conditional logic that would need a second cleanup pass.

**Alternative considered:** Deprecation period with runtime warnings. Rejected — no users to migrate, unnecessary complexity.

### 2. DB migration updates rows then tightens constraints

**Decision:** The migration first updates any non-conforming rows (`content_type` != `"link"` → set to `"link"`, `source_type` not in target set → set to `"generic"`), then drops old CHECK constraints and adds new tight ones.

**Rationale:** Ensures the migration is safe to run on any database state. The row update is idempotent. Constraint changes use DROP + ADD to avoid stale constraint names.

**Alternative considered:** Leave DB constraints loose and only tighten TS types. Rejected — the existing discrepancies between DB and TS types are a source of bugs, and the user explicitly requested tight constraints.

### 3. SaveItemModal becomes URL-only input

**Decision:** Remove the note detection path (`isUrl` check). The input field only accepts URLs. Non-URL input shows a validation message.

**Rationale:** With `content_type` restricted to `"link"`, there is no server-side path to create notes. The frontend should enforce this at the input level.

### 4. Library page removes content filter tabs

**Decision:** Remove the `ContentFilter` type and the 5-tab filter row entirely. All bookmarks are links — no need to filter by content type.

**Rationale:** A single-value content type makes the filter meaningless. If/when new types are added back, the filter can be re-introduced.

### 5. Source type strategy becomes a 2-entry map

**Decision:** `SOURCE_TYPE_MAP` in `sourceTypeStrategy.ts` keeps only `github.com` → `"github"` and `youtube.com`/`youtu.be` → `"youtube"`. Everything else returns `null`, and the caller defaults to `"generic"`.

**Rationale:** Matches the target `SourceType` union exactly. No need to detect hostnames we don't have special handling for.

### 6. Enrichment graph reduced to 3 routes

**Decision:** `EnrichmentRoute` becomes `"github" | "youtube" | "generic"`. Delete 6 nodes (`twitterNode`, `redditNode`, `spotifyNode`, `paperNode`, `newsNode`, `nonLinkNode`) and their graph edges. The `resolveRoute()` function simplifies to: check source_type mapping, then URL patterns (2 entries), then fallback to generic.

**Rationale:** The deleted nodes are all placeholder stubs with no real logic. Keeping them adds confusion about what is actually implemented.

### 7. Delete sync sources feature

**Decision:** Delete `routes/syncSources.ts` backend file and remove sync source UI from `SpaceSettings.tsx`. Remove the route mount.

**Rationale:** Sync sources are not functional (just scaffolded). Removing them aligns with the "start smaller" philosophy. Can be re-added with the correct source types when actually implemented.

## Risks / Trade-offs

- **[Existing non-link bookmarks in DB]** → Migration updates them to `content_type: "link"` before tightening. Any notes will lose their semantic meaning (raw_content preserved in column but no UI to display it). Acceptable for pre-launch.
- **[Re-adding types later requires new migration + code changes]** → Intentional trade-off. Adding types back is straightforward: expand TS union, add migration, re-add UI. The clean base makes this easier than working around dead code.
- **[Mock data changes may affect frontend tests]** → Tests reference specific mock bookmarks. Update mock data and tests together.
