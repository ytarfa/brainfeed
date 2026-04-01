/**
 * GitHub REST API service.
 *
 * Handles token authentication, HTTP requests with timeout, error mapping,
 * and provides typed methods for fetching repository, README, issue, and
 * pull request data.
 *
 * Usage:
 *   const gh = new GitHubService(process.env.GITHUB_TOKEN!);
 *   const repo = await gh.getRepo("owner", "repo");
 */

import { ExternalServiceError } from "@brain-feed/error-types";

const BASE_URL = "https://api.github.com";
const DEFAULT_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class GitHubApiError extends ExternalServiceError {
  /** HTTP status from the GitHub API response (0 for network errors). */
  public readonly status: number;
  /** The request URL that triggered the error. */
  public readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message, {
      githubStatus: status,
      url,
    });
    this.name = "GitHubApiError";
    this.status = status;
    this.url = url;
  }
}

// ---------------------------------------------------------------------------
// Response types (subset of GitHub API fields we need)
// ---------------------------------------------------------------------------

export interface GitHubRepoResponse {
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: { spdx_id: string; name: string } | null;
  topics: string[];
  created_at: string;
  pushed_at: string;
  homepage: string | null;
  default_branch: string;
}

export interface GitHubIssueResponse {
  title: string;
  body: string | null;
  state: string;
  labels: { name: string }[];
  user: { login: string } | null;
  created_at: string;
  comments: number;
  pull_request?: { url: string };
}

export interface GitHubPullResponse {
  title: string;
  body: string | null;
  state: string;
  merged: boolean;
  labels: { name: string }[];
  user: { login: string } | null;
  created_at: string;
  additions: number;
  deletions: number;
  changed_files: number;
}

// ---------------------------------------------------------------------------
// URL classification
// ---------------------------------------------------------------------------

export type GitHubUrlType = "repo" | "issue" | "pr";

export interface GitHubUrlClassification {
  type: GitHubUrlType;
  owner: string;
  repo: string;
  number?: number;
}

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

export class GitHubService {
  private readonly token: string;

  /**
   * @param token GitHub personal access token or GitHub App installation token.
   * @throws {Error} if token is empty or not provided.
   */
  constructor(token: string) {
    if (!token) {
      throw new Error(
        "GitHubService: A GitHub token is required. " +
        "Set the GITHUB_TOKEN environment variable.",
      );
    }
    this.token = token;
  }

  // -------------------------------------------------------------------------
  // Public API methods
  // -------------------------------------------------------------------------

  /** Fetch repository metadata. */
  async getRepo(owner: string, repo: string): Promise<GitHubRepoResponse> {
    return this.get<GitHubRepoResponse>(`/repos/${owner}/${repo}`);
  }

  /** Fetch the raw README content as plain text. */
  async getReadme(owner: string, repo: string): Promise<string> {
    return this.getRaw(`/repos/${owner}/${repo}/readme`);
  }

  /** Fetch issue metadata. */
  async getIssue(
    owner: string,
    repo: string,
    number: number,
  ): Promise<GitHubIssueResponse> {
    return this.get<GitHubIssueResponse>(
      `/repos/${owner}/${repo}/issues/${number}`,
    );
  }

  /** Fetch pull request metadata. */
  async getPull(
    owner: string,
    repo: string,
    number: number,
  ): Promise<GitHubPullResponse> {
    return this.get<GitHubPullResponse>(
      `/repos/${owner}/${repo}/pulls/${number}`,
    );
  }

  // -------------------------------------------------------------------------
  // URL classification (static)
  // -------------------------------------------------------------------------

  /**
   * Classify a GitHub URL into a sub-type: repo, issue, or PR.
   *
   * Returns `null` for:
   * - bare `github.com` (no path)
   * - owner-only URLs (`github.com/{owner}`)
   * - non-github.com URLs
   */
  static classifyGitHubUrl(url: string): GitHubUrlClassification | null {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }

    if (
      parsed.hostname !== "github.com" &&
      parsed.hostname !== "www.github.com"
    ) {
      return null;
    }

    // Split path into segments, filter out empty strings
    const segments = parsed.pathname.split("/").filter(Boolean);

    // Need at least owner + repo (2 segments)
    if (segments.length < 2) {
      return null;
    }

    const owner = segments[0];
    const repo = segments[1];

    // Check for issue URL: /owner/repo/issues/{number}
    if (
      segments.length >= 4 &&
      segments[2] === "issues" &&
      /^\d+$/.test(segments[3])
    ) {
      return {
        type: "issue",
        owner,
        repo,
        number: parseInt(segments[3], 10),
      };
    }

    // Check for PR URL: /owner/repo/pull/{number}
    if (
      segments.length >= 4 &&
      segments[2] === "pull" &&
      /^\d+$/.test(segments[3])
    ) {
      return {
        type: "pr",
        owner,
        repo,
        number: parseInt(segments[3], 10),
      };
    }

    // Everything else with owner + repo falls back to repo
    // (blob, tree, releases, discussions, wiki, settings, etc.)
    return { type: "repo", owner, repo };
  }

  // -------------------------------------------------------------------------
  // Private HTTP helpers
  // -------------------------------------------------------------------------

  /** GET request returning parsed JSON. */
  private async get<T>(path: string): Promise<T> {
    const url = `${BASE_URL}${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        const body = await this.parseErrorBody(response);
        throw new GitHubApiError(
          body ?? `HTTP ${response.status} ${response.statusText}`,
          response.status,
          url,
        );
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof GitHubApiError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new GitHubApiError(
        `GitHub API request failed: ${message}`,
        0,
        url,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /** GET request returning raw text (for README). */
  private async getRaw(path: string): Promise<string> {
    const url = `${BASE_URL}${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github.v3.raw",
        },
      });

      if (!response.ok) {
        const body = await this.parseErrorBody(response);
        throw new GitHubApiError(
          body ?? `HTTP ${response.status} ${response.statusText}`,
          response.status,
          url,
        );
      }

      return await response.text();
    } catch (err) {
      if (err instanceof GitHubApiError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new GitHubApiError(
        `GitHub API request failed: ${message}`,
        0,
        url,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Extract error message from a non-2xx JSON response body. */
  private async parseErrorBody(response: Response): Promise<string | null> {
    try {
      const body = (await response.json()) as { message?: string };
      return body.message ?? null;
    } catch {
      return null;
    }
  }
}
