## Why

Instagram posts and reels are a common bookmark type with no enrichment support today. Users who save Instagram content get no AI summary, no tags, and no structured metadata. Adding Instagram enrichment closes this gap for a major social platform.

## What Changes

- Add a new `InstagramHandler` in the backend URL handler registry to detect and classify Instagram post/reel URLs at ingest time
- Add a new `instagram` route and graph node in the enrichment worker's LangGraph pipeline
- Add an `InstagramService` that fetches Instagram pages with a Googlebot User-Agent, parses SSR-rendered HTML for embedded caption data, media type, and metadata
- Send extracted caption text to the LLM for summary, entities, topics, and tags generation
- Fail enrichment when Instagram does not serve an SSR-rendered page (no graceful degradation — binary success or failure)
- Add `"instagram"` to the `SourceType` union and database `source_type` constraint

## Capabilities

### New Capabilities
- `instagram-enrichment`: Instagram-specific enrichment logic — URL classification for posts and reels, SSR HTML parsing for caption and metadata extraction, and LLM summarization of Instagram content

### Modified Capabilities
- `enrichment-worker`: Add `"instagram"` as an enrichment route in route resolution, add `instagramNode` to the LangGraph state graph
- `url-handler-registry`: Add `InstagramHandler` to the handler chain (before Article handler) with Instagram URL detection

## Impact

- **Backend**: New `instagramHandler.ts` in `apps/backend/src/services/urlHandlers/`, registry handler order updated
- **Worker**: New `instagram-service.ts` in `packages/worker-enrichment/src/services/`, new node in `enrichment-graph.ts`
- **Types**: `SourceType` union in `packages/types/src/app.types.ts` gains `"instagram"`
- **Database**: New migration adding `"instagram"` to `source_type` CHECK constraint
- **OG Fetcher**: Instagram-specific requests need Googlebot UA, may require changes to `OgFetcher` or a separate fetch path in the Instagram service
- **No new external dependencies or API keys required**
