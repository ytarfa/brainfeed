import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import SpaceView from "./SpaceView";

vi.mock("../api/hooks", () => ({
  useSpace: vi.fn(),
  useActivity: vi.fn(),
  useDeleteBookmark: vi.fn(),
  toBookmark: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useOutletContext: vi.fn(), useParams: vi.fn() };
});

vi.mock("../components/BookmarkCard", () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="bookmark-card">
      {props.bookmark && (props.bookmark as { title: string }).title}
    </div>
  ),
}));

vi.mock("../components/ActivityLog", () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="activity-log">
      Activity: {String((props.entries as unknown[])?.length ?? 0)}
    </div>
  ),
}));

import { useSpace, useActivity, useDeleteBookmark, toBookmark } from "../api/hooks";
import { useOutletContext, useParams } from "react-router-dom";

const mockMembers = [
  { user_id: "u1", role: "owner", profiles: { display_name: "Alice", avatar_url: null } },
  { user_id: "u2", role: "editor", profiles: { display_name: "Bob", avatar_url: null } },
  { user_id: "u3", role: "viewer", profiles: { display_name: "Charlie", avatar_url: null } },
];

const mockBookmarksInSpace = [
  {
    id: "bk-1",
    title: "React Docs",
    url: "https://react.dev",
    description: "Official React docs",
    notes: null,
    content_type: "link",
    source_type: null,
    tags: null,
    thumbnail_url: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    user_id: "user-1",
    bookmark_spaces: [{ space_id: "space-1" }],
  },
  {
    id: "bk-2",
    title: "Vite Guide",
    url: "https://vitejs.dev",
    description: "Vite docs",
    notes: null,
    content_type: "link",
    source_type: null,
    tags: null,
    thumbnail_url: null,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    user_id: "user-1",
    bookmark_spaces: [{ space_id: "space-1" }],
  },
];

const mockSpace = {
  id: "space-1",
  name: "Dev Tools",
  description: "Libraries and tools for development",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  user_id: "user-1",
  share_token: null,
  ai_auto_categorize: false,
    color: "#2A8A62",
  space_members: mockMembers,
  bookmarks: {
    data: mockBookmarksInSpace,
    total: 2,
    page: 1,
    limit: 20,
  },
};

const mockActivityEntries = [
  {
    id: "act-1",
    action: "categorized",
    details: null,
    created_at: "2024-01-01T00:00:00Z",
    bookmarks: { id: "bk-1", title: "React Docs" },
    profiles: { id: "u1", display_name: "Alice", avatar_url: null },
  },
  {
    id: "act-2",
    action: "added",
    details: null,
    created_at: "2024-01-02T00:00:00Z",
    bookmarks: { id: "bk-2", title: "Vite Guide" },
    profiles: { id: "u2", display_name: "Bob", avatar_url: null },
  },
];

function setupMocks(overrides: {
  space?: unknown | null;
  spaceLoading?: boolean;
  activityData?: unknown;
  view?: "grid" | "list";
  id?: string;
} = {}) {
  const space = "space" in overrides ? overrides.space : mockSpace;
  const spaceLoading = overrides.spaceLoading ?? false;
  const activityData = overrides.activityData ?? { data: mockActivityEntries };
  const view = overrides.view ?? "grid";
  const id = overrides.id ?? "space-1";

  vi.mocked(useParams).mockReturnValue({ id });

  vi.mocked(useOutletContext).mockReturnValue({
    view,
    onCardClick: vi.fn(),
  });

  vi.mocked(useSpace).mockReturnValue({
    data: space,
    isLoading: spaceLoading,
    isError: false,
  } as unknown as ReturnType<typeof useSpace>);

  vi.mocked(useActivity).mockReturnValue({
    data: activityData,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useActivity>);

  vi.mocked(useDeleteBookmark).mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    isIdle: true,
  } as unknown as ReturnType<typeof useDeleteBookmark>);

  vi.mocked(toBookmark).mockImplementation((raw) => ({
    id: (raw as Record<string, unknown>).id,
    title: (raw as Record<string, unknown>).title,
    url: (raw as Record<string, unknown>).url,
    description: (raw as Record<string, unknown>).description,
    notes: null,
    content_type: "link" as const,
    source_type: null,
    tags: [],
    thumbnail_url: null,
    created_at: (raw as Record<string, unknown>).created_at as string,
    updated_at: (raw as Record<string, unknown>).updated_at as string,
    user_id: (raw as Record<string, unknown>).user_id as string,
    spaceId: "space-1",
    savedAt: "3 min ago",
    domain: "example.com",
    raw_content: null,
    file_path: null,
    enriched_data: null,
    enrichment_status: "pending",
  }));
}

