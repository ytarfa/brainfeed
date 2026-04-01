## Purpose

GitHub REST API client -- handles authentication, HTTP requests with timeout, error mapping, and provides typed methods for fetching repository, README, issue, and pull request data.

## Requirements

### Requirement: GitHubService constructor and authentication

`GitHubService` SHALL be a standalone class that accepts a token parameter for authentication. It SHALL send the token as a Bearer token in the `Authorization` header on every request.

#### Scenario: Construction with token

- **WHEN** `new GitHubService(token)` is called with a valid token string
- **THEN** the instance SHALL be created and all subsequent API requests SHALL include `Authorization: Bearer {token}` and `Accept: application/vnd.github.v3+json` headers

#### Scenario: Construction without token

- **WHEN** `new GitHubService()` is called without a token or with an empty string
- **THEN** it SHALL throw an error indicating that a GitHub token is required

### Requirement: HTTP request handling

`GitHubService` SHALL make GET requests to `https://api.github.com` with timeout and error handling.

#### Scenario: Successful API request

- **WHEN** a GET request to the GitHub API returns a 2xx response
- **THEN** the service SHALL parse and return the JSON response body

#### Scenario: Request timeout

- **WHEN** a request does not complete within 10 seconds
- **THEN** the service SHALL abort the request and throw an error

#### Scenario: API error response (4xx/5xx)

- **WHEN** the GitHub API returns a non-2xx response
- **THEN** the service SHALL throw a `GitHubApiError` containing the HTTP status code, the error message from the response body, and the request URL

#### Scenario: Rate limit response

- **WHEN** the GitHub API returns a 403 with a rate-limit exceeded message
- **THEN** the service SHALL throw a `GitHubApiError` with status 403 and a message indicating rate limiting

### Requirement: Get repository metadata

`GitHubService` SHALL provide a `getRepo(owner: string, repo: string)` method.

#### Scenario: Successful repo fetch

- **WHEN** `getRepo("owner", "repo")` is called for a public repository
- **THEN** it SHALL call `GET /repos/{owner}/{repo}` and return the repository object containing at minimum: `full_name`, `description`, `language`, `stargazers_count`, `forks_count`, `open_issues_count`, `license`, `topics`, `created_at`, `pushed_at`, `homepage`, and `default_branch`

#### Scenario: Repo not found

- **WHEN** `getRepo()` is called for a non-existent or private repository
- **THEN** it SHALL throw a `GitHubApiError` with status 404

### Requirement: Get repository README

`GitHubService` SHALL provide a `getReadme(owner: string, repo: string)` method that fetches the raw README content as plain text.

#### Scenario: Successful README fetch

- **WHEN** `getReadme("owner", "repo")` is called and the repository has a README
- **THEN** it SHALL call `GET /repos/{owner}/{repo}/readme` with `Accept: application/vnd.github.v3.raw` header and return the raw text content

#### Scenario: README not found

- **WHEN** `getReadme()` is called for a repository without a README
- **THEN** it SHALL throw a `GitHubApiError` with status 404

### Requirement: Get issue

`GitHubService` SHALL provide a `getIssue(owner: string, repo: string, number: number)` method.

#### Scenario: Successful issue fetch

- **WHEN** `getIssue("owner", "repo", 123)` is called for an existing issue
- **THEN** it SHALL call `GET /repos/{owner}/{repo}/issues/{number}` and return the issue object containing at minimum: `title`, `body`, `state`, `labels`, `user`, `created_at`, `comments`, and `pull_request` (if present)

#### Scenario: Issue not found

- **WHEN** `getIssue()` is called for a non-existent issue
- **THEN** it SHALL throw a `GitHubApiError` with status 404

### Requirement: Get pull request

`GitHubService` SHALL provide a `getPull(owner: string, repo: string, number: number)` method.

#### Scenario: Successful PR fetch

- **WHEN** `getPull("owner", "repo", 42)` is called for an existing pull request
- **THEN** it SHALL call `GET /repos/{owner}/{repo}/pulls/{number}` and return the PR object containing at minimum: `title`, `body`, `state`, `merged`, `labels`, `user`, `created_at`, `additions`, `deletions`, and `changed_files`

#### Scenario: PR not found

- **WHEN** `getPull()` is called for a non-existent pull request
- **THEN** it SHALL throw a `GitHubApiError` with status 404

### Requirement: GitHubApiError type

`GitHubService` SHALL define a `GitHubApiError` class for API errors.

#### Scenario: GitHubApiError properties

- **WHEN** a `GitHubApiError` is created
- **THEN** it SHALL have `status` (number), `message` (string), and `url` (string) properties

#### Scenario: GitHubApiError extends ExternalServiceError

- **WHEN** a `GitHubApiError` is thrown
- **THEN** it SHALL extend `ExternalServiceError` from `@brain-feed/error-types` with `statusCode: 502` and context containing `{ githubStatus, url }`
