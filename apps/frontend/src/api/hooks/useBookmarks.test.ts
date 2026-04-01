import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

import { createHookWrapper } from "../../test/test-utils";
import {
  useBookmarks,
  useBookmark,
  useCreateBookmark,
  useUpdateBookmark,
  useDeleteBookmark,
  toBookmark,
  bookmarkKeys,
  shouldPollBookmarkList,
  shouldPollBookmarkDetail,
} from "./useBookmarks";

// Mock the API client
vi.mock("../client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
  apiPostFormData: vi.fn(),
}));

import { apiGet, apiPost, apiPatch, apiDelete, apiPostFormData } from "../client";

// --- Fixtures ---

const mockBookmarkRaw = {
  id: "b1",
  title: "Test Bookmark",
  url: "https://www.example.com/article",
  description: "A test bookmark",
  notes: "Some notes",
  content_type: "link",
  source_type: "generic",
  tags: ["tech", "react"],
  thumbnail_url: "https://example.com/thumb.jpg",
  created_at: "2025-01-15T10:00:00Z",
  updated_at: "2025-01-15T10:00:00Z",
  user_id: "u1",
  raw_content: null,
  file_path: null,
  enriched_data: null,
  enrichment_status: "completed",
  bookmark_spaces: [
    { space_id: "s1", spaces: { id: "s1", name: "Tech" } },
  ],
};

const mockPaginatedResponse = {
  data: [mockBookmarkRaw],
  total: 1,
  page: 1,
  limit: 20,
};

// --- Tests ---

describe("bookmarkKeys", () => {
  it("generates correct key hierarchy", () => {
    expect(bookmarkKeys.all).toEqual(["bookmarks"]);
    expect(bookmarkKeys.lists()).toEqual(["bookmarks", "list"]);
    expect(bookmarkKeys.list({ type: "link" })).toEqual(["bookmarks", "list", { type: "link" }]);
    expect(bookmarkKeys.details()).toEqual(["bookmarks", "detail"]);
    expect(bookmarkKeys.detail("b1")).toEqual(["bookmarks", "detail", "b1"]);
  });
});

describe("toBookmark", () => {
  it("transforms API bookmark to frontend Bookmark type", () => {
    const result = toBookmark(mockBookmarkRaw);

    expect(result.id).toBe("b1");
    expect(result.title).toBe("Test Bookmark");
    expect(result.url).toBe("https://www.example.com/article");
    expect(result.spaceId).toBe("s1");
    expect(result.domain).toBe("example.com");
    expect(result.savedAt).toBe("Jan 15, 2025");
    expect(result.tags).toEqual([
      { id: "tech", label: "tech" },
      { id: "react", label: "react" },
    ]);
  });

  it("handles bookmark with no spaces", () => {
    const noSpaces = { ...mockBookmarkRaw, bookmark_spaces: [] };
    const result = toBookmark(noSpaces);
    expect(result.spaceId).toBe("");
  });

  it("handles bookmark with no URL", () => {
    const noUrl = { ...mockBookmarkRaw, url: null };
    const result = toBookmark(noUrl);
    expect(result.domain).toBeUndefined();
  });

  it("handles null tags", () => {
    const noTags = { ...mockBookmarkRaw, tags: null };
    const result = toBookmark(noTags);
    expect(result.tags).toEqual([]);
  });

  it("strips www. from domain", () => {
    const result = toBookmark(mockBookmarkRaw);
    // URL is https://www.example.com/article → domain should be example.com
    expect(result.domain).toBe("example.com");
  });
});

describe("shouldPollBookmarkList", () => {
  it("returns 5000 when any bookmark has pending status", () => {
    const data = {
      ...mockPaginatedResponse,
      data: [
        { ...mockBookmarkRaw, enrichment_status: "pending" },
        { ...mockBookmarkRaw, id: "b2", enrichment_status: "completed" },
      ],
    };
    expect(shouldPollBookmarkList(data)).toBe(5_000);
  });

  it("returns 5000 when any bookmark has processing status", () => {
    const data = {
      ...mockPaginatedResponse,
      data: [{ ...mockBookmarkRaw, enrichment_status: "processing" }],
    };
    expect(shouldPollBookmarkList(data)).toBe(5_000);
  });

  it("returns false when all bookmarks are completed", () => {
    const data = {
      ...mockPaginatedResponse,
      data: [{ ...mockBookmarkRaw, enrichment_status: "completed" }],
    };
    expect(shouldPollBookmarkList(data)).toBe(false);
  });

  it("returns false when all bookmarks are failed", () => {
    const data = {
      ...mockPaginatedResponse,
      data: [{ ...mockBookmarkRaw, enrichment_status: "failed" }],
    };
    expect(shouldPollBookmarkList(data)).toBe(false);
  });

  it("returns false when all bookmarks are unsupported", () => {
    const data = {
      ...mockPaginatedResponse,
      data: [{ ...mockBookmarkRaw, enrichment_status: "unsupported" }],
    };
    expect(shouldPollBookmarkList(data)).toBe(false);
  });

  it("returns false when data is undefined", () => {
    expect(shouldPollBookmarkList(undefined)).toBe(false);
  });

  it("returns false when data list is empty", () => {
    const data = { ...mockPaginatedResponse, data: [] };
    expect(shouldPollBookmarkList(data)).toBe(false);
  });

  it("returns 5000 with mixed statuses including pending", () => {
    const data = {
      ...mockPaginatedResponse,
      data: [
        { ...mockBookmarkRaw, id: "b1", enrichment_status: "completed" },
        { ...mockBookmarkRaw, id: "b2", enrichment_status: "failed" },
        { ...mockBookmarkRaw, id: "b3", enrichment_status: "pending" },
      ],
    };
    expect(shouldPollBookmarkList(data)).toBe(5_000);
  });
});

