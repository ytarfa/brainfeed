## Context

Instagram posts and reels currently have no enrichment support. Testing revealed that Instagram no longer serves OG tags for posts/reels to any user agent, and the public oEmbed endpoint is defunct. However, with a Googlebot UA, some posts return a fully SSR-rendered page containing rich embedded data (captions, media type, carousel count, accessibility alt text). The hit rate is low (~14% in testing), but when SSR is available the data is rich enough for full LLM enrichment. Profiles are out of scope for this change.

## Goals

- Enrich Instagram post and reel bookmarks when SSR data is available
- Extract caption text, media type, username, and Instagram-specific metadata from SSR HTML
- Produce AI-generated summaries, entities, topics, and tags from caption text
- Fail clearly when SSR data is not available (no graceful degradation)

## Non-Goals

- Profile enrichment (out of scope)
- Story enrichment (ephemeral, out of scope)
- Meta API / oEmbed integration (may be added later)
- Re-enrichment / scheduled retry for failed Instagram bookmarks
- Partial or "best-effort" enrichment when data is sparse

## Decisions

### Decision 1: Use Googlebot User-Agent for Instagram fetches

**Rationale:** Testing confirmed that Instagram selectively SSRs pages for Googlebot. This is the only working extraction method that requires no API keys or external services.

**Alternatives considered:**
- Standard bot UA (BrainFeedBot) — returns empty JS shell 100% of the time
- Twitterbot / facebookexternalhit UA — same empty shell
- Meta Graph API oEmbed — requires OAuth app token, returns limited data
- Headless browser rendering — too heavy for background worker, still requires auth for most content

**Trade-off:** Googlebot UA only works for a subset of posts. This is accepted — failed enrichment is the expected outcome for most Instagram bookmarks.

### Decision 2: Parse embedded JSON from SSR HTML, not OG tags

**Rationale:** When Instagram serves SSR HTML, the rich data is embedded in inline JSON within script tags and HTML attributes — not in OG meta tags. The SSR page contains caption objects with full text, `media_type` integers, `carousel_media_count`, `accessibility_caption`, and username/full name. OG tags on SSR pages are minimal (no `og:description`, no `og:title` for posts).

**Data extraction targets from SSR HTML:**
- `"caption":{"text":"..."}` — full caption text (primary content for LLM)
- `"media_type":N` — 1=image, 2=video, 8=carousel
- `"carousel_media_count":N` — slide count for carousels
- `"accessibility_caption":"..."` — AI-generated image alt text
- `"username":"..."` and `"full_name":"..."` — author info
- `og:image` — thumbnail URL (this one IS in OG tags on SSR pages)
- `instapp:owner_user_id` — Instagram user ID
- `al:ios:url` — contains media ID

### Decision 3: Binary success/failure, no quality tiers

**Rationale:** The data from SSR pages is rich enough for full enrichment. If the page isn't SSR'd, there's essentially zero usable data (no OG tags, no embedded JSON). There's no meaningful middle ground.

**Implementation:** If the Instagram service cannot extract a caption from the HTML, it throws an error. The graph node lets the error propagate, the processor sets `enrichment_status: "failed"`, and BullMQ retries up to 3 times.

### Decision 4: Instagram handler placed before Article handler in registry

**Rationale:** Instagram SSR pages have `og:type: "article"`, which would cause the Article handler to match them. The Instagram handler must be checked first. This follows the same pattern as YouTube handler taking priority over Article.

**Handler order:** YouTube → GitHub → Instagram → Article

### Decision 5: Instagram service owns its own HTTP fetch with Googlebot UA

**Rationale:** The existing `OgFetcher` uses `BrainFeedBot/1.0` UA and is designed for OG tag extraction. Instagram needs a Googlebot UA and full HTML body parsing. Rather than adding Instagram-specific logic to OgFetcher, the Instagram service handles its own fetch. The backend handler still uses OgFetcher for the registry's base OG layer (which will return nulls for Instagram, and that's fine).

### Decision 6: URL classification covers /p/ and /reel/ patterns only

**Rationale:** Posts use `/p/{shortcode}/`, reels use `/reel/{shortcode}/` or `/reels/{shortcode}/`. The deprecated `/tv/{shortcode}/` (IGTV) redirects to reels and uses the same content structure, so it can be included. Profile URLs (`/{username}/`) and story URLs (`/stories/...`) are out of scope.

**Patterns:**
- `instagram.com/p/{shortcode}` → post (image, video, or carousel)
- `instagram.com/reel/{shortcode}` or `/reels/{shortcode}` → reel
- `instagram.com/tv/{shortcode}` → reel (IGTV redirect)

## Risks and Trade-offs

### Risk: Low SSR hit rate
Instagram's SSR behavior is non-deterministic. Only ~14% of tested posts returned SSR data. Most Instagram bookmarks will fail enrichment. This is accepted as a v1 limitation.

**Mitigation:** BullMQ retries (3 attempts) provide additional chances. The non-deterministic nature of SSR means retries may succeed where the first attempt failed.

### Risk: Instagram changes SSR behavior
Instagram could stop serving SSR pages to Googlebot entirely, which would make this enrichment path 0% effective.

**Mitigation:** The implementation is isolated in its own service and graph node. If Instagram locks down further, the feature degrades to "all Instagram bookmarks fail enrichment" with no impact on other enrichment paths.

### Risk: Googlebot UA may trigger rate limiting or blocking
Instagram may throttle or block requests from IPs sending Googlebot UA without being actual Googlebot.

**Mitigation:** BullMQ's exponential backoff on retries provides natural spacing. Additional request throttling can be added to the Instagram service if needed.

### Risk: Embedded JSON structure may change
The caption and metadata JSON is not a documented API — it's internal page structure that could change without notice.

**Mitigation:** The parser should be defensive (optional chaining, fallback to empty values). If the JSON structure changes, extraction fails and enrichment fails cleanly.

## Migration Plan

1. Database migration: Add `"instagram"` to `source_type` CHECK constraint
2. Types: Add `"instagram"` to `SourceType` union
3. Backend: Add `InstagramHandler` to URL handler registry
4. Worker: Add `InstagramService`, `instagramNode`, and route
5. No data migration needed — existing bookmarks are unaffected

## Open Questions

None — scope is well-defined and approach has been validated through testing.
