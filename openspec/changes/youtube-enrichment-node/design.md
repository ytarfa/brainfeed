## Context

The enrichment pipeline has three route-specific nodes (github, youtube, generic) implemented as stubs returning empty `EnrichedData`. The routing infrastructure is in place via LangGraph `StateGraph` with conditional routing based on `source_type` and URL patterns. YouTube URLs (video, channel, playlist) all route to `youtubeNode`, but no logic distinguishes between them or fetches any data.

The `YouTubeService` already wraps the YouTube Data API for video and channel metadata. `@langchain/openrouter` is installed but unused. No LLM invocation or transcript loading exists anywhere in the worker-enrichment package.

## Goals / Non-Goals

**Goals:**
- Implement a fully functional `youtubeNode` that produces meaningful `EnrichedData` for video, channel, and playlist YouTube URLs
- Create a reusable LLM utility (`enrichContent`) that other nodes (github, generic) can use later
- Add URL classification to distinguish video/channel/playlist within the YouTube node
- Extend `YouTubeService` with playlist support and channel handle resolution

**Non-Goals:**
- Implementing the github or generic enrichment nodes (separate future changes)
- Adding retry/circuit-breaker logic for external API calls (handle via BullMQ job retries)
- Supporting non-English transcripts (default to English; graceful fallback if unavailable)
- Caching API responses or transcripts
- Rate limiting YouTube Data API calls beyond what the API itself enforces

## Decisions

### Decision 1: URL classification inside `youtubeNode`, not in routing

**Choice**: Classify YouTube URL type (video/channel/playlist) inside `youtubeNode` rather than splitting into three separate LangGraph nodes.

**Rationale**: The LangGraph routing already directs all YouTube URLs to one node. Adding sub-routing at the graph level would complicate the graph topology for a single source type. A simple `classifyYouTubeUrl()` function with internal branching keeps the graph clean and the YouTube-specific logic cohesive.

**Alternatives considered**: Three separate YouTube nodes with sub-routing — rejected because it adds graph complexity without meaningful benefit, and all three paths share the same LLM summarization step.

### Decision 2: Transcript loading via `@langchain/community` YoutubeLoader

**Choice**: Use `YoutubeLoader` from `@langchain/community` (which uses `youtubei.js` internally) for transcript extraction.

**Rationale**: Already compatible with LangChain's `Document` abstraction. Handles transcript fetching, language selection, and pagination internally. The `youtubei.js` library works without API keys (scrapes YouTube's innertube API).

**Alternatives considered**: Direct `youtubei.js` usage — rejected because `YoutubeLoader` wraps it with better ergonomics and error handling for our use case. YouTube Data API captions endpoint — rejected because it requires OAuth and only works for videos the authenticated user owns.

### Decision 3: Ambiguous URLs default to video

**Choice**: URLs containing `watch?v=` with a `list=` parameter are treated as videos (not playlists). Only URLs with `/playlist?list=` are treated as playlists.

**Rationale**: User intent when bookmarking `watch?v=X&list=Y` is almost always to save the specific video, not the playlist it happens to be in. This matches the user's decided preference.

### Decision 4: Channel handle resolution via YouTube Data API `forHandle`

**Choice**: Resolve `/@handle` URLs by calling the YouTube Data API channels endpoint with the `forHandle` parameter.

**Rationale**: This is the officially supported method. Channel handles can change and don't map predictably to channel IDs. The Data API resolves them reliably with a single call.

**Alternatives considered**: Scraping the channel page HTML for the channel ID — rejected because it's fragile and against YouTube ToS.

### Decision 5: Shared LLM utility with Zod structured output

**Choice**: Create `src/services/llm.ts` with a `getModel()` factory and an `enrichContent()` function that uses `ChatOpenRouter.withStructuredOutput(zodSchema)` to produce typed `EnrichedData`.

**Rationale**: All three enrichment nodes need the same LLM summarization step — only the input content differs. A shared function with a Zod schema ensures consistent output shape and type safety. The `withStructuredOutput` API handles JSON schema generation and parsing automatically.

**Model selection**: Configurable via `ENRICHMENT_MODEL` env var, defaulting to a cost-effective model (e.g., `google/gemini-2.0-flash-001`). This allows easy model swapping without code changes.

### Decision 6: Graceful transcript fallback

**Choice**: If transcript loading fails for a video (disabled captions, private video, etc.), fall back to enriching from the video title + description only, and note the limitation in metadata.

**Rationale**: Many videos have captions disabled. Returning empty data for these would be a poor user experience. Title + description still provide enough signal for basic topic/tag extraction. The `metadata` field can include `transcriptAvailable: "false"` to indicate reduced quality.

### Decision 7: Playlist enrichment from item titles + playlist metadata

**Choice**: Fetch playlist metadata (title, description, item count) and first N video titles via the YouTube Data API `playlistItems` endpoint. Do not fetch individual video transcripts for playlists.

**Rationale**: Fetching transcripts for all videos in a playlist would be extremely slow and expensive. The playlist title, description, and video titles provide sufficient signal for meaningful topic/tag extraction. The item count goes into metadata.

## Risks / Trade-offs

**[Risk] `youtubei.js` / YoutubeLoader breaks due to YouTube changes** → The innertube API is unofficial. Mitigation: transcript loading is wrapped in try/catch with fallback to description-only enrichment. The node never fails entirely due to transcript issues.

**[Risk] YouTube Data API quota exhaustion** → Each enrichment call uses 1-3 API units. Mitigation: BullMQ concurrency limits and job rate control at the worker level. Quota monitoring is out of scope but can be added later.

**[Risk] LLM output doesn't match expected schema** → Mitigation: `withStructuredOutput` validates against the Zod schema. If parsing fails, LangChain throws and BullMQ retries the job.

**[Risk] Long transcripts exceed LLM context window** → Mitigation: Truncate transcript content to a configurable max character limit before sending to the LLM. Most video transcripts fit within 100K tokens; the truncation is a safety net.

**[Trade-off] No transcript for channels/playlists** → Channels and playlists get enrichment from metadata only, which produces less detailed summaries than video transcripts. This is acceptable because the alternative (fetching multiple video transcripts) is too expensive.
