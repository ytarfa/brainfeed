import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// Mocks — must be set up before importing the module under test
// ---------------------------------------------------------------------------

// Mock enrichContent
const mockEnrichContent = vi.fn();
vi.mock("../services/llm", () => ({
  enrichContent: (...args: unknown[]) => mockEnrichContent(...args),
}));

// Mock GitHubService (instance methods)
const mockGetRepo = vi.fn();
const mockGetReadme = vi.fn();
const mockGetIssue = vi.fn();
const mockGetPull = vi.fn();

vi.mock("../services/github-service", async () => {
  const actual = await vi.importActual<
    typeof import("../services/github-service")
  >("../services/github-service");

  const MockGitHubService = vi.fn().mockImplementation(() => ({
    getRepo: mockGetRepo,
    getReadme: mockGetReadme,
    getIssue: mockGetIssue,
    getPull: mockGetPull,
  }));

  // Copy over static methods from the real class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (MockGitHubService as any).classifyGitHubUrl =
    actual.GitHubService.classifyGitHubUrl;

  return {
    ...actual,
    GitHubService: MockGitHubService,
  };
});

// Mock YoutubeLoader (needed because enrichment-graph.ts imports it)
vi.mock("@langchain/community/document_loaders/web/youtube", () => ({
  YoutubeLoader: {
    createFromUrl: vi.fn(() => ({
      load: vi.fn(),
    })),
  },
}));

// Mock YouTubeService to prevent GOOGLE_API_KEY requirement
vi.mock("../services/youtube-service", async () => {
  const actual = await vi.importActual<
    typeof import("../services/youtube-service")
  >("../services/youtube-service");
  const MockYouTubeService = vi.fn().mockImplementation(() => ({}));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (MockYouTubeService as any).classifyYouTubeUrl =
    actual.YouTubeService.classifyYouTubeUrl;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (MockYouTubeService as any).extractVideoId =
    actual.YouTubeService.extractVideoId;
  return { ...actual, YouTubeService: MockYouTubeService };
});

// Now import module under test
import {
  _enrichRepo as enrichRepo,
  _enrichIssue as enrichIssue,
  _enrichPR as enrichPR,
  _githubNode as githubNode,
  _truncateReadme as truncateReadme,
  enrichmentGraph,
} from "../enrichment-graph";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBookmark(
  overrides: Partial<BookmarkForProcessing> = {},
): BookmarkForProcessing {
  return {
    id: "bk-gh-test",
    url: "https://github.com/facebook/react",
    title: "React",
    content_type: "link",
    source_type: "github",
    raw_content: null,
    ...overrides,
  };
}

const defaultLLMResult = {
  summary: "A test summary.",
  entities: [{ name: "React", type: "library" }],
  topics: ["javascript", "frontend"],
  tags: ["react", "ui", "javascript"],
};

