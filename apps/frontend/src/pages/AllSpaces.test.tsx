import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import AllSpaces from "./AllSpaces";

vi.mock("../api/hooks", () => ({
  useSpaces: vi.fn(),
}));

import { useSpaces } from "../api/hooks";

const mockSpaces = [
  {
    id: "space-1",
    name: "Dev Tools",
    description: "Libraries and frameworks",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    user_id: "user-1",
    share_token: null,
    ai_auto_categorize: false,
    color: "#d4845a",
    bookmark_spaces: [{ count: 12 }],
    space_members: [
      { user_id: "u1", role: "owner", profiles: { display_name: "Alice", avatar_url: null } },
      { user_id: "u2", role: "editor", profiles: { display_name: "Bob", avatar_url: null } },
      { user_id: "u3", role: "viewer", profiles: { display_name: "Charlie", avatar_url: null } },
    ],
  },
  {
    id: "space-2",
    name: "Design Inspo",
    description: "Design inspiration and references",
    created_at: "2024-01-02",
    updated_at: "2024-01-02",
    user_id: "user-1",
    share_token: null,
    ai_auto_categorize: false,
    color: "#4a90d9",
    bookmark_spaces: [{ count: 7 }],
    space_members: [
      { user_id: "u1", role: "owner", profiles: { display_name: "Alice", avatar_url: null } },
    ],
  },
  {
    id: "space-3",
    name: "Research",
    description: null,
    created_at: "2024-01-03",
    updated_at: "2024-01-03",
    user_id: "user-1",
    share_token: null,
    ai_auto_categorize: false,
    color: "#2ecc71",
    bookmark_spaces: [{ count: 0 }],
    space_members: [
      { user_id: "u1", role: "owner", profiles: { display_name: "Alice", avatar_url: null } },
    ],
  },
];

function setupMocks(overrides: {
  spacesData?: unknown;
  isLoading?: boolean;
} = {}) {
  const {
    spacesData = { data: mockSpaces },
    isLoading = false,
  } = overrides;

  vi.mocked(useSpaces).mockReturnValue({
    data: spacesData,
    isLoading,
    isError: false,
  } as unknown as ReturnType<typeof useSpaces>);
}

describe("AllSpaces", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 'Spaces' heading", () => {
    setupMocks();
    renderWithProviders(<AllSpaces />);
    expect(screen.getByRole("heading", { name: "Spaces" })).toBeInTheDocument();
  });

  it("shows space count in subtitle", () => {
    setupMocks();
    renderWithProviders(<AllSpaces />);
    expect(screen.getByText(/3 spaces/)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    setupMocks({ isLoading: true });
    renderWithProviders(<AllSpaces />);
    expect(screen.getByText("Loading spaces...")).toBeInTheDocument();
  });

  it("renders space cards with names", () => {
    setupMocks();
    renderWithProviders(<AllSpaces />);
    expect(screen.getByText("Dev Tools")).toBeInTheDocument();
    expect(screen.getByText("Design Inspo")).toBeInTheDocument();
    expect(screen.getByText("Research")).toBeInTheDocument();
  });

  it("renders space descriptions", () => {
    setupMocks();
    renderWithProviders(<AllSpaces />);
    expect(screen.getByText("Libraries and frameworks")).toBeInTheDocument();
    expect(screen.getByText("Design inspiration and references")).toBeInTheDocument();
  });

  it("shows item count on each card", () => {
    setupMocks();
    renderWithProviders(<AllSpaces />);
    expect(screen.getByText("12 items")).toBeInTheDocument();
    expect(screen.getByText("7 items")).toBeInTheDocument();
    expect(screen.getByText("0 items")).toBeInTheDocument();
  });

  it("renders color bars on space cards", () => {
    setupMocks();
    const { container } = renderWithProviders(<AllSpaces />);
    const colorBars = container.querySelectorAll("div[style*='width: 32px']");
    expect(colorBars.length).toBeGreaterThanOrEqual(3);
  });

  it("each space card links to /spaces/:id", () => {
    setupMocks();
    renderWithProviders(<AllSpaces />);
    const devToolsLink = screen.getByText("Dev Tools").closest("a");
    expect(devToolsLink).toHaveAttribute("href", "/spaces/space-1");

    const designLink = screen.getByText("Design Inspo").closest("a");
    expect(designLink).toHaveAttribute("href", "/spaces/space-2");

    const researchLink = screen.getByText("Research").closest("a");
    expect(researchLink).toHaveAttribute("href", "/spaces/space-3");
  });

  it("renders 'New Space' button in header", () => {
    setupMocks();
    renderWithProviders(<AllSpaces />);
    const newSpaceElements = screen.getAllByText("New Space");
    expect(newSpaceElements.length).toBeGreaterThanOrEqual(1);
    // The first one is the header button
    const headerButton = newSpaceElements[0].closest("button");
    expect(headerButton).toBeInTheDocument();
  });

  it("renders create new space placeholder card", () => {
    setupMocks();
    const { container } = renderWithProviders(<AllSpaces />);
    const dashedBorderButtons = container.querySelectorAll("button[style*='dashed']");
    expect(dashedBorderButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows collaborator avatars when space has multiple members", () => {
    setupMocks();
    renderWithProviders(<AllSpaces />);
    // Dev Tools has 3 members (>1), so avatars should show
    expect(screen.getByTitle("Alice")).toBeInTheDocument();
    expect(screen.getByTitle("Bob")).toBeInTheDocument();
    expect(screen.getByTitle("Charlie")).toBeInTheDocument();
  });

  it("does not show cards grid when loading", () => {
    setupMocks({ isLoading: true });
    renderWithProviders(<AllSpaces />);
    expect(screen.queryByText("Dev Tools")).not.toBeInTheDocument();
  });
});
