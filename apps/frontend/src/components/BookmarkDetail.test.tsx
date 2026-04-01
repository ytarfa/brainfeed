import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import BookmarkDetail from "./BookmarkDetail";
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

describe("BookmarkDetail", () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    rafSpy.mockRestore();
  });

  it("returns null when bookmark is null", () => {
    const { container } = render(<BookmarkDetail bookmark={null} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders bookmark title", () => {
    render(<BookmarkDetail bookmark={createMockBookmark()} onClose={vi.fn()} />);
    expect(screen.getByText("Test Bookmark")).toBeInTheDocument();
  });

  it("renders bookmark domain and savedAt", () => {
    render(<BookmarkDetail bookmark={createMockBookmark()} onClose={vi.fn()} />);
    expect(screen.getByText(/example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/3 min ago/)).toBeInTheDocument();
  });

  it("renders summary section when bookmark has summary", () => {
    render(<BookmarkDetail bookmark={createMockBookmark()} onClose={vi.fn()} />);
    expect(screen.getByText("A short summary of the bookmark")).toBeInTheDocument();
  });

  it("renders fallback text when bookmark has no summary", () => {
    render(
      <BookmarkDetail bookmark={createMockBookmark({ summary: undefined })} onClose={vi.fn()} />,
    );
    expect(screen.getByText("No summary available.")).toBeInTheDocument();
  });

  it("renders tags", () => {
    render(<BookmarkDetail bookmark={createMockBookmark()} onClose={vi.fn()} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders 'Add tag' button", () => {
    render(<BookmarkDetail bookmark={createMockBookmark()} onClose={vi.fn()} />);
    expect(screen.getByText("+ Add tag")).toBeInTheDocument();
  });

  it("renders space badge when spaceName provided", () => {
    render(
      <BookmarkDetail
        bookmark={createMockBookmark()}
        onClose={vi.fn()}
        spaceName="Dev Tools"
        spaceColor="#2A8A62"
      />,
    );
    expect(screen.getByText("Dev Tools")).toBeInTheDocument();
  });

  it("does NOT render space badge when spaceName omitted", () => {
    render(<BookmarkDetail bookmark={createMockBookmark()} onClose={vi.fn()} />);
    // The "Space" label is always present but the space name badge should not be
    expect(screen.queryByText("Dev Tools")).not.toBeInTheDocument();
  });

  it("renders notes textarea with bookmark notes value", () => {
    render(<BookmarkDetail bookmark={createMockBookmark()} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Add a note...");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Some notes");
  });

  it("renders footer link when bookmark has url", () => {
    render(<BookmarkDetail bookmark={createMockBookmark()} onClose={vi.fn()} />);
    // GitHub source_type renders "Open on GitHub" via GitHubDetailView
    const link = screen.getByText("Open on GitHub");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "https://example.com/article");
    expect(link.closest("a")).toHaveAttribute("target", "_blank");
  });

  it("does NOT render footer link when url is null", () => {
    render(
      <BookmarkDetail bookmark={createMockBookmark({ url: null })} onClose={vi.fn()} />,
    );
    expect(screen.queryByText("Open on GitHub")).not.toBeInTheDocument();
    expect(screen.queryByText("Open original source")).not.toBeInTheDocument();
  });

  it("renders thumbnail for non-GitHub bookmark with thumbnail_url", () => {
    const { container } = render(
      <BookmarkDetail bookmark={createMockBookmark({ source_type: "article" })} onClose={vi.fn()} />,
    );
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/thumb.jpg");
  });

  it("does NOT render thumbnail for GitHub bookmark (no hero image)", () => {
    const { container } = render(
      <BookmarkDetail bookmark={createMockBookmark({ source_type: "github" })} onClose={vi.fn()} />,
    );
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("does NOT render thumbnail when thumbnail_url is null", () => {
    const { container } = render(
      <BookmarkDetail
        bookmark={createMockBookmark({ thumbnail_url: null })}
        onClose={vi.fn()}
      />,
    );
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("close button triggers onClose after 280ms setTimeout", () => {
    const onClose = vi.fn();
    render(<BookmarkDetail bookmark={createMockBookmark()} onClose={onClose} />);

    // Find the close button — it's the button containing the CloseIcon SVG
    const buttons = screen.getAllByRole("button");
    // The close button is the one in the header, not "+ Add tag"
    const closeButton = buttons.find(
      (btn) => btn.querySelector("svg") && btn.textContent === "",
    )!;
    fireEvent.click(closeButton);

    // Not called immediately
    expect(onClose).not.toHaveBeenCalled();

    // Called after 280ms timeout
    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders as a centered modal dialog", () => {
    render(<BookmarkDetail bookmark={createMockBookmark()} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("overlay click triggers onClose after 280ms setTimeout", () => {
    const onClose = vi.fn();
    render(
      <BookmarkDetail bookmark={createMockBookmark()} onClose={onClose} />,
    );

    // The overlay is the parent of the dialog element
    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement as HTMLElement;
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay);

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking inside the modal does NOT trigger onClose", () => {
    const onClose = vi.fn();
    render(
      <BookmarkDetail bookmark={createMockBookmark()} onClose={onClose} />,
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);

    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escape key triggers onClose after 280ms setTimeout", () => {
    const onClose = vi.fn();
    render(
      <BookmarkDetail bookmark={createMockBookmark()} onClose={onClose} />,
    );

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