describe("SpaceView", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows loading state when spaceLoading is true", () => {
    setupMocks({ spaceLoading: true, space: undefined });
    renderWithProviders(<SpaceView />);
    expect(screen.getByText("Loading space...")).toBeInTheDocument();
  });

  it("shows 'Space not found.' when space is undefined", () => {
    setupMocks({ spaceLoading: false, space: undefined });
    renderWithProviders(<SpaceView />);
    expect(screen.getByText("Space not found.")).toBeInTheDocument();
  });

  it("renders space name as heading", () => {
    setupMocks();
    renderWithProviders(<SpaceView />);
    expect(screen.getByRole("heading", { name: "Dev Tools" })).toBeInTheDocument();
  });

  it("renders space color dot", () => {
    setupMocks();
    const { container } = renderWithProviders(<SpaceView />);
    // Color dot uses className="h-3 w-3 shrink-0 rounded-full" with inline style={{ background: ... }}
    const dots = Array.from(container.querySelectorAll("span")).filter(
      (el) => el.classList.contains("rounded-full") && el.style.background,
    );
    expect(dots.length).toBeGreaterThanOrEqual(1);
    expect(dots[0]).toHaveStyle({ background: "#2A8A62" });
  });

  it("renders space description", () => {
    setupMocks();
    renderWithProviders(<SpaceView />);
    expect(screen.getByText("Libraries and tools for development")).toBeInTheDocument();
  });

  it("shows item count text", () => {
    setupMocks();
    renderWithProviders(<SpaceView />);
    expect(screen.getByText(/2 items/)).toBeInTheDocument();
  });

  it("shows 'shared with X others' when multiple members", () => {
    setupMocks();
    renderWithProviders(<SpaceView />);
    expect(screen.getByText(/shared with 2 others/)).toBeInTheDocument();
  });

  it("does not show 'shared with' text when only one member", () => {
    const singleMemberSpace = {
      ...mockSpace,
      space_members: [mockMembers[0]],
    };
    setupMocks({ space: singleMemberSpace });
    renderWithProviders(<SpaceView />);
    expect(screen.queryByText(/shared with/)).not.toBeInTheDocument();
  });

  it("renders collaborator avatar initials (up to 3)", () => {
    setupMocks();
    renderWithProviders(<SpaceView />);
    expect(screen.getByTitle("Alice")).toBeInTheDocument();
    expect(screen.getByTitle("Bob")).toBeInTheDocument();
    expect(screen.getByTitle("Charlie")).toBeInTheDocument();
  });

  it("renders Settings link pointing to /spaces/:id/settings", () => {
    setupMocks();
    renderWithProviders(<SpaceView />);
    const settingsLink = screen.getByText("Settings").closest("a");
    expect(settingsLink).toHaveAttribute("href", "/spaces/space-1/settings");
  });

  it("shows empty state 'This Space is empty' when no bookmarks", () => {
    const emptySpace = {
      ...mockSpace,
      bookmarks: { data: [], total: 0, page: 1, limit: 20 },
    };
    setupMocks({ space: emptySpace });
    renderWithProviders(<SpaceView />);
    expect(screen.getByText("This Space is empty")).toBeInTheDocument();
  });

  it("renders BookmarkCards when bookmarks exist", () => {
    setupMocks();
    renderWithProviders(<SpaceView />);
    const cards = screen.getAllByTestId("bookmark-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("React Docs");
    expect(cards[1]).toHaveTextContent("Vite Guide");
  });

  it("renders ActivityLog when activity entries exist", () => {
    setupMocks();
    renderWithProviders(<SpaceView />);
    const activityLog = screen.getByTestId("activity-log");
    expect(activityLog).toBeInTheDocument();
    expect(activityLog).toHaveTextContent("Activity: 2");
  });

  it("does not render ActivityLog when no activity entries", () => {
    setupMocks({ activityData: { data: [] } });
    renderWithProviders(<SpaceView />);
    expect(screen.queryByTestId("activity-log")).not.toBeInTheDocument();
  });
});
