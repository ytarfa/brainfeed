import React, { act } from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import SaveItemModal from "./SaveItemModal";

const mockMutate = vi.fn();

vi.mock("../api/hooks", () => ({
  useCreateBookmark: vi.fn(() => ({ mutate: mockMutate })),
}));

describe("SaveItemModal", () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onClose = vi.fn();
    mockMutate.mockReset();
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
      screen.getByPlaceholderText("https://example.com or paste any text..."),
    ).toBeInTheDocument();
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

    const input = screen.getByPlaceholderText("https://example.com or paste any text...");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    expect(screen.getByText("Save")).not.toBeDisabled();
  });

  it("form submission calls createBookmark.mutate with link type for URLs", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);

    const input = screen.getByPlaceholderText("https://example.com or paste any text...");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByText("Save"));

    expect(mockMutate).toHaveBeenCalledWith(
      { content_type: "link", url: "https://example.com" },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it("form submission transitions to saving step", () => {
    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);

    const input = screen.getByPlaceholderText("https://example.com or paste any text...");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("after mutate onSuccess, shows done step with Saved! message", () => {
    mockMutate.mockImplementation((_data: unknown, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });

    renderWithProviders(
      <SaveItemModal open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(200);

    const input = screen.getByPlaceholderText("https://example.com or paste any text...");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByText("Save"));

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
