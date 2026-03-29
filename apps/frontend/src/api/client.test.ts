import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ApiError, apiGet, apiPost, apiPatch, apiDelete, apiPostFormData } from "./client";

// --- Helpers ---

function mockFetch(status: number, body?: unknown, statusText = "OK") {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(),
  } as unknown as Response;

  vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
  return response;
}

// --- Tests ---

describe("ApiError", () => {
  it("has name, message, and status", () => {
    const err = new ApiError("Not found", 404);
    expect(err.name).toBe("ApiError");
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("apiGet", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends GET request with correct URL and headers", async () => {
    mockFetch(200, { data: [1, 2, 3] });

    const result = await apiGet<{ data: number[] }>("/api/v1/bookmarks");

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("http://localhost:3001/api/v1/bookmarks");
    expect(init?.method).toBe("GET");
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(result).toEqual({ data: [1, 2, 3] });
  });

  it("appends query params to URL", async () => {
    mockFetch(200, { data: [] });

    await apiGet("/api/v1/bookmarks", { type: "link", page: 1, limit: 20 });

    const [url] = vi.mocked(fetch).mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.searchParams.get("type")).toBe("link");
    expect(parsed.searchParams.get("page")).toBe("1");
    expect(parsed.searchParams.get("limit")).toBe("20");
  });

  it("skips undefined query params", async () => {
    mockFetch(200, { data: [] });

    await apiGet("/api/v1/bookmarks", { type: undefined, page: 1 });

    const [url] = vi.mocked(fetch).mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.searchParams.has("type")).toBe(false);
    expect(parsed.searchParams.get("page")).toBe("1");
  });

  it("includes Authorization header when token exists", async () => {
    localStorage.setItem("access_token", "test-jwt-token");
    mockFetch(200, { data: [] });

    await apiGet("/api/v1/bookmarks");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-jwt-token",
    );
  });

  it("throws ApiError on non-ok response", async () => {
    mockFetch(404, { error: "Bookmark not found" });

    await expect(apiGet("/api/v1/bookmarks/999")).rejects.toThrow(ApiError);
    await expect(apiGet("/api/v1/bookmarks/999")).rejects.toMatchObject({
      message: "Bookmark not found",
      status: 404,
    });
  });

  it("uses default error message when body has no error field", async () => {
    mockFetch(500, {});

    await expect(apiGet("/api/v1/bookmarks")).rejects.toMatchObject({
      message: "An unexpected error occurred",
      status: 500,
    });
  });
});

describe("apiPost", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends POST request with JSON body", async () => {
    const responseBody = { id: "abc", signed_url: null };
    mockFetch(201, responseBody);

    const result = await apiPost("/api/v1/bookmarks", {
      content_type: "link",
      url: "https://example.com",
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("http://localhost:3001/api/v1/bookmarks");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      content_type: "link",
      url: "https://example.com",
    });
    expect(result).toEqual(responseBody);
  });

  it("sends POST without body when body is undefined", async () => {
    mockFetch(201, { share_token: "tok" });

    await apiPost("/api/v1/spaces/s1/share");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.body).toBeUndefined();
  });
});

describe("apiPatch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends PATCH request with JSON body", async () => {
    const updated = { id: "b1", title: "Updated" };
    mockFetch(200, updated);

    const result = await apiPatch("/api/v1/bookmarks/b1", { title: "Updated" });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(init?.body as string)).toEqual({ title: "Updated" });
    expect(result).toEqual(updated);
  });
});

describe("apiDelete", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends DELETE request and handles 204 (no content)", async () => {
    mockFetch(204);

    const result = await apiDelete("/api/v1/bookmarks/b1");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("http://localhost:3001/api/v1/bookmarks/b1");
    expect(init?.method).toBe("DELETE");
    expect(result).toBeUndefined();
  });

  it("sends DELETE request and handles JSON response", async () => {
    mockFetch(200, { id: "s1" });

    const result = await apiDelete<{ id: string }>("/api/v1/spaces/s1/share");

    expect(result).toEqual({ id: "s1" });
  });
});

describe("apiPostFormData", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends POST with FormData and no Content-Type header", async () => {
    localStorage.setItem("access_token", "my-token");
    mockFetch(201, { id: "b2", signed_url: "https://s3.example.com/file" });

    const formData = new FormData();
    formData.append("content_type", "pdf");
    formData.append("title", "My PDF");

    const result = await apiPostFormData("/api/v1/bookmarks", formData);

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe("POST");
    // FormData requests should NOT have Content-Type — browser sets multipart boundary
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
    expect((init?.headers as Record<string, string>)["Authorization"]).toBe("Bearer my-token");
    expect(init?.body).toBe(formData);
    expect(result).toEqual({ id: "b2", signed_url: "https://s3.example.com/file" });
  });

  it("omits Authorization header when no token", async () => {
    mockFetch(201, { id: "b3", signed_url: null });

    await apiPostFormData("/api/v1/bookmarks", new FormData());

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>)["Authorization"]).toBeUndefined();
  });
});
