import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { createHookWrapper } from "../../test/test-utils";
import { useActivity, activityKeys } from "./useActivity";

vi.mock("../client", () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from "../client";

const mockActivity = {
  data: [
    {
      id: "a1",
      action: "created",
      details: null,
      created_at: "2025-01-15T10:00:00Z",
      bookmarks: { id: "b1", title: "Test Bookmark" },
      profiles: { id: "u1", display_name: "John", avatar_url: null },
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

describe("activityKeys", () => {
  it("generates correct key hierarchy", () => {
    expect(activityKeys.all).toEqual(["activity"]);
    expect(activityKeys.lists()).toEqual(["activity", "list"]);
    expect(activityKeys.list("s1")).toEqual(["activity", "list", "s1", {}]);
    expect(activityKeys.list("s1", { page: 2, limit: 10 })).toEqual([
      "activity",
      "list",
      "s1",
      { page: 2, limit: 10 },
    ]);
  });
});

describe("useActivity", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches activity for a space", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockActivity);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useActivity("s1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledWith("/api/v1/spaces/s1/activity", {
      page: undefined,
      limit: undefined,
    });
    expect(result.current.data?.data).toHaveLength(1);
  });

  it("passes pagination params", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockActivity);

    const { wrapper } = createHookWrapper();
    renderHook(() => useActivity("s1", { page: 2, limit: 10 }), { wrapper });

    await waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith("/api/v1/spaces/s1/activity", {
        page: 2,
        limit: 10,
      }),
    );
  });

  it("is disabled when spaceId is undefined", () => {
    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useActivity(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
