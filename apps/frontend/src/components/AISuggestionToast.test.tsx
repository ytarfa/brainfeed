import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AISuggestionToast from "./AISuggestionToast";

const defaultProps = {
  spaceName: "Dev Tools",
  bookmarkTitle: "React Testing Best Practices",
  onConfirm: vi.fn(),
  onReassign: vi.fn(),
  onDismiss: vi.fn(),
};

describe("AISuggestionToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders 'AI suggestion' text", () => {
    render(<AISuggestionToast {...defaultProps} />);
    expect(screen.getByText("AI suggestion")).toBeInTheDocument();
  });

  it("renders space name", () => {
    render(<AISuggestionToast {...defaultProps} />);
    expect(screen.getByText("Dev Tools")).toBeInTheDocument();
  });

  it("renders bookmark title", () => {
    render(<AISuggestionToast {...defaultProps} />);
    expect(screen.getByText("React Testing Best Practices")).toBeInTheDocument();
  });

  it("truncates long bookmark titles (> 40 chars, shows '…')", () => {
    const longTitle = "This is a very long bookmark title that definitely exceeds the forty char limit";
    render(<AISuggestionToast {...defaultProps} bookmarkTitle={longTitle} />);
    const truncated = longTitle.slice(0, 40) + "…";
    expect(screen.getByText(truncated)).toBeInTheDocument();
    expect(screen.queryByText(longTitle)).not.toBeInTheDocument();
  });

  it("renders Confirm, Reassign, and dismiss buttons", () => {
    render(<AISuggestionToast {...defaultProps} />);
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Reassign")).toBeInTheDocument();
    // Dismiss button uses Lucide <X> icon (aria-hidden), so query all buttons
    // and find the one that is neither Confirm nor Reassign
    const buttons = screen.getAllByRole("button");
    const dismissBtn = buttons.find(
      (btn) => btn.textContent !== "Confirm" && btn.textContent !== "Reassign",
    );
    expect(dismissBtn).toBeInTheDocument();
  });

  it("calls onConfirm when Confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(<AISuggestionToast {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onReassign when Reassign button clicked", () => {
    const onReassign = vi.fn();
    render(<AISuggestionToast {...defaultProps} onReassign={onReassign} />);
    fireEvent.click(screen.getByText("Reassign"));
    expect(onReassign).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when dismiss (✕) button clicked after 280ms delay", () => {
    const onDismiss = vi.fn();
    render(<AISuggestionToast {...defaultProps} onDismiss={onDismiss} />);
    // Dismiss button uses Lucide <X> icon — find by exclusion
    const buttons = screen.getAllByRole("button");
    const dismissBtn = buttons.find(
      (btn) => btn.textContent !== "Confirm" && btn.textContent !== "Reassign",
    )!;
    fireEvent.click(dismissBtn);

    // Not called immediately
    expect(onDismiss).not.toHaveBeenCalled();

    // Called after 280ms
    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("auto-dismisses after 7000ms (calls onDismiss)", () => {
    const onDismiss = vi.fn();
    render(<AISuggestionToast {...defaultProps} onDismiss={onDismiss} />);

    // Not yet called at 6999ms
    act(() => {
      vi.advanceTimersByTime(6999);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    // At 7000ms the outer setTimeout fires, which sets visible=false and
    // schedules onDismiss after 280ms
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Still need to wait 280ms for the inner setTimeout
    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
