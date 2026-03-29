import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import Sidebar from "./Sidebar";

vi.mock("../api/hooks", () => ({
  useSpaces: vi.fn(),
}));

import { useSpaces } from "../api/hooks";

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
    color: "#ff0000",
    bookmark_spaces: [{ count: 5 }],
    space_members: [
      { user_id: "u1", role: "owner", profiles: { display_name: "Alice", avatar_url: null } },
    ],
  },
  {
    id: "space-2",
    name: "Design Inspo",
    description: "Design inspiration",
    created_at: "2024-01-02",
    updated_at: "2024-01-02",
    user_id: "user-1",
    share_token: null,
    ai_auto_categorize: false,
    color: "#00ff00",
    bookmark_spaces: [{ count: 3 }],
    space_members: [
      { user_id: "u1", role: "owner", profiles: { display_name: "Bob", avatar_url: null } },
    ],
  },
];

describe("Sidebar", () => {
  beforeEach(() => {
    vi.mocked(useSpaces).mockReturnValue({
      data: { data: mockSpaces },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSpaces>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders space list from API data", () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText("Dev Tools")).toBeInTheDocument();
    expect(screen.getByText("Design Inspo")).toBeInTheDocument();
  });

  it("renders Spaces section header when not collapsed", () => {
    renderWithProviders(<Sidebar collapsed={false} />);
    expect(screen.getByText("Spaces")).toBeInTheDocument();
  });

  it("does NOT render Spaces text when collapsed", () => {
    renderWithProviders(<Sidebar collapsed={true} />);
    expect(screen.queryByText("Spaces")).not.toBeInTheDocument();
  });

  it("renders New Space button text when not collapsed", () => {
    renderWithProviders(<Sidebar collapsed={false} />);
    expect(screen.getByText("New Space")).toBeInTheDocument();
  });

  it("renders Settings button text when not collapsed", () => {
    renderWithProviders(<Sidebar collapsed={false} />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("hides New Space and Settings text when collapsed", () => {
    renderWithProviders(<Sidebar collapsed={true} />);
    expect(screen.queryByText("New Space")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });

  it("clicking space name creates a NavLink to /spaces/:id", () => {
    renderWithProviders(<Sidebar />);
    const devToolsLink = screen.getByText("Dev Tools").closest("a");
    expect(devToolsLink).toHaveAttribute("href", "/spaces/space-1");

    const designLink = screen.getByText("Design Inspo").closest("a");
    expect(designLink).toHaveAttribute("href", "/spaces/space-2");
  });

  it("renders space color dots", () => {
    renderWithProviders(<Sidebar />);
    // Each NavLink contains a color dot span as the first child
    const links = screen.getAllByRole("link");
    const spaceLinks = links.filter(
      (l) => l.getAttribute("href")?.startsWith("/spaces/"),
    );
    expect(spaceLinks).toHaveLength(2);

    // First space has color #ff0000
    const firstDot = spaceLinks[0].querySelector("span");
    expect(firstDot).toHaveStyle({ background: "#ff0000" });

    // Second space has color #00ff00
    const secondDot = spaceLinks[1].querySelector("span");
    expect(secondDot).toHaveStyle({ background: "#00ff00" });
  });

  it("spaces section can be toggled open/closed", () => {
    renderWithProviders(<Sidebar collapsed={false} />);

    // Spaces are visible initially (spacesOpen defaults to true)
    expect(screen.getByText("Dev Tools")).toBeInTheDocument();

    // Click the "Spaces" section header to collapse
    fireEvent.click(screen.getByText("Spaces"));
    expect(screen.queryByText("Dev Tools")).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(screen.getByText("Spaces"));
    expect(screen.getByText("Dev Tools")).toBeInTheDocument();
  });

  it("calls onToggle when logo area is clicked", () => {
    const onToggle = vi.fn();
    renderWithProviders(<Sidebar onToggle={onToggle} />);

    // The logo area contains the brainfeed text
    const logoArea = screen.getByText("brainfeed").closest("[title]")!;
    fireEvent.click(logoArea);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
