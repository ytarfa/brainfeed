import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import GlobalSearch from "./GlobalSearch";

vi.mock("../api/hooks", () => ({
  useSearch: vi.fn(),
  useBookmarks: vi.fn(),
  toBookmark: vi.fn(),
}));

import { useSearch, useBookmarks, toBookmark } from "../api/hooks";

const mockSearchResults = [
  {
    id: "sr-1",
    title: "React Hooks Guide",
    url: "https://react.dev/hooks",
    description: "A guide to React hooks",
    content_type: "link",
    source_type: null,
    tags: null,
    thumbnail_url: null,
    created_at: "2024-01-01T00:00:00Z",
    bookmark_spaces: [
      { space_id: "space-1", spaces: { id: "space-1", name: "Dev Tools" } },
    ],
  },
  {
    id: "sr-2",
    title: "TypeScript Handbook",
    url: "https://typescriptlang.org",
    description: "Official TS docs",
    content_type: "link",
    source_type: null,
    tags: null,
    thumbnail_url: null,
    created_at: "2024-01-02T00:00:00Z",
    bookmark_spaces: [],
  },
];

const mockRecentRaw = [
  {
    id: "bk-1",
    title: "Recent Article",
    url: "https://example.com/1",
    description: null,
    notes: null,
    content_type: "link",
    source_type: null,
    tags: null,
    thumbnail_url: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    user_id: "user-1",
    bookmark_spaces: [],
  },
  {
    id: "bk-2",
    title: "Another Recent",
    url: "https://example.com/2",
    description: null,
    notes: null,
    content_type: "link",
    source_type: null,
    tags: null,
    thumbnail_url: null,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    user_id: "user-1",
    bookmark_spaces: [],
  },
];

describe("GlobalSearch", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onClose = vi.fn();
    onSelect = vi.fn();

    vi.mocked(useSearch).mockReturnValue({
      data: { data: [], total: null, page: 1, limit: 20 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSearch>);

    vi.mocked(useBookmarks).mockReturnValue({
      data: { data: mockRecentRaw, total: null, page: 1, limit: 3 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useBookmarks>);

    vi.mocked(toBookmark).mockImplementation((raw) => ({
      id: raw.id,
      title: raw.title,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns null when open=false", () => {
    const { container } = renderWithProviders(
      <GlobalSearch open={false} onClose={onClose} onSelect={onSelect} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders search input when open=true", () => {
    renderWithProviders(
      <GlobalSearch open={true} onClose={onClose} onSelect={onSelect} />,
    );
    vi.advanceTimersByTime(100);
    expect(screen.getByPlaceholderText("Search everything…")).toBeInTheDocument();
  });

  it("renders Esc key hint", () => {
    renderWithProviders(
      <GlobalSearch open={true} onClose={onClose} onSelect={onSelect} />,
    );
    vi.advanceTimersByTime(100);
    expect(screen.getByText("Esc")).toBeInTheDocument();
  });

  it("shows Recent section with recent bookmarks when query is empty", () => {
    renderWithProviders(
      <GlobalSearch open={true} onClose={onClose} onSelect={onSelect} />,
    );
    vi.advanceTimersByTime(100);
    expect(screen.getByText("Recent")).toBeInTheDocument();
    expect(screen.getByText("Recent Article")).toBeInTheDocument();
    expect(screen.getByText("Another Recent")).toBeInTheDocument();
  });

  it("shows search results when query has text", () => {
    vi.mocked(useSearch).mockReturnValue({
      data: { data: mockSearchResults, total: null, page: 1, limit: 20 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSearch>);

    renderWithProviders(
      <GlobalSearch open={true} onClose={onClose} onSelect={onSelect} />,
    );
    vi.advanceTimersByTime(100);

    const input = screen.getByPlaceholderText("Search everything…");
    fireEvent.change(input, { target: { value: "react" } });

    expect(screen.getByText("React Hooks Guide")).toBeInTheDocument();
    expect(screen.getByText("TypeScript Handbook")).toBeInTheDocument();
    expect(screen.getByText("Dev Tools")).toBeInTheDocument();
  });

  it("shows No results message when query has text but results are empty", () => {
    vi.mocked(useSearch).mockReturnValue({
      data: { data: [], total: null, page: 1, limit: 20 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSearch>);

    renderWithProviders(
      <GlobalSearch open={true} onClose={onClose} onSelect={onSelect} />,
    );
    vi.advanceTimersByTime(100);

    const input = screen.getByPlaceholderText("Search everything…");
    fireEvent.change(input, { target: { value: "nonexistent" } });

    expect(screen.getByText(/No results for/)).toBeInTheDocument();
  });

  it("calls onSelect with bookmark id when clicking a search result", () => {
    vi.mocked(useSearch).mockReturnValue({
      data: { data: mockSearchResults, total: null, page: 1, limit: 20 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSearch>);

    renderWithProviders(
      <GlobalSearch open={true} onClose={onClose} onSelect={onSelect} />,
    );
    vi.advanceTimersByTime(100);

    const input = screen.getByPlaceholderText("Search everything…");
    fireEvent.change(input, { target: { value: "react" } });

    fireEvent.click(screen.getByText("React Hooks Guide"));
    expect(onSelect).toHaveBeenCalledWith("sr-1");
  });

  it("calls onClose when overlay is clicked", () => {
    const { container } = renderWithProviders(
      <GlobalSearch open={true} onClose={onClose} onSelect={onSelect} />,
    );
    vi.advanceTimersByTime(100);

    // The overlay is the outermost fixed-position div
    const overlay = container.firstElementChild as HTMLElement;
    fireEvent.click(overlay);

    // handleClose sets visible=false then calls onClose after 200ms timeout
    vi.advanceTimersByTime(200);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", () => {
    renderWithProviders(
      <GlobalSearch open={true} onClose={onClose} onSelect={onSelect} />,
    );
    vi.advanceTimersByTime(100);

    const input = screen.getByPlaceholderText("Search everything…");
    fireEvent.keyDown(input, { key: "Escape" });

    vi.advanceTimersByTime(200);
    expect(onClose).toHaveBeenCalled();
  });
});
