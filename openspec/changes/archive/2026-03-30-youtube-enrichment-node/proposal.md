## Why

The YouTube enrichment node is currently a stub that returns empty data. Users who bookmark YouTube videos, channels, or playlists get no summary, topics, or tags — making YouTube bookmarks significantly less useful than they should be. YouTube is one of the three first-class source types, so implementing its enrichment is a critical next step after the routing infrastructure was established.

## What Changes

- **URL classification**: Add logic to distinguish between YouTube video, channel, and playlist URLs within the `youtubeNode`.
- **Video enrichment**: Load video transcripts via `@langchain/community` `YoutubeLoader` + fetch metadata via YouTube Data API, then generate a structured summary/topics/tags via LLM (OpenRouter).
- **Channel enrichment**: Resolve channel handles to IDs, fetch channel metadata via YouTube Data API, and generate enrichment via LLM.
- **Playlist enrichment**: Add playlist support to `YouTubeService` (new types + methods), fetch playlist metadata + item titles, and generate enrichment via LLM.
- **LLM utility**: Create a shared `enrichContent()` function using `ChatOpenRouter` with Zod structured output, reusable by other enrichment nodes later.
- **Fallback handling**: If transcript loading fails for a video, fall back to description-only enrichment rather than returning empty data.
- **New dependencies**: `@langchain/community` and `youtubei.js` for transcript extraction.

## Capabilities

### New Capabilities
- `youtube-enrichment`: YouTube-specific enrichment logic — URL classification, transcript loading, metadata fetching, and LLM summarization for video/channel/playlist URLs.
- `llm-enrichment`: Shared LLM utility for generating structured `EnrichedData` from content via OpenRouter, reusable across all enrichment nodes.

### Modified Capabilities
- `enrichment-worker`: The YouTube pipeline node transitions from a stub returning empty data to a fully functional enrichment node. The "Enrichment pipeline stub" requirement is superseded for the YouTube route.

## Impact

- **Packages modified**: `packages/worker-enrichment` (node implementation, new service methods, new LLM utility), `packages/worker-enrichment/package.json` (new deps)
- **Services extended**: `YouTubeService` gains `classifyUrl()`, `resolveChannelId()`, and playlist methods
- **New files**: `src/services/llm.ts` (LLM factory + enrichment function)
- **Dependencies added**: `@langchain/community`, `youtubei.js`
- **Environment variables**: `ENRICHMENT_MODEL` (optional, configurable LLM model name) — `OPENROUTER_API_KEY` and `GOOGLE_API_KEY` already exist
- **API quota**: YouTube Data API usage increases (video/channel/playlist metadata calls); transcript loading uses `youtubei.js` (no API quota)
