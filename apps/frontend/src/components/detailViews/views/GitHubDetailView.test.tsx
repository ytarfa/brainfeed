import React from "react";
import { render, screen } from "@testing-library/react";
import GitHubDetailView from "./GitHubDetailView";
import type { Bookmark } from "@brain-feed/types";

function createGitHubBookmark(
  githubType: "repo" | "issue" | "pr",
  metadataOverrides: Record<string, string | number> = {},
  bookmarkOverrides: Partial<Bookmark> = {},
): Bookmark {
  const base: Partial<Bookmark> = {
    id: "bk-gh-1",
    user_id: "user-1",
    url: "https://github.com/owner/repo",
    title: "Test GitHub Bookmark",
    description: "A test description",
    notes: "Some notes",
    thumbnail_url: "https://opengraph.githubassets.com/1/owner/repo",
    content_type: "link",
    source_type: "github",
    tags: [{ id: "t1", label: "open-source" }],
    raw_content: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    spaceId: "space-1",
    domain: "github.com",
    summary: "A test summary",
    savedAt: "5 min ago",
    enrichment_status: "completed",
    enriched_data: {
      summary: "AI-generated summary of this GitHub content.",
      entities: [{ name: "TypeScript", type: "LANGUAGE" }],
      topics: ["open-source"],
      tags: ["github", "code"],
      metadata: {
        githubType,
        owner: "testowner",
        repo: "testrepo",
        ...metadataOverrides,
      },
      processedAt: "2024-01-01T00:00:00Z",
    },
    ...bookmarkOverrides,
  };

  return base as Bookmark;
}

