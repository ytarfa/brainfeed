import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import Library from "./Library";

vi.mock("../api/hooks", () => ({
  useBookmarks: vi.fn(),
  useSpaces: vi.fn(),
  toBookmark: vi.fn(),
  useDigestSummary: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useOutletContext: vi.fn() };
});

import { useBookmarks, useSpaces, toBookmark } from "../api/hooks";
import { useOutletContext } from "react-router-dom";

const mockBookmarksRaw = [
  {
    id: "bk-1",
    title: "React Patterns",
    url: "https://reactpatterns.com",
    description: "Common React patterns",
    notes: null,
    content_type: "link",
    source_type: "generic",
    tags: ["react"],
    thumbnail_url: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    user_id: "user-1",
    bookmark_spaces: [{ space_id: "space-1", spaces: { id: "space-1", name: "Dev Tools" } }],
  },
  {
    id: "bk-2",
    title: "TypeScript Deep Dive",
    url: "https://basarat.gitbook.io/typescript",
    description: "TS deep dive book",
    notes: null,
    content_type: "link",
    source_type: "generic",
    tags: ["typescript"],
    thumbnail_url: null,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    user_id: "user-1",
    bookmark_spaces: [{ space_id: "space-2", spaces: { id: "space-2", name: "Learning" } }],
  },
];

const mockSpaces = [
  {
    id: "space-1",
    name: "Dev Tools",
    description: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    user_id: "user-1",
    share_token: null,
    ai_auto_categorize: false,
    color: "#2A8A62",
    bookmark_spaces: [{ count: 5 }],
    space_members: [
      { user_id: "u1", role: "owner", profiles: { display_name: "Alice", avatar_url: null } },
    ],
  },
  {
    id: "space-2",
    name: "Learning",
    description: "Learning resources",
    created_at: "2024-01-02",
    updated_at: "2024-01-02",
    user_id: "user-1",
    share_token: null,
    ai_auto_categorize: false,
    color: "#4a90d9",
    bookmark_spaces: [{ count: 3 }],
    space_members: [
      { user_id: "u1", role: "owner", profiles: { display_name: "Alice", avatar_url: null } },
    ],
  },
];

function setupMocks(overrides: {
  bookmarksData?: unknown;
  isLoading?: boolean;
  spacesData?: unknown;
  view?: "grid" | "list";
} = {}) {
  const {
    bookmarksData = { data: mockBookmarksRaw, total: 2, page: 1, limit: 20 },
    isLoading = false,
    spacesData = { data: mockSpaces },
    view = "grid",
  } = overrides;

  vi.mocked(useOutletContext).mockReturnValue({
    view,
    onCardClick: vi.fn(),
  });

  vi.mocked(useBookmarks).mockReturnValue({
    data: bookmarksData,
    isLoading,
    isError: false,
  } as unknown as ReturnType<typeof useBookmarks>);

  vi.mocked(useSpaces).mockReturnValue({
    data: spacesData,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useSpaces>);

  vi.mocked(toBookmark).mockImplementation((raw) => ({
    id: (raw as Record<string, unknown>).id,
    title: (raw as Record<string, unknown>).title,
    url: (raw as Record<string, unknown>).url,
    description: (raw as Record<string, unknown>).description,
    notes: null,
    content_type: (raw as Record<string, unknown>).content_type as "link",
    source_type: (raw as Record<string, unknown>).source_type ?? null,
    tags: [],
    thumbnail_url: null,
    created_at: (raw as Record<string, unknown>).created_at as string,
    updated_at: (raw as Record<string, unknown>).updated_at as string,
    user_id: (raw as Record<string, unknown>).user_id as string,
    spaceId: ((raw as Record<string, unknown>).bookmark_spaces as Array<{ space_id: string }>)?.[0]?.space_id ?? "",
    savedAt: "3 min ago",
    domain: "example.com",
    raw_content: null,
    file_path: null,
    enriched_data: null,
    enrichment_status: "pending",
  }));
}

describe("Library", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 'Library' heading", () => {
    setupMocks();
    renderWithProviders(<Library />);
    expect(screen.getByRole("heading", { name: "Library" })).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    setupMocks({ isLoading: true, bookmarksData: undefined });
    renderWithProviders(<Library />);
    expect(screen.getByText("Loading bookmarks...")).toBeInTheDocument();
  });

  it("renders item count 'X items across all Spaces'", () => {
    setupMocks();
    renderWithProviders(<Library />);
    expect(screen.getByText("2 items across all Spaces")).toBeInTheDocument();
  });

  it("renders filter buttons (All, Links, Notes, Images, PDFs, Files)", () => {
    setupMocks();
    renderWithProviders(<Library />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Links")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Images")).toBeInTheDocument();
    expect(screen.getByText("PDFs")).toBeInTheDocument();
    expect(screen.getByText("Files")).toBeInTheDocument();
  });

  it("renders sort dropdown with options", () => {
    setupMocks();
    renderWithProviders(<Library />);
    expect(screen.getByText("Sort by")).toBeInTheDocument();
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Date saved");
    expect(options[1]).toHaveTextContent("Title");
    expect(options[2]).toHaveTextContent("Source");
  });

  it("shows empty state with 'Nothing saved yet' when no bookmarks", () => {
    setupMocks({ bookmarksData: { data: [], total: 0, page: 1, limit: 20 } });
    renderWithProviders(<Library />);
    expect(screen.getByText("Nothing saved yet")).toBeInTheDocument();
  });

  it("shows '+ Save something' button in empty state", () => {
    setupMocks({ bookmarksData: { data: [], total: 0, page: 1, limit: 20 } });
    renderWithProviders(<Library />);
    expect(screen.getByText("+ Save something")).toBeInTheDocument();
  });

  it("renders BookmarkCard components for each bookmark", () => {
    setupMocks();
    renderWithProviders(<Library />);
    expect(screen.getByText("React Patterns")).toBeInTheDocument();
    expect(screen.getByText("TypeScript Deep Dive")).toBeInTheDocument();
  });

  it("clicking a filter button calls useBookmarks with new type", () => {
    setupMocks();
    renderWithProviders(<Library />);
    fireEvent.click(screen.getByText("Links"));

    // After clicking "Links", useBookmarks should be called with type: "link"
    const calls = vi.mocked(useBookmarks).mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toEqual(
      expect.objectContaining({ type: "link" }),
    );
  });

  it("clicking sort dropdown changes the sort parameter", () => {
    setupMocks();
    renderWithProviders(<Library />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "title" } });

    const calls = vi.mocked(useBookmarks).mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toEqual(
      expect.objectContaining({ sort: "title" }),
    );
  });

  it("does not show empty state or loading when bookmarks are present", () => {
    setupMocks();
    renderWithProviders(<Library />);
    expect(screen.queryByText("Nothing saved yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading bookmarks...")).not.toBeInTheDocument();
  });

  it("does not show bookmarks or empty state when loading", () => {
    setupMocks({ isLoading: true, bookmarksData: undefined });
    renderWithProviders(<Library />);
    expect(screen.queryByText("Nothing saved yet")).not.toBeInTheDocument();
    expect(screen.queryByText("React Patterns")).not.toBeInTheDocument();
  });
});
