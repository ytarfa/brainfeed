import React from "react";
import { render, screen } from "@testing-library/react";
import ArticleDetailView from "./ArticleDetailView";
import type { Bookmark } from "@brain-feed/types";

function createArticleBookmark(
  metadataOverrides: Record<string, string | number> = {},
  bookmarkOverrides: Partial<Bookmark> = {},
): Bookmark {
  const base: Partial<Bookmark> = {
    id: "bk-art-1",
    user_id: "user-1",
    url: "https://example.com/great-article",
    title: "How to Build Scalable Systems",
    description: "A deep dive into system architecture",
    notes: "My article notes",
    thumbnail_url: "https://example.com/hero.jpg",
    content_type: "link",
    source_type: "article",
    tags: [{ id: "t1", label: "architecture" }, { id: "t2", label: "engineering" }],
    raw_content: null,
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2024-06-01T00:00:00Z",
    spaceId: "space-1",
    domain: "example.com",
    summary: "A fallback summary",
    savedAt: "2 hours ago",
    enrichment_status: "completed",
    enriched_data: {
      summary: "AI-generated summary of this article about scalable systems.",
      entities: [{ name: "Kubernetes", type: "TECHNOLOGY" }],
      topics: ["distributed-systems", "scalability"],
      tags: ["architecture", "engineering"],
      metadata: {
        title: "How to Build Scalable Systems",
        author: "Jane Doe",
        siteName: "Tech Insights",
        publishedAt: "2024-05-15T10:00:00Z",
        language: "en",
        ogImage: "https://example.com/og.jpg",
        wordCount: 2400,
        readingTimeMinutes: 11,
        ...metadataOverrides,
      },
      processedAt: "2024-06-01T00:00:00Z",
    },
    ...bookmarkOverrides,
  };

  return base as Bookmark;
}

describe("ArticleDetailView", () => {
  describe("Full metadata", () => {
    it("renders hero image from thumbnail_url", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      const img = document.querySelector("img");
      expect(img).toBeTruthy();
      expect(img!.getAttribute("src")).toBe("https://example.com/hero.jpg");
    });

    it("renders article title", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("How to Build Scalable Systems")).toBeInTheDocument();
    });

    it("renders site name", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("Tech Insights")).toBeInTheDocument();
    });

    it("renders author with 'by' prefix", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("by Jane Doe")).toBeInTheDocument();
    });

    it("renders reading time", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("11 min read")).toBeInTheDocument();
    });

    it("renders word count", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("2,400 words")).toBeInTheDocument();
    });

    it("renders published date formatted", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      // "Published May 15, 2024"
      expect(screen.getByText(/Published May 15, 2024/)).toBeInTheDocument();
    });

    it("renders language badge", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("en")).toBeInTheDocument();
    });

    it("renders Article type badge", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("Article")).toBeInTheDocument();
    });
  });

  describe("Partial metadata", () => {
    it("omits author gracefully when missing", () => {
      const bk = createArticleBookmark({}, {
        enriched_data: {
          ...createArticleBookmark().enriched_data!,
          metadata: {
            siteName: "Tech Insights",
            readingTimeMinutes: 11,
            wordCount: 2400,
          },
        },
      });
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("Tech Insights")).toBeInTheDocument();
      expect(screen.getByText("11 min read")).toBeInTheDocument();
      expect(screen.queryByText(/by /)).not.toBeInTheDocument();
    });

    it("omits reading time gracefully when missing", () => {
      const bk = createArticleBookmark({}, {
        enriched_data: {
          ...createArticleBookmark().enriched_data!,
          metadata: {
            author: "Jane Doe",
            siteName: "Tech Insights",
            wordCount: 2400,
          },
        },
      });
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("by Jane Doe")).toBeInTheDocument();
      expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
    });

    it("omits site name gracefully when missing", () => {
      const bk = createArticleBookmark({}, {
        enriched_data: {
          ...createArticleBookmark().enriched_data!,
          metadata: {
            author: "Jane Doe",
            readingTimeMinutes: 8,
          },
        },
      });
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("by Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("8 min read")).toBeInTheDocument();
      expect(screen.queryByText("Tech Insights")).not.toBeInTheDocument();
    });
  });

  describe("Hero image fallback", () => {
    it("uses ogImage when thumbnail_url is absent", () => {
      const bk = createArticleBookmark({}, { thumbnail_url: null });
      render(<ArticleDetailView bookmark={bk} />);

      const img = document.querySelector("img");
      expect(img).toBeTruthy();
      expect(img!.getAttribute("src")).toBe("https://example.com/og.jpg");
    });

    it("renders ThumbnailPlaceholder when no image at all", () => {
      const bk = createArticleBookmark({}, {
        thumbnail_url: null,
        enriched_data: {
          ...createArticleBookmark().enriched_data!,
          metadata: {
            author: "Jane Doe",
            readingTimeMinutes: 5,
          },
        },
      });
      render(<ArticleDetailView bookmark={bk} />);

      // No <img> element; placeholder renders an SVG
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      // ThumbnailPlaceholder renders SVG elements
      const svgs = document.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe("Shared components", () => {
    it("renders AI summary", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("AI-generated summary of this article about scalable systems.")).toBeInTheDocument();
    });

    it("renders tags", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("architecture")).toBeInTheDocument();
      expect(screen.getByText("engineering")).toBeInTheDocument();
    });

    it("renders notes textarea", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      const textarea = screen.getByDisplayValue("My article notes");
      expect(textarea).toBeInTheDocument();
    });

    it("renders space when provided", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} spaceName="Research" spaceColor="#4488ff" />);

      expect(screen.getByText("Research")).toBeInTheDocument();
    });

    it("renders domain and savedAt", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("example.com")).toBeInTheDocument();
      expect(screen.getByText("2 hours ago")).toBeInTheDocument();
    });

    it("renders topics", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("distributed-systems")).toBeInTheDocument();
      expect(screen.getByText("scalability")).toBeInTheDocument();
    });

    it("renders entities", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.getByText("Kubernetes")).toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("renders 'Read article' footer link", () => {
      const bk = createArticleBookmark();
      render(<ArticleDetailView bookmark={bk} />);

      const link = screen.getByText("Read article");
      expect(link.closest("a")).toHaveAttribute("href", "https://example.com/great-article");
    });

    it("omits footer when url is null", () => {
      const bk = createArticleBookmark({}, { url: null });
      render(<ArticleDetailView bookmark={bk} />);

      expect(screen.queryByText("Read article")).not.toBeInTheDocument();
      expect(screen.queryByText("Open original source")).not.toBeInTheDocument();
    });
  });
});
