import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  GitHubService,
  GitHubApiError,
  type GitHubRepoResponse,
  type GitHubIssueResponse,
  type GitHubPullResponse,
} from "../services/github-service";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockRepoResponse: GitHubRepoResponse = {
  full_name: "facebook/react",
  description: "The library for web and native user interfaces.",
  language: "JavaScript",
  stargazers_count: 220000,
  forks_count: 45000,
  open_issues_count: 1200,
  license: { spdx_id: "MIT", name: "MIT License" },
  topics: ["javascript", "frontend", "react", "ui"],
  created_at: "2013-05-24T16:15:54Z",
  pushed_at: "2024-01-15T12:00:00Z",
  homepage: "https://react.dev",
  default_branch: "main",
};

const mockIssueResponse: GitHubIssueResponse = {
  title: "Bug: useEffect cleanup not called",
  body: "When using useEffect with a cleanup function...",
  state: "open",
  labels: [{ name: "bug" }, { name: "react-core" }],
  user: { login: "reporter123" },
  created_at: "2024-01-10T08:00:00Z",
  comments: 5,
};

const mockPullResponse: GitHubPullResponse = {
  title: "Fix useEffect cleanup timing",
  body: "This PR fixes the cleanup timing issue...",
  state: "closed",
  merged: true,
  labels: [{ name: "bug" }, { name: "CLA Signed" }],
  user: { login: "contributor456" },
  created_at: "2024-01-12T10:00:00Z",
  additions: 42,
  deletions: 15,
  changed_files: 3,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GitHubService", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  // -----------------------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------------------

  describe("constructor", () => {
    it("throws if token is empty", () => {
      expect(() => new GitHubService("")).toThrow("GitHub token is required");
    });

    it("throws if token is not provided", () => {
      expect(() => new GitHubService(undefined as unknown as string)).toThrow(
        "GitHub token is required",
      );
    });

    it("accepts a valid token", () => {
      const service = new GitHubService("ghp_test123");
      expect(service).toBeInstanceOf(GitHubService);
    });
  });

  // -----------------------------------------------------------------------
  // getRepo
  // -----------------------------------------------------------------------

  describe("getRepo()", () => {
    it("fetches repo metadata and returns it", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRepoResponse),
      });

      const service = new GitHubService("ghp_test123");
      const result = await service.getRepo("facebook", "react");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe("https://api.github.com/repos/facebook/react");

      const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
      expect(
        (calledOptions.headers as Record<string, string>)["Authorization"],
      ).toBe("Bearer ghp_test123");
      expect(
        (calledOptions.headers as Record<string, string>)["Accept"],
      ).toBe("application/vnd.github.v3+json");

      expect(result.full_name).toBe("facebook/react");
      expect(result.stargazers_count).toBe(220000);
    });

    it("throws GitHubApiError on 404", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ message: "Not Found" }),
      });

      const service = new GitHubService("ghp_test123");

      try {
        await service.getRepo("nonexistent", "repo");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        const apiErr = err as GitHubApiError;
        expect(apiErr.status).toBe(404);
        expect(apiErr.message).toBe("Not Found");
        expect(apiErr.url).toBe(
          "https://api.github.com/repos/nonexistent/repo",
        );
      }
    });
  });

  // -----------------------------------------------------------------------
  // getReadme
  // -----------------------------------------------------------------------

  describe("getReadme()", () => {
    it("fetches raw README content as text", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# React\n\nA JavaScript library..."),
      });

      const service = new GitHubService("ghp_test123");
      const result = await service.getReadme("facebook", "react");

      expect(result).toBe("# React\n\nA JavaScript library...");

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe(
        "https://api.github.com/repos/facebook/react/readme",
      );

      const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
      expect(
        (calledOptions.headers as Record<string, string>)["Accept"],
      ).toBe("application/vnd.github.v3.raw");
    });

    it("throws GitHubApiError on 404 (no README)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ message: "Not Found" }),
      });

      const service = new GitHubService("ghp_test123");

      try {
        await service.getReadme("owner", "no-readme-repo");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        expect((err as GitHubApiError).status).toBe(404);
      }
    });
  });

  // -----------------------------------------------------------------------
  // getIssue
  // -----------------------------------------------------------------------

  describe("getIssue()", () => {
    it("fetches issue metadata and returns it", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockIssueResponse),
      });

      const service = new GitHubService("ghp_test123");
      const result = await service.getIssue("facebook", "react", 12345);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe(
        "https://api.github.com/repos/facebook/react/issues/12345",
      );

      expect(result.title).toBe("Bug: useEffect cleanup not called");
      expect(result.state).toBe("open");
      expect(result.labels).toHaveLength(2);
    });

    it("throws GitHubApiError on 404", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ message: "Not Found" }),
      });

      const service = new GitHubService("ghp_test123");

      try {
        await service.getIssue("owner", "repo", 99999);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        expect((err as GitHubApiError).status).toBe(404);
      }
    });
  });

  // -----------------------------------------------------------------------
  // getPull
  // -----------------------------------------------------------------------

  describe("getPull()", () => {
    it("fetches PR metadata and returns it", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPullResponse),
      });

      const service = new GitHubService("ghp_test123");
      const result = await service.getPull("facebook", "react", 42);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe(
        "https://api.github.com/repos/facebook/react/pulls/42",
      );

      expect(result.title).toBe("Fix useEffect cleanup timing");
      expect(result.state).toBe("closed");
      expect(result.merged).toBe(true);
      expect(result.additions).toBe(42);
      expect(result.deletions).toBe(15);
      expect(result.changed_files).toBe(3);
    });

    it("throws GitHubApiError on 404", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ message: "Not Found" }),
      });

      const service = new GitHubService("ghp_test123");

      try {
        await service.getPull("owner", "repo", 99999);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        expect((err as GitHubApiError).status).toBe(404);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe("error handling", () => {
    it("throws GitHubApiError on rate limit (403)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: () =>
          Promise.resolve({
            message: "API rate limit exceeded for installation.",
          }),
      });

      const service = new GitHubService("ghp_test123");

      try {
        await service.getRepo("owner", "repo");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        const apiErr = err as GitHubApiError;
        expect(apiErr.status).toBe(403);
        expect(apiErr.message).toContain("rate limit");
      }
    });

    it("throws GitHubApiError with fallback message when response body is not JSON", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("not json")),
      });

      const service = new GitHubService("ghp_test123");

      try {
        await service.getRepo("owner", "repo");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        const apiErr = err as GitHubApiError;
        expect(apiErr.status).toBe(500);
        expect(apiErr.message).toContain("500");
      }
    });

    it("throws GitHubApiError on network failure", async () => {
      mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

      const service = new GitHubService("ghp_test123");

      try {
        await service.getRepo("owner", "repo");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        const apiErr = err as GitHubApiError;
        expect(apiErr.status).toBe(0);
        expect(apiErr.message).toContain("ECONNREFUSED");
      }
    });

    it("includes AbortSignal for timeout", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRepoResponse),
      });

      const service = new GitHubService("ghp_test123");
      await service.getRepo("owner", "repo");

      const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
      expect(calledOptions.signal).toBeInstanceOf(AbortSignal);
    });

    it("GitHubApiError extends ExternalServiceError with correct properties", () => {
      const err = new GitHubApiError(
        "Not Found",
        404,
        "https://api.github.com/repos/owner/repo",
      );

      expect(err.name).toBe("GitHubApiError");
      expect(err.status).toBe(404);
      expect(err.url).toBe("https://api.github.com/repos/owner/repo");
      expect(err.statusCode).toBe(502); // ExternalServiceError statusCode
      expect(err.code).toBe("EXTERNAL_SERVICE_ERROR");
      expect(err.isOperational).toBe(true);
      expect(err.context).toEqual({
        githubStatus: 404,
        url: "https://api.github.com/repos/owner/repo",
      });
    });
  });

  // -----------------------------------------------------------------------
  // classifyGitHubUrl
  // -----------------------------------------------------------------------

  describe("classifyGitHubUrl()", () => {
    // Repo URLs
    it("classifies owner/repo URL as repo", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    it("classifies owner/repo URL with trailing slash as repo", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    it("classifies www.github.com URL as repo", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://www.github.com/facebook/react",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    // Issue URLs
    it("classifies issue URL", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/issues/12345",
      );
      expect(result).toEqual({
        type: "issue",
        owner: "facebook",
        repo: "react",
        number: 12345,
      });
    });

    // PR URLs
    it("classifies pull request URL", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/pull/42",
      );
      expect(result).toEqual({
        type: "pr",
        owner: "facebook",
        repo: "react",
        number: 42,
      });
    });

    // Deep links fall back to repo
    it("classifies blob URL as repo (deep link fallback)", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/blob/main/README.md",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    it("classifies tree URL as repo (deep link fallback)", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/tree/main/packages",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    it("classifies releases URL as repo (deep link fallback)", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/releases/tag/v18.2.0",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    it("classifies discussions URL as repo (deep link fallback)", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/discussions/123",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    it("classifies wiki URL as repo (deep link fallback)", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/wiki/Contributing",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    it("classifies settings URL as repo (deep link fallback)", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/settings",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    // Non-numeric issue/PR numbers fall back to repo
    it("classifies non-numeric issue path as repo", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/issues",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    it("classifies non-numeric pull path as repo", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook/react/pull",
      );
      expect(result).toEqual({ type: "repo", owner: "facebook", repo: "react" });
    });

    // Null cases
    it("returns null for owner-only URL", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://github.com/facebook",
      );
      expect(result).toBeNull();
    });

    it("returns null for bare github.com", () => {
      const result = GitHubService.classifyGitHubUrl("https://github.com");
      expect(result).toBeNull();
    });

    it("returns null for bare github.com with trailing slash", () => {
      const result = GitHubService.classifyGitHubUrl("https://github.com/");
      expect(result).toBeNull();
    });

    it("returns null for non-github.com URL", () => {
      const result = GitHubService.classifyGitHubUrl(
        "https://gitlab.com/owner/repo",
      );
      expect(result).toBeNull();
    });

    it("returns null for invalid URL", () => {
      const result = GitHubService.classifyGitHubUrl("not-a-url");
      expect(result).toBeNull();
    });
  });
});
