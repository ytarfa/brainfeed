import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";

import { errorReporter } from "../reporter";
import { ErrorBoundary } from "../ErrorBoundary";
import { useErrorReporter } from "../useErrorReporter";

/* ---------- errorReporter ---------- */

describe("errorReporter", () => {
  beforeEach(() => {
    errorReporter.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts uninitialized", () => {
    expect(errorReporter.isInitialized).toBe(false);
  });

  it("becomes initialized after init()", () => {
    errorReporter.init();
    expect(errorReporter.isInitialized).toBe(true);
  });

  it("reports errors to console.error", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    errorReporter.init();
    errorReporter.report(new Error("test error"));

    expect(consoleSpy).toHaveBeenCalledWith(
      "[ErrorReporter]",
      expect.any(Error),
      undefined,
    );
  });

  it("calls onError callback when configured", () => {
    const onError = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    errorReporter.init({ onError });

    const err = new Error("callback test");
    const ctx = { page: "home" };
    errorReporter.report(err, ctx);

    expect(onError).toHaveBeenCalledWith(err, ctx);
  });

  it("calls sentry.captureException when configured", () => {
    const captureException = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    errorReporter.init({ sentry: { captureException } });

    const err = new Error("sentry test");
    errorReporter.report(err);

    expect(captureException).toHaveBeenCalledWith(err, undefined);
  });

  it("converts non-Error values to Error", () => {
    const onError = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    errorReporter.init({ onError });

    errorReporter.report("string error");

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "string error" }),
      undefined,
    );
  });

  it("works without init (onError/sentry not called)", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Should not throw
    errorReporter.report(new Error("no init"));
    expect(console.error).toHaveBeenCalled();
  });

  it("reset clears options and initialized state", () => {
    const onError = vi.fn();
    errorReporter.init({ onError });
    expect(errorReporter.isInitialized).toBe(true);

    errorReporter.reset();
    expect(errorReporter.isInitialized).toBe(false);

    vi.spyOn(console, "error").mockImplementation(() => {});
    errorReporter.report(new Error("after reset"));
    expect(onError).not.toHaveBeenCalled();
  });
});

/* ---------- ErrorBoundary ---------- */

describe("ErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    errorReporter.reset();
  });

  it("renders children when no error", () => {
    render(
      React.createElement(
        ErrorBoundary,
        null,
        React.createElement("div", null, "Hello World"),
      ),
    );
    expect(screen.getByText("Hello World")).toBeDefined();
  });

  it("renders default fallback on error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    function ThrowingComponent(): React.ReactElement {
      throw new Error("render crash");
    }

    render(
      React.createElement(
        ErrorBoundary,
        null,
        React.createElement(ThrowingComponent),
      ),
    );

    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("renders custom fallback on error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    function ThrowingComponent(): React.ReactElement {
      throw new Error("render crash");
    }

    render(
      React.createElement(
        ErrorBoundary,
        { fallback: React.createElement("div", null, "Custom fallback") },
        React.createElement(ThrowingComponent),
      ),
    );

    expect(screen.getByText("Custom fallback")).toBeDefined();
  });

  it("calls errorReporter.report on error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reportSpy = vi.spyOn(errorReporter, "report");

    function ThrowingComponent(): React.ReactElement {
      throw new Error("reported crash");
    }

    render(
      React.createElement(
        ErrorBoundary,
        null,
        React.createElement(ThrowingComponent),
      ),
    );

    expect(reportSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: "reported crash" }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it("calls onError prop on error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();

    function ThrowingComponent(): React.ReactElement {
      throw new Error("onError crash");
    }

    render(
      React.createElement(
        ErrorBoundary,
        { onError },
        React.createElement(ThrowingComponent),
      ),
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "onError crash" }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });
});

/* ---------- useErrorReporter ---------- */

describe("useErrorReporter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    errorReporter.reset();
  });

  it("returns a report function", () => {
    const { result } = renderHook(() => useErrorReporter());
    expect(typeof result.current.report).toBe("function");
  });

  it("report delegates to errorReporter.report", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reportSpy = vi.spyOn(errorReporter, "report");
    errorReporter.init();

    const { result } = renderHook(() => useErrorReporter());
    const err = new Error("hook error");
    result.current.report(err, { source: "test" });

    expect(reportSpy).toHaveBeenCalledWith(err, { source: "test" });
  });
});
