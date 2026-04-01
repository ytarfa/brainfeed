## Context

The enrichment worker uses a LangGraph StateGraph to route bookmarks through content-type-specific enrichment nodes. YouTube and article nodes are fully implemented with API data fetching, LLM summarization, and structured metadata extraction. The GitHub node is currently a stub returning empty `EnrichedData`.

The backend already detects GitHub URLs via `GitHubHandler` (extracts `owner/repo`, constructs OG thumbnail), and routes them with `source_type: "github"`. The enrichment graph correctly routes these to `githubNode` -- only the node's implementation is missing.

GitHub bookmarks are a primary content type for the target audience. Users bookmark repos, issues, and PRs, and currently get no AI-generated summaries or tags for them.

## Goals / Non-Goals

**Goals:**

- Implement full GitHub enrichment for three URL sub-types: repos, issues, and pull requests
- Produce LLM-generated summaries, entities, topics, and tags for all GitHub bookmark types
- Extract structured metadata (stars, language, labels, state, etc.) into the `EnrichedData.metadata` field
- Follow the same graceful degradation patterns established by YouTube and article enrichment
- Use token-based authentication for the GitHub REST API (5,000 req/hr per token)

**Non-Goals:**

- User-level GitHub OAuth integration (Phase 2 -- when GitHub login is added to the app)
- Private repository access (requires user OAuth tokens)
- Enrichment for non-core GitHub URL types (discussions, releases, wiki, gists) beyond repo-level fallback
- Fetching issue/PR comments (body is sufficient for enrichment)
- Expanding the `EnrichedData.metadata` type to support arrays (serialize as comma-separated strings instead)

## Decisions

### 1. GitHub REST API over HTML scraping

**Choice:** Use the GitHub REST API (`api.github.com`) for all data fetching.

**Alternatives considered:**
- *Readability-style scraping* -- Would lose structured metadata (stars, labels, state). Would need to be thrown away when OAuth arrives for private repos. Rejected.
- *GraphQL API* -- More flexible but adds complexity. REST API provides all needed data with simple GET endpoints. Not needed yet.

**Rationale:** The REST API provides structured, typed data (stars, labels, language, state, merge status) that HTML scraping can't reliably extract. It also shares the same auth mechanism that Phase 2 user OAuth will use -- the `GitHubService` constructor takes a `token` parameter, so switching from app token to user token requires zero rework on enrichment logic.

### 2. Standalone `GitHubService` class (no shared base with GoogleApiService)

**Choice:** `GitHubService` is a standalone class with its own HTTP, auth, timeout, and error handling.

**Alternatives considered:**
- *Extend `GoogleApiService`* -- Auth mechanism differs (Bearer token vs query param). Base class name implies Google. Misleading inheritance.
- *Extract generic `ApiService` base* -- Premature abstraction for two services. Can be done later if more API services emerge.

**Rationale:** GitHub and Google APIs have different auth patterns (header Bearer token vs `?key=` query param) and different error response shapes. A standalone class is cleaner than forcing a shared abstraction that doesn't naturally fit.

### 3. App-level `GITHUB_TOKEN` for Phase 1 auth

**Choice:** Single `GITHUB_TOKEN` environment variable (PAT or GitHub App installation token), shared across all enrichment requests.

**Alternatives considered:**
- *Unauthenticated requests* -- Only 60 req/hr. Insufficient for any meaningful usage.
- *User OAuth tokens now* -- Requires GitHub OAuth login flow, which doesn't exist yet.

**Rationale:** 5,000 req/hr is sufficient for Phase 1. Phase 2 will pass user OAuth tokens: `new GitHubService(userOAuthToken ?? process.env.GITHUB_TOKEN)` -- the enrichment logic stays identical.

### 4. Three sub-type paths: repo, issue, PR

**Choice:** Classify GitHub URLs into `repo`, `issue`, or `pr` and fetch type-specific data for each.

**Rationale:** Mirrors YouTube's video/channel/playlist pattern. Each sub-type has meaningfully different data (README vs issue body vs PR diff stats) that warrants separate API calls and LLM prompts. Deep links (blob, tree, releases, discussions) fall back to repo-level enrichment by extracting `owner/repo`.

### 5. Always call LLM (no thin enrichment path for GitHub)

**Choice:** Always invoke `enrichContent()` for all GitHub sub-types, even when issue/PR body is empty.

**Alternatives considered:**
- *Skip LLM for empty bodies* -- Like article's thin enrichment for no-content pages.

**Rationale:** Unlike articles where "no content" means Readability truly extracted nothing, GitHub items always have a title, repo context, labels, and state. The LLM can produce useful summaries from this structured context even without a body.

### 6. Graceful README failure, hard failure for everything else

**Choice:** If README fetch fails (404, error) but repo metadata succeeded, enrich from description/stats only. All other API failures (repo 404, rate limit, network) re-throw for BullMQ retry.

**Rationale:** Many repos don't have READMEs. A repo is still enrichable from its description, language, topics, and stats. But if we can't even fetch the repo metadata, there's nothing meaningful to enrich.

### 7. Comma-separated serialization for array metadata

**Choice:** Labels, topics, and assignees are serialized as comma-separated strings in the `metadata` field.

**Alternatives considered:**
- *Expand `EnrichedData.metadata` type to `Record<string, string | number | string[]>`* -- Breaking change across the types package, DB schema, and all consumers.

**Rationale:** Minimal change. The metadata field is primarily for display, not for programmatic filtering. If array support is needed later, the type can be expanded in a separate change.

## Risks / Trade-offs

- **Rate limiting (5K req/hr shared)** -- All enrichment jobs share one token's rate limit. A burst of GitHub bookmarks could exhaust it. → Mitigation: BullMQ's retry with exponential backoff handles 403 rate-limit responses naturally. Monitor usage in Phase 1; Phase 2 user tokens distribute the load.

- **README size** -- Some READMEs are very large (monorepo docs, API references). → Mitigation: Truncate to 80K chars (same limit as articles/transcripts) at a word boundary before sending to LLM.

- **No private repo support** -- Users bookmarking private repos will get "failed" enrichment. → Mitigation: Acceptable for Phase 1. Phase 2 OAuth enables private access. Could show a specific message in the UI indicating auth is needed.

- **GitHub API changes** -- REST API v3 is stable but endpoints could change. → Mitigation: Pin to `Accept: application/vnd.github.v3+json` header. Service layer isolates API details from enrichment logic.
