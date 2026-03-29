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
        spaceColor="#d4845a"
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

    // Before hover: opacity 0
    expect(moreBtn).toHaveStyle({ opacity: 0 });

    // After mouseenter: opacity 1
    fireEvent.mouseEnter(card);
    expect(moreBtn).toHaveStyle({ opacity: 1 });

    // After mouseleave: opacity 0 again
    fireEvent.mouseLeave(card);
    expect(moreBtn).toHaveStyle({ opacity: 0 });
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
});
