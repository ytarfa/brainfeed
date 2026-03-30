import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

import ToastProvider, { useToast } from "./ToastContext";

// ---------------------------------------------------------------------------
// Helper: component that exposes toast context for testing
// ---------------------------------------------------------------------------

function ToastTrigger({ type = "error" }: { type?: "error" | "warning" | "info" | "success" }) {
  const { showToast, toasts, dismissToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast("Test error message", type)}>Show Toast</button>
      <button onClick={() => toasts[0] && dismissToast(toasts[0].id)}>Dismiss First</button>
      <span data-testid="toast-count">{toasts.length}</span>
      {toasts.map((t) => (
        <span key={t.id} data-testid={`toast-${t.id}`}>{t.message}</span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ToastContext", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("provides showToast and dismissToast to children", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    expect(screen.getByText("Show Toast")).toBeInTheDocument();
    expect(screen.getByTestId("toast-count").textContent).toBe("0");
  });

  it("adds a toast when showToast is called", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Toast"));

    expect(screen.getByTestId("toast-count").textContent).toBe("1");
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("auto-dismisses toast after 6 seconds", () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Toast"));
    expect(screen.getByTestId("toast-count").textContent).toBe("1");

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByTestId("toast-count").textContent).toBe("0");

    vi.useRealTimers();
  });

  it("manually dismisses a toast", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Toast"));
    expect(screen.getByTestId("toast-count").textContent).toBe("1");

    fireEvent.click(screen.getByText("Dismiss First"));
    expect(screen.getByTestId("toast-count").textContent).toBe("0");
  });

  it("supports multiple toasts", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Toast"));
    fireEvent.click(screen.getByText("Show Toast"));

    expect(screen.getByTestId("toast-count").textContent).toBe("2");
  });

  it("throws if useToast is used outside provider", () => {
    // Suppress console.error from React error boundary
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<ToastTrigger />)).toThrow(
      "useToast must be used within a ToastProvider",
    );

    spy.mockRestore();
  });
});
