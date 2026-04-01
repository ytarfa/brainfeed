## Why

GitHub bookmarks currently pass through enrichment as a stub, returning empty data with no summary, entities, topics, or tags. This means GitHub repos, issues, and PRs saved by users get no AI-generated insights -- unlike YouTube and article bookmarks which produce rich summaries and metadata. GitHub is a primary content source for the target audience, so this gap needs to be filled.

## What Changes

- Implement a `GitHubService` API client that communicates with the GitHub REST API using token-based authentication (`GITHUB_TOKEN` env var, 5K requests/hour)
- Implement full `githubNode` enrichment logic with three sub-type paths: **repo**, **issue**, and **PR** -- analogous to YouTube's video/channel/playlist sub-types
- Repo enrichment fetches repository metadata + README (truncated to ~80K chars), sends to LLM for summarization
- Issue enrichment fetches issue metadata (title, body, state, labels), sends to LLM
- PR enrichment fetches pull request metadata (title, body, state, merge status, diff stats), sends to LLM
- README fetch failure degrades gracefully (enrich from description/stats only)
- All other API failures (404, rate limit, network) cause enrichment to fail with BullMQ retry
- Array metadata values (labels, topics) are serialized as comma-separated strings to fit the existing `Record<string, string | number>` metadata type

## Capabilities

### New Capabilities

- `github-enrichment`: GitHub-specific enrichment pipeline -- URL classification, API data fetching, LLM summarization, and metadata extraction for repos, issues, and PRs
- `github-api-service`: GitHub REST API client -- authentication, rate limiting awareness, endpoint methods for repos, READMEs, issues, and pull requests

### Modified Capabilities

- `enrichment-worker`: The graph node routing for `"github"` changes from a stub returning empty data to a full enrichment implementation

## Impact

- **New files**: `packages/worker-enrichment/src/services/github-service.ts`, test files for the service and node
- **Modified files**: `packages/worker-enrichment/src/enrichment-graph.ts` (replace `githubNode` stub)
- **Environment**: Requires `GITHUB_TOKEN` env var in worker deployment (Railway)
- **Dependencies**: No new npm dependencies -- uses native `fetch` for HTTP calls
- **APIs**: GitHub REST API v3 (`api.github.com`) -- authenticated at 5,000 requests/hour per token
