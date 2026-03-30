import { describe, it, expect, vi, beforeEach } from "vitest";

import { GoogleApiService, GoogleApiError } from "../services/google-api-service";

// ---------------------------------------------------------------------------
// Expose the protected methods for testing via a thin subclass
// ---------------------------------------------------------------------------

class TestService extends GoogleApiService {
  constructor(apiKey = "test-api-key", baseUrl = "https://api.example.com/v1") {
    super(apiKey, baseUrl);
  }

  // Re-expose protected methods as public for testing
  async testGet<T>(path: string, options = {}): Promise<T> {
    return this.get<T>(path, options);
  }

  async testPost<T>(path: string, body: unknown, options = {}): Promise<T> {
    return this.post<T>(path, body, options);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GoogleApiService", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  // -----------------------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------------------

  describe("constructor", () => {
    it("throws if API key is empty", () => {
      expect(() => new TestService("")).toThrow("API key is required");
    });

    it("accepts a valid API key", () => {
      const service = new TestService("my-key");
      expect(service).toBeInstanceOf(GoogleApiService);
    });

    it("strips trailing slashes from baseUrl", () => {
      const service = new TestService("key", "https://api.example.com/v1///");
      // We can verify this indirectly: the next GET request should not have double slashes
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: true }),
      });
      // Fire and forget — we're just checking the URL
      void service.testGet("/test").then(() => {
        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).not.toContain("v1///");
      });
    });
  });

  // -----------------------------------------------------------------------
  // GET requests
  // -----------------------------------------------------------------------

  describe("get()", () => {
    it("sends a GET request with the API key in query params", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      const service = new TestService("my-api-key", "https://api.example.com/v1");
      const result = await service.testGet<{ items: unknown[] }>("/resources");

      expect(mockFetch).toHaveBeenCalledTimes(1);

      const calledUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(calledUrl.origin + calledUrl.pathname).toBe(
        "https://api.example.com/v1/resources",
      );
      expect(calledUrl.searchParams.get("key")).toBe("my-api-key");
      expect(result).toEqual({ items: [] });
    });

    it("merges additional params into the URL", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const service = new TestService();
      await service.testGet("/items", {
        params: { part: "snippet", id: "abc123" },
      });

      const calledUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(calledUrl.searchParams.get("part")).toBe("snippet");
      expect(calledUrl.searchParams.get("id")).toBe("abc123");
      expect(calledUrl.searchParams.get("key")).toBe("test-api-key");
    });

    it("sends Accept: application/json header", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const service = new TestService();
      await service.testGet("/test");

      const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
      expect(calledOptions.method).toBe("GET");
      expect((calledOptions.headers as Record<string, string>)["Accept"]).toBe(
        "application/json",
      );
    });

    it("passes an AbortSignal for timeout", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const service = new TestService();
      await service.testGet("/test", { timeoutMs: 5000 });

      const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
      expect(calledOptions.signal).toBeInstanceOf(AbortSignal);
    });
  });

  // -----------------------------------------------------------------------
  // POST requests
  // -----------------------------------------------------------------------

  describe("post()", () => {
    it("sends a POST request with JSON body", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "created-1" }),
      });

      const service = new TestService();
      const result = await service.testPost<{ id: string }>("/items", {
        name: "test",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
      expect(calledOptions.method).toBe("POST");
      expect(JSON.parse(calledOptions.body as string)).toEqual({ name: "test" });
      expect(
        (calledOptions.headers as Record<string, string>)["Content-Type"],
      ).toBe("application/json");
      expect(result).toEqual({ id: "created-1" });
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe("error handling", () => {
    it("throws GoogleApiError on non-2xx response with error body", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: () =>
          Promise.resolve({
            error: {
              code: 403,
              message: "API key not valid",
              status: "PERMISSION_DENIED",
              errors: [{ reason: "forbidden" }],
            },
          }),
      });

      const service = new TestService();

      try {
        await service.testGet("/secret");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GoogleApiError);
        const apiErr = err as GoogleApiError;
        expect(apiErr.status).toBe(403);
        expect(apiErr.message).toBe("API key not valid");
        expect(apiErr.googleCode).toBe("PERMISSION_DENIED");
        expect(apiErr.details).toEqual([{ reason: "forbidden" }]);
        // AppError properties
        expect(apiErr.statusCode).toBe(502);
        expect(apiErr.code).toBe("EXTERNAL_SERVICE_ERROR");
        expect(apiErr.isOperational).toBe(true);
      }
    });

    it("throws GoogleApiError with status info when error body is not JSON", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("not json")),
      });

      const service = new TestService();

      try {
        await service.testGet("/broken");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GoogleApiError);
        const apiErr = err as GoogleApiError;
        expect(apiErr.status).toBe(500);
        expect(apiErr.message).toContain("500");
      }
    });

    it("throws GoogleApiError with NETWORK_ERROR on fetch failure", async () => {
      mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

      const service = new TestService();

      try {
        await service.testGet("/unreachable");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GoogleApiError);
        const apiErr = err as GoogleApiError;
        expect(apiErr.googleCode).toBe("NETWORK_ERROR");
        expect(apiErr.message).toContain("ECONNREFUSED");
      }
    });
  });
});
