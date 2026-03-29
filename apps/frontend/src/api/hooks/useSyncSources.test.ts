import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

import { createHookWrapper } from "../../test/test-utils";
import {
  useSyncSources,
  useCreateSyncSource,
  useUpdateSyncSource,
  useDeleteSyncSource,
  syncSourceKeys,
} from "./useSyncSources";

vi.mock("../client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

const mockSyncSource = {
  id: "ss1",
  platform: "youtube",
  external_id: "UC123",
  external_name: "Tech Channel",
  space_id: "s1",
  sync_frequency: "daily",
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  user_id: "u1",
  spaces: { id: "s1", name: "Tech" },
};

describe("syncSourceKeys", () => {
  it("generates correct key hierarchy", () => {
    expect(syncSourceKeys.all).toEqual(["syncSources"]);
    expect(syncSourceKeys.lists()).toEqual(["syncSources", "list"]);
    expect(syncSourceKeys.list()).toEqual(["syncSources", "list", "all"]);
  });
});

describe("useSyncSources", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches all sync sources", async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [mockSyncSource] });

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useSyncSources(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledWith("/api/v1/sync-sources");
    expect(result.current.data?.data).toHaveLength(1);
  });
});

describe("useCreateSyncSource", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
  });

  it("creates a sync source and invalidates cache", async () => {
    vi.mocked(apiPost).mockResolvedValue(mockSyncSource);

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateSyncSource(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        platform: "youtube",
        external_id: "UC123",
        external_name: "Tech Channel",
        space_id: "s1",
        sync_frequency: "daily",
      });
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/sync-sources", {
      platform: "youtube",
      external_id: "UC123",
      external_name: "Tech Channel",
      space_id: "s1",
      sync_frequency: "daily",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: syncSourceKeys.all });
  });
});

describe("useUpdateSyncSource", () => {
  beforeEach(() => {
    vi.mocked(apiPatch).mockReset();
  });

  it("updates a sync source and invalidates cache", async () => {
    vi.mocked(apiPatch).mockResolvedValue({ ...mockSyncSource, sync_frequency: "1h" });

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateSyncSource(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "ss1", sync_frequency: "1h" });
    });

    expect(apiPatch).toHaveBeenCalledWith("/api/v1/sync-sources/ss1", { sync_frequency: "1h" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: syncSourceKeys.all });
  });
});

describe("useDeleteSyncSource", () => {
  beforeEach(() => {
    vi.mocked(apiDelete).mockReset();
  });

  it("deletes a sync source and invalidates cache", async () => {
    vi.mocked(apiDelete).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteSyncSource(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("ss1");
    });

    expect(apiDelete).toHaveBeenCalledWith("/api/v1/sync-sources/ss1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: syncSourceKeys.all });
  });
});