function mockRepoResponse(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

function mockIssueResponse(overrides: Record<string, unknown> = {}) {
  return {
    title: "Bug: useEffect cleanup not called",
    body: "When using useEffect with a cleanup function, the cleanup is not invoked.",
    state: "open",
    labels: [{ name: "bug" }, { name: "react-core" }],
    user: { login: "reporter123" },
    created_at: "2024-01-10T08:00:00Z",
    comments: 5,
    ...overrides,
  };
}

function mockPullResponse(overrides: Record<string, unknown> = {}) {
  return {
    title: "Fix useEffect cleanup timing",
    body: "This PR fixes the cleanup timing issue described in #123.",
    state: "closed",
    merged: true,
    labels: [{ name: "bug" }, { name: "CLA Signed" }],
    user: { login: "contributor456" },
    created_at: "2024-01-12T10:00:00Z",
    additions: 42,
    deletions: 15,
    changed_files: 3,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests: truncateReadme
// ---------------------------------------------------------------------------

describe("truncateReadme", () => {
  it("returns text unchanged when under the limit", () => {
    expect(truncateReadme("short text", 100)).toBe("short text");
  });

  it("truncates at word boundary and appends marker", () => {
    const text = "word ".repeat(20000); // ~100K chars
    const result = truncateReadme(text, 1000);
    expect(result.length).toBeLessThanOrEqual(1000 + "\n[Content truncated]".length);
    expect(result).toContain("[Content truncated]");
  });

  it("handles exact boundary", () => {
    const exact = "a".repeat(100);
    expect(truncateReadme(exact, 100)).toBe(exact);
  });
});

// ---------------------------------------------------------------------------
// Tests: enrichRepo
// ---------------------------------------------------------------------------

describe("enrichRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = "ghp_test123";
    mockEnrichContent.mockResolvedValue(defaultLLMResult);
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  it("enriches a repo with README and full metadata", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse());
    mockGetReadme.mockResolvedValue("# React\n\nA JavaScript library for building user interfaces.");

    const result = await enrichRepo("facebook", "react");

    // Verify enrichContent was called
    expect(mockEnrichContent).toHaveBeenCalledTimes(1);
    const [content, contentType] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Repository: facebook/react");
    expect(content).toContain("The library for web and native user interfaces.");
    expect(content).toContain("Primary Language: JavaScript");
    expect(content).toContain("Stars: 220000");
    expect(content).toContain("Forks: 45000");
    expect(content).toContain("Topics: javascript, frontend, react, ui");
    expect(content).toContain("License: MIT");
    expect(content).toContain("# React");
    expect(contentType).toBe("GitHub repository");

    // Verify result structure
    expect(result.summary).toBe("A test summary.");
    expect(result.entities).toEqual([{ name: "React", type: "library" }]);
    expect(result.topics).toEqual(["javascript", "frontend"]);
    expect(result.tags).toEqual(["react", "ui", "javascript"]);
    expect(result.processedAt).toBeDefined();

    // Verify metadata
    const meta = result.metadata!;
    expect(meta.githubType).toBe("repo");
    expect(meta.owner).toBe("facebook");
    expect(meta.repo).toBe("react");
    expect(meta.language).toBe("JavaScript");
    expect(meta.stars).toBe(220000);
    expect(meta.forks).toBe(45000);
    expect(meta.openIssues).toBe(1200);
    expect(meta.license).toBe("MIT");
    expect(meta.topics).toBe("javascript,frontend,react,ui");
    expect(meta.createdAt).toBe("2013-05-24T16:15:54Z");
    expect(meta.pushedAt).toBe("2024-01-15T12:00:00Z");
    expect(meta.homepage).toBe("https://react.dev");
    expect(meta.readmeAvailable).toBe("true");
  });

  it("enriches a repo without README (graceful degradation)", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse());
    mockGetReadme.mockRejectedValue(new Error("Not Found"));

    const result = await enrichRepo("facebook", "react");

    // LLM should still be called
    expect(mockEnrichContent).toHaveBeenCalledTimes(1);
    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Repository: facebook/react");
    expect(content).not.toContain("README:");

    expect(result.metadata!.readmeAvailable).toBe("false");
    expect(result.summary).toBe("A test summary.");
  });

  it("handles repo with no language", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse({ language: null }));
    mockGetReadme.mockResolvedValue("# Docs\n\nA documentation repo.");

    const result = await enrichRepo("owner", "docs");

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).not.toContain("Primary Language:");

    expect(result.metadata!.language).toBeUndefined();
  });

  it("handles repo with no license", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse({ license: null }));
    mockGetReadme.mockResolvedValue("# Test");

    const result = await enrichRepo("owner", "unlicensed");

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).not.toContain("License:");

    expect(result.metadata!.license).toBeUndefined();
  });

  it("handles repo with no topics", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse({ topics: [] }));
    mockGetReadme.mockResolvedValue("# Test");

    const result = await enrichRepo("owner", "no-topics");

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).not.toContain("Topics:");

    expect(result.metadata!.topics).toBeUndefined();
  });

  it("handles repo with no homepage", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse({ homepage: null }));
    mockGetReadme.mockResolvedValue("# Test");

    const result = await enrichRepo("owner", "no-homepage");

    expect(result.metadata!.homepage).toBeUndefined();
  });

  it("re-throws when repo API fails", async () => {
    mockGetRepo.mockRejectedValue(new Error("Not Found"));
    mockGetReadme.mockResolvedValue("# Test");

    await expect(enrichRepo("nonexistent", "repo")).rejects.toThrow("Not Found");
  });

  it("sets summary to null when LLM returns empty string", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse());
    mockGetReadme.mockResolvedValue("# Test");
    mockEnrichContent.mockResolvedValue({ ...defaultLLMResult, summary: "" });

    const result = await enrichRepo("owner", "repo");

    expect(result.summary).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: enrichIssue
// ---------------------------------------------------------------------------

