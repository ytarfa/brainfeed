import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { errorReporter } from "@brain-feed/frontend-error-reporter";

import { ApiError, apiGet } from "./client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(status: number, body?: unknown) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    url: "http://localhost:3001/api/v1/test",
    json: vi.fn().mockResolvedValue(body ?? {}),
    headers: new Headers(),
  } as unknown as Response;

  vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
  return response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("API client interceptors", () => {
  beforeEach(() => {
    localStorage.clear();
    errorReporter.reset();
    errorReporter.init();
    // Mock window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: { pathname: "/library", href: "/library" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("401 interceptor", () => {
    it("clears auth tokens on 401 response", async () => {
      localStorage.setItem("bf-auth-tokens", JSON.stringify({ access_token: "tok", refresh_token: "r", expires_at: 0 }));
      mockFetch(401, { error: "Unauthorized" });

      await expect(apiGet("/api/v1/test")).rejects.toThrow(ApiError);

      expect(localStorage.getItem("bf-auth-tokens")).toBeNull();
    });

    it("redirects to /login on 401 when not on auth page", async () => {
      mockFetch(401, { error: "Unauthorized" });

      await expect(apiGet("/api/v1/test")).rejects.toThrow(ApiError);

      expect(window.location.href).toBe("/login");
    });

    it("does not redirect to /login when already on /login", async () => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { pathname: "/login", href: "/login" },
      });
      mockFetch(401, { error: "Unauthorized" });

      await expect(apiGet("/api/v1/test")).rejects.toThrow(ApiError);

      expect(window.location.href).toBe("/login");
    });

    it("does not redirect when on /signup", async () => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { pathname: "/signup", href: "/signup" },
      });
      mockFetch(401, { error: "Unauthorized" });

      await expect(apiGet("/api/v1/test")).rejects.toThrow(ApiError);

      // href should remain /signup (not overwritten to /login)
      expect(window.location.href).toBe("/signup");
    });
  });

  describe("5xx error reporting", () => {
    it("calls errorReporter.report on 500 response", async () => {
      const reportSpy = vi.spyOn(errorReporter, "report");
      mockFetch(500, { error: "Internal server error" });

      await expect(apiGet("/api/v1/test")).rejects.toThrow(ApiError);

      expect(reportSpy).toHaveBeenCalledOnce();
      expect(reportSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Internal server error", status: 500 }),
        expect.objectContaining({ status: 500 }),
      );
    });

    it("calls errorReporter.report on 502 response", async () => {
      const reportSpy = vi.spyOn(errorReporter, "report");
      mockFetch(502, { error: "Bad gateway" });

      await expect(apiGet("/api/v1/test")).rejects.toThrow(ApiError);

      expect(reportSpy).toHaveBeenCalledOnce();
    });

    it("does not call errorReporter.report on 4xx responses", async () => {
      const reportSpy = vi.spyOn(errorReporter, "report");
      mockFetch(404, { error: "Not found" });

      await expect(apiGet("/api/v1/test")).rejects.toThrow(ApiError);

      expect(reportSpy).not.toHaveBeenCalled();
    });

    it("does not call errorReporter.report on 2xx responses", async () => {
      const reportSpy = vi.spyOn(errorReporter, "report");
      mockFetch(200, { data: "ok" });

      await apiGet("/api/v1/test");

      expect(reportSpy).not.toHaveBeenCalled();
    });
  });
});
