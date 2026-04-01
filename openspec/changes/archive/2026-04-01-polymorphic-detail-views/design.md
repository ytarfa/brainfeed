## Context

`BookmarkDetail.tsx` (348 lines) is a monolithic modal that renders identically for all bookmark types. The enrichment pipeline produces rich, source-specific metadata (GitHub stars/forks/language, YouTube duration/views/channel, Instagram media types, article reading times) that is currently displayed as generic key-value chips. Each source type has unique affordances that deserve tailored presentation.

The existing component handles two concerns in one: (1) modal shell behavior (overlay, animation, escape key, close button) and (2) content rendering. This coupling makes it impossible to vary the content layout by bookmark type without branching logic in a single file.

## Goals / Non-Goals

**Goals:**
- Decouple modal shell from content rendering so each source type can have a completely different layout
- Establish a registry pattern that makes adding new detail views trivial (create component, register it)
- Support two-level type resolution: `content_type` first (for future non-link types), then `source_type` for links
- Extract reusable building blocks from the current monolith so per-type views can compose freely
- Add `media` field to `EnrichedData` for future multi-media support without pipeline changes
- Update stale mock data to match real enrichment pipeline output

**Non-Goals:**
- Changing `BookmarkCard` rendering (out of scope per user)
- Implementing enrichment pipeline changes (no backend/worker changes)
- Adding actual carousel functionality to Instagram (frontend support only; carousel renders when `media[]` is populated)
- Typed per-source `EnrichedData` variants (keep the flat metadata record for now; each view reads keys it expects)

## Decisions

### 1. Component Registry with Composite Keys

**Decision:** Use a flat `Record<string, ComponentType<DetailViewProps>>` with composite keys like `link:github`, `link:youtube`, plus direct `ContentType` keys for non-link types.

**Alternatives considered:**
- **Nested map** (`content_type → source_type → component`): More structured but unnecessary indirection for a flat lookup.
- **Strategy pattern** (render function per type): Less React-idiomatic; components are the natural unit of composition.
- **Plugin system** with dynamic imports: Overkill — all source types are known at build time.

**Rationale:** Flat registry is simple, type-safe, and extensible. A `resolveDetailView(bookmark)` function encapsulates the two-level resolution logic. Adding a new type is: create component + add one registry entry.

### 2. Modal Shell Stays in BookmarkDetail.tsx

**Decision:** Keep `BookmarkDetail.tsx` as the modal shell (overlay, animation, escape key, close button, dialog ARIA). It receives a `bookmark` and delegates the entire scrollable body to the resolved detail view component.

**Alternatives considered:**
- **Each view manages its own modal**: Massive duplication of animation/accessibility logic.
- **Generic `Modal` component**: Could work but over-abstracts; the bookmark detail modal has specific styling (rounded-[20px], specific shadow, backdrop blur) that a generic modal would either lose or parameterize unnecessarily.

**Rationale:** The shell is stable and source-type-independent. Keeping it in `BookmarkDetail.tsx` preserves the existing API (`bookmark`, `onClose`, `spaceName`, `spaceColor`) — callers don't need to change.

### 3. Shared Building Blocks Are Opt-In, Not Imposed

**Decision:** Extract the current sections (summary, topics, entities, metadata, tags, space, notes, footer) into small shared components. Per-type views import what they need.

**Alternatives considered:**
- **Base component with slots**: Forces a prescribed section order. Contradicts the "completely different layouts" requirement.
- **Higher-order component wrapper**: Same problem — imposes structure.
- **No extraction** (each view copies what it needs): Leads to drift and duplication over time.

**Rationale:** Opt-in composition lets GitHub skip the hero image and render a structured header instead, while Article keeps the hero. Instagram can skip metadata chips entirely and render a large photo with caption. Each view is free to diverge completely.

### 4. DetailViewProps — Minimal Contract

**Decision:** The detail view component contract is:

```typescript
interface DetailViewProps {
  bookmark: Bookmark;
  spaceName?: string;
  spaceColor?: string;
}
```

No `onClose`, no animation state, no `ref` — those belong to the shell.

**Rationale:** Views shouldn't know they're inside a modal. This makes them testable in isolation and potentially reusable (e.g., inline preview in a sidebar later).

### 5. MediaItem Type on EnrichedData

**Decision:** Add an optional `media?: MediaItem[]` field to `EnrichedData`:

```typescript
interface MediaItem {
  url: string;
  type: "image" | "video";
  alt?: string;
}
```

**Alternatives considered:**
- **Separate `images` and `videos` arrays**: Less flexible; some content types may have mixed media.
- **Extending `metadata` with array values**: Breaks the `Record<string, string | number>` signature and muddies the generic metadata with structured data.

**Rationale:** A dedicated typed array is clean, forward-looking, and doesn't require changing the metadata signature. The Instagram view checks `enriched_data?.media`, renders carousel if present, falls back to `thumbnail_url` otherwise.

### 6. File Structure

```
apps/frontend/src/components/
├── BookmarkDetail.tsx              ← refactored to modal shell only
├── detailViews/
│   ├── types.ts                    ← DetailViewProps, DetailViewKey
│   ├── registry.ts                 ← resolveDetailView() + registry map
│   ├── views/
│   │   ├── DefaultDetailView.tsx   ← extracted from current BookmarkDetail
│   │   ├── GitHubDetailView.tsx
│   │   ├── YouTubeDetailView.tsx
│   │   ├── InstagramDetailView.tsx
│   │   └── ArticleDetailView.tsx
│   └── shared/
│       ├── DetailSummary.tsx
│       ├── DetailTags.tsx
│       ├── DetailNotes.tsx
│       ├── DetailSpace.tsx
│       ├── DetailFooter.tsx
│       ├── DetailTopics.tsx
│       ├── DetailEntities.tsx
│       └── DetailMetadata.tsx
```

## Risks / Trade-offs

- **[Risk] Shared components become a maintenance burden** → Mitigation: Keep them tiny and stateless. Each renders one section with a clear prop contract. If a view needs something different, it just doesn't use the shared component.
- **[Risk] Mock data divergence causes confusion during development** → Mitigation: Update mocks to real pipeline keys as part of this change, before building views.
- **[Risk] Instagram carousel UI built but never populated** → Mitigation: Accepted tradeoff. The carousel component gracefully degrades to single image via `thumbnail_url`. No dead code — the code path activates when `media[]` gets populated.
- **[Risk] View-level state management (e.g., notes editing, image loading)** → Mitigation: Each view manages its own state. The shell only manages modal-level state (visible, animation). Image loading state is view-internal.
