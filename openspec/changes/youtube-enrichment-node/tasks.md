## 1. Dependencies & Setup

- [x] 1.1 Install `@langchain/community` and `youtubei.js` in `packages/worker-enrichment`
- [x] 1.2 Verify imports resolve correctly (`YoutubeLoader`, `ChatOpenRouter`) by running `pnpm --filter @brain-feed/worker-enrichment build`

## 2. LLM Enrichment Utility

- [x] 2.1 Create `packages/worker-enrichment/src/services/llm.ts` with `getModel()` factory returning `ChatOpenRouter` configured via `ENRICHMENT_MODEL` env var (default: `google/gemini-2.0-flash-001`)
- [x] 2.2 Implement `enrichContent(content: string, contentType: string)` using `withStructuredOutput(zodSchema)` with the enrichment Zod schema (summary, entities, topics, tags)
- [x] 2.3 Handle empty/whitespace content by returning null summary and empty arrays without calling the LLM
- [x] 2.4 Write unit tests for `llm.ts` (mock `ChatOpenRouter`, test empty content path, test structured output wiring)

## 3. YouTubeService Extensions

- [x] 3.1 Add `classifyYouTubeUrl(url: string)` returning `{ type: "video" | "channel" | "playlist", id: string }` with all URL pattern matching (video, shorts, embed, channel handle/ID/custom, playlist)
- [x] 3.2 Add `getChannelByHandle(handle: string)` method calling the channels endpoint with `forHandle` parameter
- [x] 3.3 Add playlist types (`YouTubePlaylistResource`, `YouTubePlaylistListResponse`, `YouTubePlaylistItemResource`, `YouTubePlaylistItemListResponse`)
- [x] 3.4 Add `getPlaylist(id: string)` method calling `/playlists` endpoint with `snippet,contentDetails` parts
- [x] 3.5 Add `getPlaylistItems(playlistId: string, maxResults?: number)` method calling `/playlistItems` endpoint
- [x] 3.6 Write unit tests for `classifyYouTubeUrl` covering all URL patterns (video, shorts, embed, channel handle/ID/custom/user, playlist, ambiguous `watch?v=&list=`, unrecognized)
- [x] 3.7 Write unit tests for `getChannelByHandle`, `getPlaylist`, and `getPlaylistItems` (mock API responses)

## 4. YouTube Enrichment Node

- [x] 4.1 Implement video enrichment path: load transcript via `YoutubeLoader`, fetch video metadata via `YouTubeService.getVideo()`, build content string, call `enrichContent()`, populate metadata fields
- [x] 4.2 Implement transcript fallback: catch transcript load errors, fall back to title + description enrichment, set `transcriptAvailable: "false"` in metadata
- [x] 4.3 Add transcript truncation to configurable max character limit before LLM call
- [x] 4.4 Implement channel enrichment path: classify URL, resolve handle if needed via `getChannelByHandle()`, fetch channel metadata, call `enrichContent()` with channel description, populate metadata fields
- [x] 4.5 Implement playlist enrichment path: fetch playlist metadata via `getPlaylist()`, fetch item titles via `getPlaylistItems()`, call `enrichContent()` with combined content, populate metadata fields
- [x] 4.6 Wire up `youtubeNode` to use `classifyYouTubeUrl` for routing and call the appropriate enrichment path
- [x] 4.7 Write unit tests for `youtubeNode` covering all three paths (video with transcript, video fallback, channel, playlist) with mocked services
- [x] 4.8 Write integration-style test for `youtubeNode` error handling (API failure, LLM failure)

## 5. Build & Verification

- [x] 5.1 Run `pnpm --filter @brain-feed/worker-enrichment build` and fix any type errors
- [x] 5.2 Run all worker-enrichment tests and ensure they pass
- [x] 5.3 Run `pnpm lint` from root and fix any lint issues
