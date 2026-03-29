import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import PublicSpace from "./PublicSpace";

vi.mock("../api/hooks", () => ({
  usePublicSpace: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useParams: vi.fn() };
});

vi.mock("../components/BookmarkCard", () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-testid="bookmark-card"
      onClick={props.onClick as () => void}
    >
      {(props.bookmark as { title: string }).title}
    </div>
  ),
}));

vi.mock("../components/BookmarkDetail", () => ({
  default: (props: Record<string, unknown>) =>
    props.bookmark ? <div data-testid="bookmark-detail">Detail</div> : null,
}));

vi.mock("../components/Logo", () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

import { usePublicSpace } from "../api/hooks";
import { useParams } from "react-router-dom";

const mockBookmarks = [
  {
    id: "bk-1",
    title: "First Bookmark",
    description: "First description",
    url: "https://example.com/first",
    content_type: "link",
    source_type: "github",
    thumbnail_url: "https://example.com/thumb1.jpg",
    tags: ["react", "testing"],
    created_at: "2024-01-01T00:00:00Z",
    bookmark_spaces: [{ space_id: "space-1" }],
  },
  {
    id: "bk-2",
    title: "Second Bookmark",
    description: "Second description",
    url: "https://example.com/second",
    content_type: "article",
    source_type: "reddit",
    thumbnail_url: null,
    tags: null,
    created_at: "2024-01-02T00:00:00Z",
    bookmark_spaces: [{ space_id: "space-1" }],
  },
];

const mockData = {
  space: {
    id: "space-1",
    name: "My Public Space",
    description: "A curated collection of links",
    created_at: "2024-01-01T00:00:00Z",
  },
  bookmarks: {
    data: mockBookmarks,
    total: 2,
    page: 1,
    limit: 20,
  },
};

describe("PublicSpace", () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ shareToken: "abc123" });
    vi.mocked(usePublicSpace).mockReturnValue({
      data: mockData,
      isLoading: false,
    } as unknown as ReturnType<typeof usePublicSpace>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state when isLoading is true", () => {
    vi.mocked(usePublicSpace).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof usePublicSpace>);

    renderWithProviders(<PublicSpace />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state when data is null", () => {
    vi.mocked(usePublicSpace).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof usePublicSpace>);

    renderWithProviders(<PublicSpace />);
    expect(
      screen.getByText(/doesn't exist or the link has been revoked/),
    ).toBeInTheDocument();
  });

  it("renders Logo in header", () => {
    renderWithProviders(<PublicSpace />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("renders 'Read only' badge", () => {
    renderWithProviders(<PublicSpace />);
    expect(screen.getByText("Read only")).toBeInTheDocument();
  });

  it("renders space name", () => {
    renderWithProviders(<PublicSpace />);
    expect(screen.getByText("My Public Space")).toBeInTheDocument();
  });

  it("renders space description", () => {
    renderWithProviders(<PublicSpace />);
    expect(screen.getByText("A curated collection of links")).toBeInTheDocument();
  });

  it("shows item count", () => {
    renderWithProviders(<PublicSpace />);
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("renders BookmarkCards for each bookmark", () => {
    renderWithProviders(<PublicSpace />);
    const cards = screen.getAllByTestId("bookmark-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("First Bookmark")).toBeInTheDocument();
    expect(screen.getByText("Second Bookmark")).toBeInTheDocument();
  });

  it("renders footer with 'brainfeed' link", () => {
    renderWithProviders(<PublicSpace />);
    const link = screen.getByText("brainfeed");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });

  it("clicking a bookmark card shows BookmarkDetail", () => {
    renderWithProviders(<PublicSpace />);

    // Detail should not be visible initially
    expect(screen.queryByTestId("bookmark-detail")).not.toBeInTheDocument();

    // Click the first bookmark card
    const cards = screen.getAllByTestId("bookmark-card");
    fireEvent.click(cards[0]);

    // Detail should now be visible
    expect(screen.getByTestId("bookmark-detail")).toBeInTheDocument();
  });
});
