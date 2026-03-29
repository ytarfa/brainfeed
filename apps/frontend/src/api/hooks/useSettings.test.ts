import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

import { createHookWrapper } from "../../test/test-utils";
import { useProfile, useUpdateProfile, useDeleteAccount, settingsKeys } from "./useSettings";

vi.mock("../client", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiGet, apiPatch, apiDelete } from "../client";

const mockProfile = {
  id: "u1",
  display_name: "John Doe",
  avatar_url: "https://example.com/avatar.jpg",
  email: "john@example.com",
  onboarding_completed: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-15T00:00:00Z",
};

describe("settingsKeys", () => {
  it("generates correct key hierarchy", () => {
    expect(settingsKeys.all).toEqual(["settings"]);
    expect(settingsKeys.profile()).toEqual(["settings", "profile"]);
  });
});

describe("useProfile", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches user profile", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockProfile);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledWith("/api/v1/settings/profile");
    expect(result.current.data?.display_name).toBe("John Doe");
  });
});

describe("useUpdateProfile", () => {
  beforeEach(() => {
    vi.mocked(apiPatch).mockReset();
  });

  it("updates profile and invalidates cache", async () => {
    vi.mocked(apiPatch).mockResolvedValue({ ...mockProfile, display_name: "Jane Doe" });

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ display_name: "Jane Doe" });
    });

    expect(apiPatch).toHaveBeenCalledWith("/api/v1/settings/profile", {
      display_name: "Jane Doe",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: settingsKeys.profile() });
  });
});

describe("useDeleteAccount", () => {
  beforeEach(() => {
    vi.mocked(apiDelete).mockReset();
  });

  it("deletes user account", async () => {
    vi.mocked(apiDelete).mockResolvedValue(undefined);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(apiDelete).toHaveBeenCalledWith("/api/v1/settings/account");
  });
});
