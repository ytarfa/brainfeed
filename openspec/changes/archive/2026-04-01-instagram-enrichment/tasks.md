## 1. Database & Types

- [ ] 1.1 Create migration to add `"instagram"` to `source_type` CHECK constraint
- [ ] 1.2 Add `"instagram"` to `SourceType` union in `packages/types/src/app.types.ts`
- [ ] 1.3 Regenerate Supabase TypeScript types via MCP tool
- [ ] 1.4 Run type checks to verify no breakage (`pnpm --filter @brain-feed/types build`)

## 2. Backend URL Handler

- [ ] 2.1 Create `apps/backend/src/services/urlHandlers/instagramHandler.ts` implementing `UrlHandler` interface with hostname matching for `instagram.com`, `www.instagram.com`, `m.instagram.com`
- [ ] 2.2 Update handler registration order in `apps/backend/src/services/urlHandlers/registry.ts` to YouTube → GitHub → Instagram → Article
- [ ] 2.3 Write unit tests for `InstagramHandler.matches()` covering post, reel, IGTV, profile, mobile, and non-Instagram URLs
- [ ] 2.4 Write unit tests for `InstagramHandler.resolve()` covering OG image present and absent cases
- [ ] 2.5 Run backend tests and verify passing

## 3. Instagram Service (Worker)

- [ ] 3.1 Create `packages/worker-enrichment/src/services/instagram-service.ts` with URL classification method: `/p/` → post, `/reel/` or `/reels/` → reel, `/tv/` → reel, else null
- [ ] 3.2 Implement SSR HTML fetch method using Googlebot UA (`Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`) with 30s timeout
- [ ] 3.3 Implement SSR detection: check for embedded `"caption":{"text":"..."}` JSON — throw error if absent (empty JS shell)
- [ ] 3.4 Implement content extraction: parse caption text, media_type (1→image, 2→video, 8→carousel), carousel_media_count, accessibility_caption, username, full_name, og:image from SSR HTML
- [ ] 3.5 Write unit tests for URL classification covering all patterns (post, reel, reels, tv, profile, explore, null cases)
- [ ] 3.6 Write unit tests for SSR HTML parsing using fixture HTML (mock SSR response and empty JS shell response)
- [ ] 3.7 Run worker tests and verify passing

## 4. Enrichment Graph Integration

- [ ] 4.1 Add `"instagram"` to `EnrichmentRoute` type and `SOURCE_TYPE_TO_ROUTE` mapping in `enrichment-graph.ts`
- [ ] 4.2 Add Instagram URL pattern to `resolveRoute()` function (after GitHub, before article fallback)
- [ ] 4.3 Implement `instagramNode()` graph node: classify URL → fetch via InstagramService → assemble content string (caption + accessibility caption) → call `enrichContent()` → build EnrichedData with Instagram metadata
- [ ] 4.4 Register `instagramNode` in the StateGraph and add conditional edge from router
- [ ] 4.5 Write unit tests for `resolveRoute()` with Instagram source_type and URL pattern
- [ ] 4.6 Write unit tests for `instagramNode()` covering: successful enrichment, SSR failure (error propagation), LLM failure (error propagation), unrecognized URL sub-type
- [ ] 4.7 Run full worker test suite and verify passing

## 5. Integration Testing

- [ ] 5.1 Run backend build (`pnpm --filter backend build`) and verify no errors
- [ ] 5.2 Run worker build (`pnpm --filter @brain-feed/worker-enrichment build`) and verify no errors
- [ ] 5.3 Run full lint pass (`pnpm lint`) and verify no errors
