## Why

The bookmark type taxonomy has grown ahead of what is actually useful. There are 5 content types and 14 source types in TypeScript, 18 source types in the DB (with 4 ghost types not in TS), and the enrichment pipeline has 9 route nodes — all placeholder stubs. Only GitHub and YouTube have real thumbnail strategies; everything else is generic. Starting smaller with a focused set and adding types back deliberately gives a cleaner base to build from.

## What Changes

- **BREAKING**: Restrict `ContentType` to `"link"` only — remove `"note"`, `"image"`, `"pdf"`, `"file"`
- **BREAKING**: Restrict `SourceType` to `"github" | "youtube" | "generic"` — remove 11 other values
- Delete enrichment route nodes for twitter, reddit, spotify, paper, news, non_link — keep only `githubNode`, `youtubeNode`, `genericNode`
- Remove `UNSUPPORTED_CONTENT_TYPES` skip logic in the enrichment processor (everything is `"link"` now)
- Remove note-specific backend logic (immediate completion, `raw_content` branch)
- Remove sync sources feature entirely (backend route + frontend SpaceSettings UI)
- Remove frontend content-type filter tabs (Library page), note creation path (SaveItemModal), and trim all icon/color/variant maps to 3 source types
- Delete 4 variant components: PaperMeta, SpotifyMeta, RedditMeta, TwitterMeta
- DB migration to tighten CHECK constraints and update non-conforming rows
- Fix DB/TS discrepancies: eliminate ghost types (`"article"`, `"academic"`, `"instagram"`, `"manual"`)

## Capabilities

### New Capabilities

_(none — this is a reduction, not an addition)_

### Modified Capabilities

- `enrichment-worker`: Reduce `EnrichmentRoute` from 9 to 3, delete 6 route nodes, remove non-link content handling
- `thumbnail-resolution`: Source type strategy trimmed to GitHub + YouTube + OG fallback only; remove hostname entries for twitter, instagram, reddit, amazon, arxiv, scholar

## Impact

- **Types**: `packages/types/src/app.types.ts` — `ContentType`, `SourceType` unions narrowed
- **Backend routes**: `routes/bookmarks.ts` (Zod schema, note logic), `routes/syncSources.ts` (deleted)
- **Backend services**: `sourceTypeStrategy.ts`, `bookmarkService.ts` simplified
- **Worker**: `enrichment-graph.ts` (6 nodes deleted, routing trimmed), `processor.ts` (unsupported logic removed)
- **Frontend pages**: `Library.tsx` (filter tabs), `SpaceSettings.tsx` (sync sources removed)
- **Frontend components**: `SaveItemModal.tsx`, `BookmarkCard.tsx`, `ThumbnailPlaceholder.tsx`, `renderSourceMeta.tsx` + 4 variant files deleted
- **Mock data**: `mock.ts` — all entries updated to `content_type: "link"` and valid source types
- **Database**: New migration tightening `content_type` and `source_type` CHECK constraints