describe("enrichIssue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = "ghp_test123";
    mockEnrichContent.mockResolvedValue(defaultLLMResult);
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  it("enriches an issue with full metadata", async () => {
    mockGetIssue.mockResolvedValue(mockIssueResponse());

    const result = await enrichIssue("facebook", "react", 12345);

    expect(mockEnrichContent).toHaveBeenCalledTimes(1);
    const [content, contentType] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Issue: Bug: useEffect cleanup not called");
    expect(content).toContain("Repository: facebook/react");
    expect(content).toContain("State: open");
    expect(content).toContain("Author: reporter123");
    expect(content).toContain("Labels: bug, react-core");
    expect(content).toContain("When using useEffect");
    expect(contentType).toBe("GitHub issue");

    const meta = result.metadata!;
    expect(meta.githubType).toBe("issue");
    expect(meta.owner).toBe("facebook");
    expect(meta.repo).toBe("react");
    expect(meta.issueNumber).toBe(12345);
    expect(meta.state).toBe("open");
    expect(meta.labels).toBe("bug,react-core");
    expect(meta.author).toBe("reporter123");
    expect(meta.commentsCount).toBe(5);
    expect(meta.createdAt).toBe("2024-01-10T08:00:00Z");
  });

  it("enriches an issue with empty body", async () => {
    mockGetIssue.mockResolvedValue(mockIssueResponse({ body: null }));

    const result = await enrichIssue("facebook", "react", 100);

    // LLM should still be called with title and context
    expect(mockEnrichContent).toHaveBeenCalledTimes(1);
    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Issue: Bug: useEffect cleanup not called");
    expect(content).not.toContain("Body:");

    expect(result.summary).toBe("A test summary.");
  });

  it("handles issue with no labels", async () => {
    mockGetIssue.mockResolvedValue(mockIssueResponse({ labels: [] }));

    const result = await enrichIssue("owner", "repo", 1);

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).not.toContain("Labels:");

    expect(result.metadata!.labels).toBeUndefined();
  });

  it("handles issue with no user", async () => {
    mockGetIssue.mockResolvedValue(mockIssueResponse({ user: null }));

    const result = await enrichIssue("owner", "repo", 1);

    expect(result.metadata!.author).toBe("unknown");
  });

  it("re-throws when issue API fails", async () => {
    mockGetIssue.mockRejectedValue(new Error("Not Found"));

    await expect(enrichIssue("owner", "repo", 99999)).rejects.toThrow(
      "Not Found",
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: enrichPR
// ---------------------------------------------------------------------------

describe("enrichPR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = "ghp_test123";
    mockEnrichContent.mockResolvedValue(defaultLLMResult);
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  it("enriches a PR with full metadata", async () => {
    mockGetPull.mockResolvedValue(mockPullResponse());

    const result = await enrichPR("facebook", "react", 42);

    expect(mockEnrichContent).toHaveBeenCalledTimes(1);
    const [content, contentType] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("Pull Request: Fix useEffect cleanup timing");
    expect(content).toContain("Repository: facebook/react");
    expect(content).toContain("State: closed");
    expect(content).toContain("Merged: yes");
    expect(content).toContain("Author: contributor456");
    expect(content).toContain("Labels: bug, CLA Signed");
    expect(content).toContain("Changes: +42 -15 in 3 files");
    expect(content).toContain("This PR fixes the cleanup timing issue");
    expect(contentType).toBe("GitHub pull request");

    const meta = result.metadata!;
    expect(meta.githubType).toBe("pr");
    expect(meta.owner).toBe("facebook");
    expect(meta.repo).toBe("react");
    expect(meta.prNumber).toBe(42);
    expect(meta.state).toBe("closed");
    expect(meta.merged).toBe("true");
    expect(meta.labels).toBe("bug,CLA Signed");
    expect(meta.author).toBe("contributor456");
    expect(meta.additions).toBe(42);
    expect(meta.deletions).toBe(15);
    expect(meta.changedFiles).toBe(3);
    expect(meta.createdAt).toBe("2024-01-12T10:00:00Z");
  });

  it("enriches an open, unmerged PR", async () => {
    mockGetPull.mockResolvedValue(
      mockPullResponse({ state: "open", merged: false }),
    );

    const result = await enrichPR("owner", "repo", 10);

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).toContain("State: open");
    expect(content).toContain("Merged: no");

    expect(result.metadata!.state).toBe("open");
    expect(result.metadata!.merged).toBe("false");
  });

  it("enriches a PR with empty body", async () => {
    mockGetPull.mockResolvedValue(mockPullResponse({ body: null }));

    const result = await enrichPR("owner", "repo", 10);

    expect(mockEnrichContent).toHaveBeenCalledTimes(1);
    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).not.toContain("Body:");

    expect(result.summary).toBe("A test summary.");
  });

  it("handles PR with no labels", async () => {
    mockGetPull.mockResolvedValue(mockPullResponse({ labels: [] }));

    const result = await enrichPR("owner", "repo", 10);

    const [content] = mockEnrichContent.mock.calls[0];
    expect(content).not.toContain("Labels:");

    expect(result.metadata!.labels).toBeUndefined();
  });

  it("handles PR with no user", async () => {
    mockGetPull.mockResolvedValue(mockPullResponse({ user: null }));

    const result = await enrichPR("owner", "repo", 10);

    expect(result.metadata!.author).toBe("unknown");
  });

  it("re-throws when PR API fails", async () => {
    mockGetPull.mockRejectedValue(new Error("Not Found"));

    await expect(enrichPR("owner", "repo", 99999)).rejects.toThrow(
      "Not Found",
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: githubNode
// ---------------------------------------------------------------------------

describe("githubNode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = "ghp_test123";
    mockEnrichContent.mockResolvedValue(defaultLLMResult);
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  it("routes repo URL to enrichRepo", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse());
    mockGetReadme.mockResolvedValue("# React");

    const result = await githubNode({
      bookmark: makeBookmark({ url: "https://github.com/facebook/react" }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.githubType).toBe("repo");
    expect(mockGetRepo).toHaveBeenCalled();
  });

  it("routes issue URL to enrichIssue", async () => {
    mockGetIssue.mockResolvedValue(mockIssueResponse());

    const result = await githubNode({
      bookmark: makeBookmark({
        url: "https://github.com/facebook/react/issues/12345",
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.githubType).toBe("issue");
    expect(mockGetIssue).toHaveBeenCalled();
  });

  it("routes PR URL to enrichPR", async () => {
    mockGetPull.mockResolvedValue(mockPullResponse());

    const result = await githubNode({
      bookmark: makeBookmark({
        url: "https://github.com/facebook/react/pull/42",
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.githubType).toBe("pr");
    expect(mockGetPull).toHaveBeenCalled();
  });

  it("routes deep link URL to enrichRepo (fallback)", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse());
    mockGetReadme.mockResolvedValue("# React");

    const result = await githubNode({
      bookmark: makeBookmark({
        url: "https://github.com/facebook/react/blob/main/README.md",
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.githubType).toBe("repo");
  });

  it("returns empty enriched data for null classification (owner-only URL)", async () => {
    const result = await githubNode({
      bookmark: makeBookmark({ url: "https://github.com/facebook" }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.summary).toBeNull();
    expect(result.result!.entities).toEqual([]);
    expect(result.result!.metadata).toBeNull();
    expect(mockEnrichContent).not.toHaveBeenCalled();
  });

  it("returns empty enriched data for bare github.com", async () => {
    const result = await githubNode({
      bookmark: makeBookmark({ url: "https://github.com" }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.summary).toBeNull();
    expect(result.result!.metadata).toBeNull();
    expect(mockEnrichContent).not.toHaveBeenCalled();
  });

  it("re-throws API errors (repo not found)", async () => {
    mockGetRepo.mockRejectedValue(new Error("Not Found"));
    mockGetReadme.mockResolvedValue("# Test");

    await expect(
      githubNode({
        bookmark: makeBookmark({
          url: "https://github.com/nonexistent/repo",
        }),
        result: null,
      }),
    ).rejects.toThrow("Not Found");
  });

  it("throws when GITHUB_TOKEN is missing", async () => {
    delete process.env.GITHUB_TOKEN;

    await expect(
      githubNode({
        bookmark: makeBookmark({
          url: "https://github.com/facebook/react",
        }),
        result: null,
      }),
    ).rejects.toThrow("GITHUB_TOKEN");
  });
});

// ---------------------------------------------------------------------------
// Tests: Graph integration (routing GitHub URLs through the enrichment graph)
// ---------------------------------------------------------------------------

describe("githubNode via enrichmentGraph", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = "ghp_test123";
    mockEnrichContent.mockResolvedValue(defaultLLMResult);
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  it("routes a GitHub repo URL through the graph", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse());
    mockGetReadme.mockResolvedValue("# React");

    const result = await enrichmentGraph.invoke({
      bookmark: makeBookmark({
        url: "https://github.com/facebook/react",
        source_type: "github",
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.githubType).toBe("repo");
    expect(result.result!.summary).toBe("A test summary.");
  });

  it("routes a GitHub issue URL through the graph", async () => {
    mockGetIssue.mockResolvedValue(mockIssueResponse());

    const result = await enrichmentGraph.invoke({
      bookmark: makeBookmark({
        url: "https://github.com/facebook/react/issues/12345",
        source_type: "github",
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.githubType).toBe("issue");
    expect(result.result!.metadata!.issueNumber).toBe(12345);
  });

  it("routes a GitHub PR URL through the graph", async () => {
    mockGetPull.mockResolvedValue(mockPullResponse());

    const result = await enrichmentGraph.invoke({
      bookmark: makeBookmark({
        url: "https://github.com/facebook/react/pull/42",
        source_type: "github",
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.githubType).toBe("pr");
    expect(result.result!.metadata!.prNumber).toBe(42);
  });

  it("routes a GitHub URL via URL detection when source_type is null", async () => {
    mockGetRepo.mockResolvedValue(mockRepoResponse());
    mockGetReadme.mockResolvedValue("# React");

    const result = await enrichmentGraph.invoke({
      bookmark: makeBookmark({
        url: "https://github.com/facebook/react",
        source_type: null,
      }),
      result: null,
    });

    expect(result.result).toBeDefined();
    expect(result.result!.metadata!.githubType).toBe("repo");
  });
});
