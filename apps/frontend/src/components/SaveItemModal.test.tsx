import React, { act } from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import SaveItemModal from "./SaveItemModal";

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
    bookmark_spaces: [{ count: 3 }],
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
    bookmark_spaces: [{ count: 7 }],
    space_members: [
      { user_id: "u1", role: "owner", profiles: { display_name: "Alice", avatar_url: null } },
    ],
  },
];

describe("SaveItemModal", () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onClose = vi.fn();

    vi.mocked(useSpaces).mockReturnValue({
      data: { data: mockSpaces },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSpaces>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns null when open=false", () => {
    const { container } = renderWithProviders(
      <SaveItemModal open={false} onClose={onClose} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders Save to brainfeed header when open=true", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);
    expect(screen.getByText("Save to brainfeed")).toBeInTheDocument();
  });

  it("renders URL input field", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);
    expect(
      screen.getByPlaceholderText("https://example.com or paste any text…"),
    ).toBeInTheDocument();
  });

  it("renders space dropdown with options from API", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    // Default option + 2 spaces
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Let AI suggest a Space…");
    expect(options[1]).toHaveTextContent("Dev Tools");
    expect(options[2]).toHaveTextContent("Design Inspo");
  });

  it("renders Cancel and Save buttons", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("Save button is disabled when URL is empty", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);
    expect(screen.getByText("Save")).toBeDisabled();
  });

  it("Save button is enabled when URL has text", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);

    const input = screen.getByPlaceholderText("https://example.com or paste any text…");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    expect(screen.getByText("Save")).not.toBeDisabled();
  });

  it("form submission transitions to enriching step", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);

    const input = screen.getByPlaceholderText("https://example.com or paste any text…");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Enriching content…")).toBeInTheDocument();
  });

  it("after enriching, shows done step with Saved! message", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);

    const input = screen.getByPlaceholderText("https://example.com or paste any text…");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByText("Save"));

    // Enriching → done after 2200ms; wrap in act because setTimeout triggers setStep
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("close button triggers onClose", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);

    // The close button is the header button containing the CloseIcon SVG
    const header = screen.getByText("Save to brainfeed").parentElement!;
    const closeBtn = header.querySelector("button")!;
    fireEvent.click(closeBtn);

    // handleClose sets visible=false then calls onClose after 220ms
    vi.advanceTimersByTime(220);
    expect(onClose).toHaveBeenCalled();
  });

  it("overlay click triggers onClose", () => {
    const { container } = renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);

    // The overlay is the outermost fixed-position div
    const overlay = container.firstElementChild as HTMLElement;
    fireEvent.click(overlay);

    vi.advanceTimersByTime(220);
    expect(onClose).toHaveBeenCalled();
  });
});
