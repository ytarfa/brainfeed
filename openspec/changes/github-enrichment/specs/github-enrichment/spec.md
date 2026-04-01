## Purpose

GitHub-specific enrichment logic -- URL classification into sub-types (repo, issue, PR), data fetching via the GitHub REST API, LLM summarization, and metadata extraction.

## Requirements

### Requirement: GitHub URL classification

The enrichment pipeline SHALL classify GitHub URLs into exactly three types: `"repo"`, `"issue"`, or `"pr"`. Classification SHALL be performed by a static `classifyGitHubUrl(url: string)` method in `GitHubService`.

#### Scenario: Repository URL

- **WHEN** the URL matches `github.com/{owner}/{repo}` with no further path segments (or only trailing slash)
- **THEN** it SHALL be classified as `"repo"` and `owner` and `repo` SHALL be extracted

#### Scenario: Issue URL

- **WHEN** the URL matches `github.com/{owner}/{repo}/issues/{number}`
- **THEN** it SHALL be classified as `"issue"` and `owner`, `repo`, and `number` SHALL be extracted

#### Scenario: Pull request URL

- **WHEN** the URL matches `github.com/{owner}/{repo}/pull/{number}`
- **THEN** it SHALL be classified as `"issue"` type `"pr"` and `owner`, `repo`, and `number` SHALL be extracted

#### Scenario: Deep link fallback to repo

- **WHEN** the URL matches `github.com/{owner}/{repo}/blob/...`, `github.com/{owner}/{repo}/tree/...`, `github.com/{owner}/{repo}/releases/...`, `github.com/{owner}/{repo}/discussions/...`, or any other sub-path under a repo
- **THEN** it SHALL be classified as `"repo"` and `owner` and `repo` SHALL be extracted from the first two path segments

#### Scenario: Owner-only URL fallback

- **WHEN** the URL matches `github.com/{owner}` with no repo path
- **THEN** classification SHALL return `null` (cannot enrich a user/org profile page)

#### Scenario: Bare github.com URL

- **WHEN** the URL is `github.com` with no path or only a slash
- **THEN** classification SHALL return `null`

### Requirement: Repository enrichment

The GitHub enrichment node SHALL fetch repository metadata and README content, send them to the LLM for summarization, and produce a populated `EnrichedData` object.

#### Scenario: Full repo enrichment with README

- **WHEN** a repo URL is processed and both the repo API call and README fetch succeed
- **THEN** the node SHALL send a prompt containing the repo's full name, description, primary language, star/fork counts, topics, license, and the truncated README text to the LLM via `enrichContent()`
- **AND** the node SHALL return `EnrichedData` with LLM-generated `summary`, `entities`, `topics`, `tags`, and structured metadata

#### Scenario: Repo metadata fields

- **WHEN** a repo is successfully enriched
- **THEN** `metadata` SHALL include: `githubType` (`"repo"`), `owner`, `repo`, `language`, `stars`, `forks`, `license`, `topics` (comma-separated string), `openIssues`, `createdAt`, `pushedAt`, `homepage` (if present), and `readmeAvailable` (`"true"` or `"false"`)

#### Scenario: README unavailable

- **WHEN** the README fetch fails (404 or network error) but the repo metadata fetch succeeds
- **THEN** the node SHALL enrich from the repo description, language, topics, and stats only
- **AND** `metadata.readmeAvailable` SHALL be `"false"`

#### Scenario: README truncation

- **WHEN** the fetched README text exceeds the configured maximum character limit (default 80,000)
- **THEN** the README SHALL be truncated at a word boundary before being sent to the LLM

#### Scenario: Repo API failure

- **WHEN** the repo metadata API call fails (404, 403, network error)
- **THEN** the node SHALL re-throw the error for the processor to mark enrichment as `"failed"`

### Requirement: Issue enrichment

The GitHub enrichment node SHALL fetch issue metadata, send it to the LLM for summarization, and produce a populated `EnrichedData` object.

#### Scenario: Full issue enrichment

- **WHEN** an issue URL is processed and the API call succeeds
- **THEN** the node SHALL send a prompt containing the issue title, repository (`owner/repo`), state, labels, author, creation date, and body to the LLM via `enrichContent()`
- **AND** the node SHALL return `EnrichedData` with LLM-generated `summary`, `entities`, `topics`, `tags`, and structured metadata

#### Scenario: Issue metadata fields

- **WHEN** an issue is successfully enriched
- **THEN** `metadata` SHALL include: `githubType` (`"issue"`), `owner`, `repo`, `issueNumber`, `state` (`"open"` or `"closed"`), `labels` (comma-separated string), `author`, `createdAt`, and `commentsCount`

#### Scenario: Issue with empty body

- **WHEN** the issue body is `null` or empty
- **THEN** the node SHALL still call the LLM using the title, repo context, labels, and state as input

#### Scenario: Issue API failure

- **WHEN** the issue API call fails
- **THEN** the node SHALL re-throw the error for the processor to mark enrichment as `"failed"`

### Requirement: Pull request enrichment

The GitHub enrichment node SHALL fetch pull request metadata, send it to the LLM for summarization, and produce a populated `EnrichedData` object.

#### Scenario: Full PR enrichment

- **WHEN** a PR URL is processed and the API call succeeds
- **THEN** the node SHALL send a prompt containing the PR title, repository, state, merge status, labels, author, and body to the LLM via `enrichContent()`
- **AND** the node SHALL return `EnrichedData` with LLM-generated `summary`, `entities`, `topics`, `tags`, and structured metadata

#### Scenario: PR metadata fields

- **WHEN** a PR is successfully enriched
- **THEN** `metadata` SHALL include: `githubType` (`"pr"`), `owner`, `repo`, `prNumber`, `state` (`"open"` or `"closed"`), `merged` (`"true"` or `"false"`), `labels` (comma-separated string), `author`, `additions`, `deletions`, `changedFiles`, and `createdAt`

#### Scenario: PR with empty body

- **WHEN** the PR body is `null` or empty
- **THEN** the node SHALL still call the LLM using the title, repo context, labels, state, and merge status as input

#### Scenario: PR API failure

- **WHEN** the PR API call fails
- **THEN** the node SHALL re-throw the error for the processor to mark enrichment as `"failed"`

### Requirement: Null classification handling

The GitHub enrichment node SHALL handle cases where URL classification returns `null`.

#### Scenario: Unclassifiable GitHub URL

- **WHEN** `classifyGitHubUrl()` returns `null` for a GitHub URL (e.g., bare `github.com`, user profile page)
- **THEN** the node SHALL return an `EnrichedData` object with `summary: null`, empty arrays for `entities`, `topics`, and `tags`, and `metadata: null`