describe("shouldPollBookmarkDetail", () => {
  it("returns 5000 for pending status", () => {
    const data = { ...mockBookmarkRaw, enrichment_status: "pending" };
    expect(shouldPollBookmarkDetail(data)).toBe(5_000);
  });

  it("returns 5000 for processing status", () => {
    const data = { ...mockBookmarkRaw, enrichment_status: "processing" };
    expect(shouldPollBookmarkDetail(data)).toBe(5_000);
  });

  it("returns false for completed status", () => {
    const data = { ...mockBookmarkRaw, enrichment_status: "completed" };
    expect(shouldPollBookmarkDetail(data)).toBe(false);
  });

  it("returns false for failed status", () => {
    const data = { ...mockBookmarkRaw, enrichment_status: "failed" };
    expect(shouldPollBookmarkDetail(data)).toBe(false);
  });

  it("returns false for unsupported status", () => {
    const data = { ...mockBookmarkRaw, enrichment_status: "unsupported" };
    expect(shouldPollBookmarkDetail(data)).toBe(false);
  });

  it("returns false when data is undefined", () => {
    expect(shouldPollBookmarkDetail(undefined)).toBe(false);
  });
});

describe("useBookmarks", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches bookmarks with default params", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockPaginatedResponse);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useBookmarks(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiGet).toHaveBeenCalledWith("/api/v1/bookmarks", {
      type: undefined,
      sort: undefined,
      order: undefined,
      page: undefined,
      limit: undefined,
    });
    expect(result.current.data).toEqual(mockPaginatedResponse);
  });

  it("passes query params to API", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockPaginatedResponse);

    const { wrapper } = createHookWrapper();
    renderHook(() => useBookmarks({ type: "link", sort: "title", page: 2, limit: 10 }), {
      wrapper,
    });

    await waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith("/api/v1/bookmarks", {
        type: "link",
        sort: "title",
        order: undefined,
        page: 2,
        limit: 10,
      }),
    );
  });

  it("handles error state", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("Network error"));

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useBookmarks(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});

describe("useBookmark", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches a single bookmark by id", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockBookmarkRaw);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useBookmark("b1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledWith("/api/v1/bookmarks/b1");
    expect(result.current.data).toEqual(mockBookmarkRaw);
  });

  it("is disabled when id is null", async () => {
    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useBookmark(null), { wrapper });

    // Should not fetch — query stays idle
    expect(result.current.fetchStatus).toBe("idle");
    expect(apiGet).not.toHaveBeenCalled();
  });
});

describe("useCreateBookmark", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
    vi.mocked(apiPostFormData).mockReset();
  });

  it("creates a bookmark with JSON body", async () => {
    const created = { id: "b2", signed_url: null };
    vi.mocked(apiPost).mockResolvedValue(created);

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateBookmark(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        content_type: "link",
        url: "https://example.com",
      });
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/bookmarks", {
      content_type: "link",
      url: "https://example.com",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookmarkKeys.all });
  });

  it("creates a bookmark with FormData when file is present", async () => {
    const created = { id: "b3", signed_url: "https://s3/file" };
    vi.mocked(apiPostFormData).mockResolvedValue(created);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useCreateBookmark(), { wrapper });

    const file = new File(["content"], "doc.pdf", { type: "application/pdf" });

    await act(async () => {
      await result.current.mutateAsync({
        content_type: "pdf",
        title: "My PDF",
        file,
      });
    });

    expect(apiPostFormData).toHaveBeenCalledOnce();
    const formData = vi.mocked(apiPostFormData).mock.calls[0][1] as FormData;
    expect(formData.get("content_type")).toBe("pdf");
    expect(formData.get("title")).toBe("My PDF");
    expect(formData.get("file")).toBe(file);
    expect(apiPost).not.toHaveBeenCalled();
  });
});

describe("useUpdateBookmark", () => {
  beforeEach(() => {
    vi.mocked(apiPatch).mockReset();
  });

  it("updates a bookmark and invalidates cache", async () => {
    vi.mocked(apiPatch).mockResolvedValue({ ...mockBookmarkRaw, title: "Updated" });

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateBookmark(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "b1", title: "Updated" });
    });

    expect(apiPatch).toHaveBeenCalledWith("/api/v1/bookmarks/b1", { title: "Updated" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookmarkKeys.detail("b1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookmarkKeys.lists() });
  });
});

describe("useDeleteBookmark", () => {
  beforeEach(() => {
    vi.mocked(apiDelete).mockReset();
  });

  it("deletes a bookmark and invalidates all bookmark queries", async () => {
    vi.mocked(apiDelete).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteBookmark(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("b1");
    });

    expect(apiDelete).toHaveBeenCalledWith("/api/v1/bookmarks/b1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookmarkKeys.all });
  });
});