describe("GitHubDetailView", () => {
  describe("Repository sub-type", () => {
    it("renders owner/repo identity and title", () => {
      const bk = createGitHubBookmark("repo", {
        stars: 12500,
        forks: 1200,
        language: "TypeScript",
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("testowner")).toBeInTheDocument();
      expect(screen.getByText("Test GitHub Bookmark")).toBeInTheDocument();
    });

    it("renders formatted star count", () => {
      const bk = createGitHubBookmark("repo", { stars: 62400 });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("62,400")).toBeInTheDocument();
    });

    it("renders formatted fork count", () => {
      const bk = createGitHubBookmark("repo", { forks: 3800 });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("3,800")).toBeInTheDocument();
    });

    it("renders primary language", () => {
      const bk = createGitHubBookmark("repo", { language: "Rust" });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("Rust")).toBeInTheDocument();
    });

    it("renders license", () => {
      const bk = createGitHubBookmark("repo", { license: "MIT" });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("MIT")).toBeInTheDocument();
    });

    it("gracefully omits missing fields", () => {
      const bk = createGitHubBookmark("repo", { stars: 100 });
      render(<GitHubDetailView bookmark={bk} />);

      // Should render stars but not crash on missing language/license
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.queryByText("undefined")).not.toBeInTheDocument();
    });

    it("renders topic pills from metadata.topics", () => {
      const bk = createGitHubBookmark("repo", {
        topics: "react,typescript,ui",
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getByText("typescript")).toBeInTheDocument();
      expect(screen.getByText("ui")).toBeInTheDocument();
    });

    it("renders description", () => {
      const bk = createGitHubBookmark("repo", {}, { description: "A cool library for building UIs" });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("A cool library for building UIs")).toBeInTheDocument();
    });
  });

  describe("Issue sub-type", () => {
    it("renders issue number and title", () => {
      const bk = createGitHubBookmark("issue", {
        issueNumber: 42,
        state: "open",
        author: "octocat",
        commentsCount: 7,
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("#42")).toBeInTheDocument();
      expect(screen.getByText("Test GitHub Bookmark")).toBeInTheDocument();
    });

    it("renders open state indicator", () => {
      const bk = createGitHubBookmark("issue", { state: "open" });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("Open")).toBeInTheDocument();
    });

    it("renders closed state indicator", () => {
      const bk = createGitHubBookmark("issue", { state: "closed" });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("Closed")).toBeInTheDocument();
    });

    it("renders author name", () => {
      const bk = createGitHubBookmark("issue", {
        state: "open",
        author: "octocat",
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("octocat")).toBeInTheDocument();
    });

    it("renders comment count", () => {
      const bk = createGitHubBookmark("issue", {
        state: "open",
        commentsCount: 15,
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("renders labels as pills", () => {
      const bk = createGitHubBookmark("issue", {
        state: "open",
        labels: "bug,high-priority",
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("bug")).toBeInTheDocument();
      expect(screen.getByText("high-priority")).toBeInTheDocument();
    });
  });

  describe("Pull Request sub-type", () => {
    it("renders PR number and title", () => {
      const bk = createGitHubBookmark("pr", {
        prNumber: 123,
        state: "open",
        merged: "false",
        author: "contributor",
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("#123")).toBeInTheDocument();
      expect(screen.getByText("Test GitHub Bookmark")).toBeInTheDocument();
    });

    it("renders merged state indicator", () => {
      const bk = createGitHubBookmark("pr", {
        state: "closed",
        merged: "true",
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("Merged")).toBeInTheDocument();
    });

    it("renders open state for non-merged PR", () => {
      const bk = createGitHubBookmark("pr", {
        state: "open",
        merged: "false",
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("Open")).toBeInTheDocument();
    });

    it("renders closed (not merged) state", () => {
      const bk = createGitHubBookmark("pr", {
        state: "closed",
        merged: "false",
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("Closed")).toBeInTheDocument();
    });

    it("renders diff stats (additions, deletions, changed files)", () => {
      const bk = createGitHubBookmark("pr", {
        state: "open",
        merged: "false",
        additions: 1234,
        deletions: 567,
        changedFiles: 42,
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("1,234")).toBeInTheDocument();
      expect(screen.getByText("567")).toBeInTheDocument();
      expect(screen.getByText("42 files")).toBeInTheDocument();
    });

    it("renders PR labels", () => {
      const bk = createGitHubBookmark("pr", {
        state: "open",
        merged: "false",
        labels: "enhancement,needs-review",
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("enhancement")).toBeInTheDocument();
      expect(screen.getByText("needs-review")).toBeInTheDocument();
    });

    it("renders author for PR", () => {
      const bk = createGitHubBookmark("pr", {
        state: "open",
        merged: "false",
        author: "contributor",
      });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("contributor")).toBeInTheDocument();
    });
  });

  describe("Shared components", () => {
    it("renders AI summary from enriched_data", () => {
      const bk = createGitHubBookmark("repo", { stars: 100 });
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("AI-generated summary of this GitHub content.")).toBeInTheDocument();
      expect(screen.getByText("AI Summary")).toBeInTheDocument();
    });

    it("renders tags section", () => {
      const bk = createGitHubBookmark("repo", {});
      render(<GitHubDetailView bookmark={bk} />);

      // "open-source" appears in both Topics (enriched_data.topics) and Tags (bookmark.tags)
      const matches = screen.getAllByText("open-source");
      expect(matches.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("+ Add tag")).toBeInTheDocument();
    });

    it("renders notes textarea", () => {
      const bk = createGitHubBookmark("repo", {});
      render(<GitHubDetailView bookmark={bk} />);

      const textarea = screen.getByPlaceholderText("Add a note...");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue("Some notes");
    });

    it("renders space when spaceName provided", () => {
      const bk = createGitHubBookmark("repo", {});
      render(<GitHubDetailView bookmark={bk} spaceName="Dev Tools" spaceColor="#2A8A62" />);

      expect(screen.getByText("Dev Tools")).toBeInTheDocument();
    });

    it("renders 'Open on GitHub' footer link", () => {
      const bk = createGitHubBookmark("repo", {});
      render(<GitHubDetailView bookmark={bk} />);

      const link = screen.getByText("Open on GitHub");
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", "https://github.com/owner/repo");
    });

    it("renders domain and savedAt context", () => {
      const bk = createGitHubBookmark("repo", {});
      render(<GitHubDetailView bookmark={bk} />);

      expect(screen.getByText("github.com")).toBeInTheDocument();
      expect(screen.getByText("5 min ago")).toBeInTheDocument();
    });
  });

  describe("No hero image", () => {
    it("does not render an img element even with thumbnail_url", () => {
      const bk = createGitHubBookmark("repo", { stars: 100 });
      const { container } = render(<GitHubDetailView bookmark={bk} />);

      expect(container.querySelector("img")).not.toBeInTheDocument();
    });
  });
});
