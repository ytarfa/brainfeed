import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

import { createHookWrapper } from "../../test/test-utils";
import {
  useSpaces,
  useSpace,
  useCreateSpace,
  useUpdateSpace,
  useDeleteSpace,
  useShareSpace,
  useUnshareSpace,
  spaceKeys,
} from "./useSpaces";

vi.mock("../client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

// --- Fixtures ---

const mockSpaceListItem = {
  id: "s1",
  name: "Tech",
  description: "Tech bookmarks",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  user_id: "u1",
  share_token: null,
  ai_auto_categorize: true,
  color: "#3b82f6",
  bookmark_spaces: [{ count: 5 }],
  space_members: [
    {
      user_id: "u1",
      role: "owner",
      profiles: { display_name: "John", avatar_url: null },
    },
  ],
};

const mockSpaceDetail = {
  id: "s1",
  name: "Tech",
  description: "Tech bookmarks",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  user_id: "u1",
  share_token: null,
  ai_auto_categorize: true,
  color: "#3b82f6",
  space_members: [
    {
      user_id: "u1",
      role: "owner",
      profiles: { display_name: "John", avatar_url: null },
    },
  ],
  bookmarks: {
    data: [],
    total: 0,
    page: 1,
    limit: 20,
  },
};

// --- Tests ---

describe("spaceKeys", () => {
  it("generates correct key hierarchy", () => {
    expect(spaceKeys.all).toEqual(["spaces"]);
    expect(spaceKeys.lists()).toEqual(["spaces", "list"]);
    expect(spaceKeys.list()).toEqual(["spaces", "list", "all"]);
    expect(spaceKeys.details()).toEqual(["spaces", "detail"]);
    expect(spaceKeys.detail("s1")).toEqual(["spaces", "detail", "s1", {}]);
    expect(spaceKeys.detail("s1", { sort: "title" })).toEqual([
      "spaces",
      "detail",
      "s1",
      { sort: "title" },
    ]);
  });
});

describe("useSpaces", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches all spaces", async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [mockSpaceListItem] });

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useSpaces(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledWith("/api/v1/spaces");
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].name).toBe("Tech");
  });
});

describe("useSpace", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches a single space with bookmarks", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockSpaceDetail);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useSpace("s1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledWith("/api/v1/spaces/s1", {
      sort: undefined,
      order: undefined,
      type: undefined,
      page: undefined,
      limit: undefined,
    });
  });

  it("passes bookmark params to API", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockSpaceDetail);

    const { wrapper } = createHookWrapper();
    renderHook(() => useSpace("s1", { sort: "title", type: "link" }), { wrapper });

    await waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith("/api/v1/spaces/s1", {
        sort: "title",
        order: undefined,
        type: "link",
        page: undefined,
        limit: undefined,
      }),
    );
  });

  it("is disabled when id is undefined", () => {
    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useSpace(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(apiGet).not.toHaveBeenCalled();
  });
});

describe("useCreateSpace", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
  });

  it("creates a space and invalidates cache", async () => {
    vi.mocked(apiPost).mockResolvedValue({ id: "s2", name: "Design" });

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateSpace(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: "Design", description: "Design bookmarks" });
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/spaces", {
      name: "Design",
      description: "Design bookmarks",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: spaceKeys.all });
  });
});

describe("useUpdateSpace", () => {
  beforeEach(() => {
    vi.mocked(apiPatch).mockReset();
  });

  it("updates a space and invalidates detail + lists", async () => {
    vi.mocked(apiPatch).mockResolvedValue({ id: "s1", name: "Updated" });

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateSpace(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "s1", name: "Updated" });
    });

    expect(apiPatch).toHaveBeenCalledWith("/api/v1/spaces/s1", { name: "Updated" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: spaceKeys.detail("s1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: spaceKeys.lists() });
  });
});

describe("useDeleteSpace", () => {
  beforeEach(() => {
    vi.mocked(apiDelete).mockReset();
  });

  it("deletes a space and invalidates all space queries", async () => {
    vi.mocked(apiDelete).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteSpace(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("s1");
    });

    expect(apiDelete).toHaveBeenCalledWith("/api/v1/spaces/s1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: spaceKeys.all });
  });
});

describe("useShareSpace", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
  });

  it("shares a space and invalidates cache", async () => {
    vi.mocked(apiPost).mockResolvedValue({ id: "s1", share_token: "abc123" });

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useShareSpace(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("s1");
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/spaces/s1/share");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: spaceKeys.detail("s1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: spaceKeys.lists() });
  });
});

describe("useUnshareSpace", () => {
  beforeEach(() => {
    vi.mocked(apiDelete).mockReset();
  });

  it("unshares a space and invalidates cache", async () => {
    vi.mocked(apiDelete).mockResolvedValue({ id: "s1" });

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUnshareSpace(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("s1");
    });

    expect(apiDelete).toHaveBeenCalledWith("/api/v1/spaces/s1/share");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: spaceKeys.detail("s1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: spaceKeys.lists() });
  });
});
