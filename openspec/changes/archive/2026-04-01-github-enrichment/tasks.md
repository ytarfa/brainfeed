## 1. GitHubService API Client

- [x] 1.1 Create `packages/worker-enrichment/src/services/github-service.ts` with `GitHubService` class: constructor accepting token, `Authorization: Bearer` header, `Accept: application/vnd.github.v3+json`, 10s timeout via AbortController
- [x] 1.2 Implement `GitHubApiError` extending `ExternalServiceError` from `@brain-feed/error-types` with `status`, `url`, and context properties
- [x] 1.3 Implement private `get<T>(path)` method: builds URL from `https://api.github.com` + path, handles timeout, parses JSON, maps error responses to `GitHubApiError`
- [x] 1.4 Implement `getRepo(owner, repo)` method calling `GET /repos/{owner}/{repo}`
- [x] 1.5 Implement `getReadme(owner, repo)` method calling `GET /repos/{owner}/{repo}/readme` with `Accept: application/vnd.github.v3.raw` to get raw text
- [x] 1.6 Implement `getIssue(owner, repo, number)` method calling `GET /repos/{owner}/{repo}/issues/{number}`
- [x] 1.7 Implement `getPull(owner, repo, number)` method calling `GET /repos/{owner}/{repo}/pulls/{number}`
- [x] 1.8 Implement static `classifyGitHubUrl(url)` method: parse URL, classify as `"repo"`, `"issue"`, or `"pr"` with extracted `owner`, `repo`, and optional `number`; return `null` for bare/owner-only URLs
- [x] 1.9 Create `packages/worker-enrichment/src/__tests__/github-service.test.ts` with unit tests: constructor validation, all API methods (success + 404 + timeout), `classifyGitHubUrl` for all URL patterns (repo, issue, PR, deep links, fallbacks, null cases), `GitHubApiError` shape
- [x] 1.10 Run tests and verify all pass

## 2. GitHub Enrichment Node

- [x] 2.1 Implement `enrichRepo()` helper in `enrichment-graph.ts`: fetch repo metadata + README (parallel, README failure graceful), build LLM prompt with repo context + truncated README, call `enrichContent()`, assemble metadata object with all repo fields
- [x] 2.2 Implement `enrichIssue()` helper: fetch issue via `getIssue()`, build LLM prompt with title/repo/state/labels/author/body, call `enrichContent()`, assemble metadata with issue fields (labels as comma-separated string)
- [x] 2.3 Implement `enrichPR()` helper: fetch PR via `getPull()`, build LLM prompt with title/repo/state/merged/labels/author/body, call `enrichContent()`, assemble metadata with PR fields (labels as comma-separated, additions/deletions/changedFiles)
- [x] 2.4 Replace stub `githubNode` with full implementation: call `classifyGitHubUrl()`, branch to `enrichRepo`/`enrichIssue`/`enrichPR`, return `emptyEnrichedData()` for null classification
- [x] 2.5 Instantiate `GitHubService` in `githubNode` using `GITHUB_TOKEN` env var
- [x] 2.6 Implement README truncation using the same truncation pattern as article content (word-boundary truncation at 80K chars, configurable via env)
- [x] 2.7 Create `packages/worker-enrichment/src/__tests__/github-node.test.ts` with unit tests: repo enrichment (with/without README), issue enrichment (with/without body), PR enrichment, null classification, API failures re-thrown, README failure graceful degradation, graph integration test routing GitHub URLs to the node
- [x] 2.8 Run all enrichment tests (`github-node`, `github-service`, and existing tests) and verify no regressions

## 3. Integration and Deployment

- [x] 3.1 Add `GITHUB_TOKEN` to the worker's environment configuration documentation or Railway env vars
- [x] 3.2 Run the full worker-enrichment test suite to verify no regressions across all enrichment types
- [x] 3.3 Verify the build passes: `pnpm --filter @brain-feed/worker-enrichment build` (or equivalent tsc check)
