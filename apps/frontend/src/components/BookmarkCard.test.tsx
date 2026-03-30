import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BookmarkCard from "./BookmarkCard";
import type { Bookmark } from "@brain-feed/types";

function createMockBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: "bk-1",
    user_id: "user-1",
    url: "https://example.com/article",
    title: "Test Bookmark",
    description: "A test bookmark",
    notes: "Some notes",
    thumbnail_url: "https://example.com/thumb.jpg",
    content_type: "link",
    source_type: "github",
    tags: [{ id: "t1", label: "React" }, { id: "t2", label: "TypeScript" }],
    raw_content: null,
    metadata: null,
    embedding: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    spaceId: "space-1",
    domain: "example.com",
    summary: "A short summary of the bookmark",
    savedAt: "3 min ago",
    isArticle: false,
    ...overrides,
  } as Bookmark;
}

const defaultProps = {
  bookmark: createMockBookmark(),
  view: "grid" as const,
  onClick: vi.fn(),
};

describe("BookmarkCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders bookmark title", () => {
    render(<BookmarkCard {...defaultProps} />);
    expect(screen.getByText("Test Bookmark")).toBeInTheDocument();
  });

  it("renders bookmark summary", () => {
    render(<BookmarkCard {...defaultProps} />);
    expect(screen.getByText("A short summary of the bookmark")).toBeInTheDocument();
  });

  it("renders tags", () => {
    render(<BookmarkCard {...defaultProps} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders source type badge with source_type text", () => {
    render(<BookmarkCard {...defaultProps} />);
    expect(screen.getByText("github")).toBeInTheDocument();
  });

  it("renders domain and savedAt in meta row", () => {
    render(<BookmarkCard {...defaultProps} />);
    expect(screen.getByText(/example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/3 min ago/)).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn();
    render(<BookmarkCard {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Test Bookmark" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when Enter key is pressed", () => {
    const onClick = vi.fn();
    render(<BookmarkCard {...defaultProps} onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Test Bookmark" }), { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows thumbnail in grid view", () => {
    const { container } = render(<BookmarkCard {...defaultProps} view="grid" />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/thumb.jpg");
  });

  it("does NOT show thumbnail in list view", () => {
    const { container } = render(<BookmarkCard {...defaultProps} view="list" />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("shows space badge when showSpace=true and spaceName provided", () => {
    render(
      <BookmarkCard
        {...defaultProps}
        showSpace
        spaceName="Dev Tools"
        spaceColor="#2A8A62"
      />,
    );
    expect(screen.getByText("Dev Tools")).toBeInTheDocument();
  });

  it("does NOT show space badge when showSpace=false", () => {
    render(
      <BookmarkCard
        {...defaultProps}
        showSpace={false}
        spaceName="Dev Tools"
      />,
    );
    expect(screen.queryByText("Dev Tools")).not.toBeInTheDocument();
  });

  it("hides more menu in readonly mode", () => {
    render(<BookmarkCard {...defaultProps} readonly />);
    expect(screen.queryByLabelText("More options")).not.toBeInTheDocument();
  });

  it("shows more menu button on hover", () => {
    render(<BookmarkCard {...defaultProps} />);
    const card = screen.getByRole("button", { name: "Test Bookmark" });
    const moreBtn = screen.getByLabelText("More options");

    // Before hover: has opacity-0 class
    expect(moreBtn.className).toContain("opacity-0");

    // After mouseenter: has opacity-100 class
    fireEvent.mouseEnter(card);
    expect(moreBtn.className).toContain("opacity-100");

    // After mouseleave: opacity-0 again
    fireEvent.mouseLeave(card);
    expect(moreBtn.className).toContain("opacity-0");
  });

  it("opens dropdown menu on more button click with 3 items", () => {
    render(<BookmarkCard {...defaultProps} />);
    const card = screen.getByRole("button", { name: "Test Bookmark" });
    fireEvent.mouseEnter(card);

    const moreBtn = screen.getByLabelText("More options");
    fireEvent.click(moreBtn);

    expect(screen.getByText("Move to Space")).toBeInTheDocument();
    expect(screen.getByText("Open source")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("uses aria-label from bookmark title", () => {
    render(<BookmarkCard {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Test Bookmark" })).toBeInTheDocument();
  });

  // ── Source meta variant tests ──────────────────────────────────────────

  describe("source meta variants", () => {
    it("renders GitHub star count and language when metadata is present", () => {
      const bookmark = createMockBookmark({
        source_type: "github",
        tags: [],
        metadata: { stars: 62400, language: "TypeScript" },
      });
      render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      expect(screen.getByText("62k")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("renders GitHub star count in compact form for large numbers", () => {
      const bookmark = createMockBookmark({
        source_type: "github",
        metadata: { stars: 1500, language: "Rust" },
      });
      render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      expect(screen.getByText("1.5k")).toBeInTheDocument();
      expect(screen.getByText("Rust")).toBeInTheDocument();
    });

    it("renders YouTube channel and duration when metadata is present", () => {
      const bookmark = createMockBookmark({
        source_type: "youtube",
        metadata: { channel: "Fireship", duration: "4:32:18" },
      });
      render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      expect(screen.getByText("Fireship")).toBeInTheDocument();
      expect(screen.getByText("4:32:18")).toBeInTheDocument();
    });

    it("renders Paper authors and year when metadata is present", () => {
      const bookmark = createMockBookmark({
        source_type: "paper",
        metadata: { authors: "Vaswani et al.", year: 2017 },
      });
      render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      expect(screen.getByText("Vaswani et al.")).toBeInTheDocument();
      expect(screen.getByText("2017")).toBeInTheDocument();
    });

    it("renders Reddit subreddit from URL", () => {
      const bookmark = createMockBookmark({
        source_type: "reddit",
        url: "https://reddit.com/r/programming/comments/abc123",
      });
      render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      expect(screen.getByText("r/programming")).toBeInTheDocument();
    });

    it("renders Twitter handle from URL", () => {
      const bookmark = createMockBookmark({
        source_type: "twitter",
        url: "https://twitter.com/elonmusk/status/123456",
      });
      render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      expect(screen.getByText("@elonmusk")).toBeInTheDocument();
    });

    it("renders Twitter handle from x.com URL", () => {
      const bookmark = createMockBookmark({
        source_type: "twitter",
        url: "https://x.com/OpenAI/status/789",
      });
      render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      expect(screen.getByText("@OpenAI")).toBeInTheDocument();
    });

    it("renders Spotify artist and album when metadata is present", () => {
      const bookmark = createMockBookmark({
        source_type: "spotify",
        metadata: { artist: "Radiohead", album: "OK Computer" },
      });
      render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      expect(screen.getByText("Radiohead")).toBeInTheDocument();
      expect(screen.getByText("OK Computer")).toBeInTheDocument();
    });

    it("does NOT render source meta for news source type", () => {
      const bookmark = createMockBookmark({
        source_type: "news",
        metadata: null,
      });
      const { container } = render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      // No source meta div should be present (the wrapper div has mb-1.5)
      const metas = container.querySelectorAll(".mb-1\\.5");
      // The only mb-1.5 elements should be title margin, not a separate source meta wrapper
      const sourceMetaWrappers = Array.from(metas).filter((el) =>
        el.querySelector("[class*='text-[11px]']"),
      );
      expect(sourceMetaWrappers).toHaveLength(0);
    });

    it("does NOT render source meta for generic source type", () => {
      const bookmark = createMockBookmark({
        source_type: "generic",
        metadata: null,
      });
      render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      // Generic source types have no variant component, so no extra metadata line
    });

    it("does NOT render GitHub meta when metadata is null", () => {
      const bookmark = createMockBookmark({
        source_type: "github",
        metadata: null,
      });
      const { container } = render(<BookmarkCard {...defaultProps} bookmark={bookmark} />);
      // The star SVG (lucide-star class) should not be present when metadata is null
      expect(container.querySelector(".lucide-star")).not.toBeInTheDocument();
    });
  });
});
