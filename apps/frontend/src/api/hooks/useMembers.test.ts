import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

import { createHookWrapper } from "../../test/test-utils";
import {
  useMembers,
  useInviteMember,
  useUpdateMember,
  useRemoveMember,
  memberKeys,
} from "./useMembers";

vi.mock("../client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

const mockMember = {
  id: "m1",
  role: "editor",
  invited_at: "2025-01-01T00:00:00Z",
  accepted_at: "2025-01-02T00:00:00Z",
  profiles: {
    id: "u2",
    display_name: "Jane Doe",
    avatar_url: null,
  },
};

describe("memberKeys", () => {
  it("generates correct key hierarchy", () => {
    expect(memberKeys.all).toEqual(["members"]);
    expect(memberKeys.lists()).toEqual(["members", "list"]);
    expect(memberKeys.list("s1")).toEqual(["members", "list", "s1"]);
  });
});

describe("useMembers", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches members for a space", async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [mockMember] });

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useMembers("s1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledWith("/api/v1/spaces/s1/members");
    expect(result.current.data?.data).toHaveLength(1);
  });

  it("is disabled when spaceId is undefined", () => {
    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useMembers(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useInviteMember", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
  });

  it("invites a member and invalidates cache", async () => {
    vi.mocked(apiPost).mockResolvedValue(mockMember);

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useInviteMember(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        spaceId: "s1",
        email: "jane@example.com",
        role: "editor",
      });
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/spaces/s1/members", {
      email: "jane@example.com",
      role: "editor",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: memberKeys.list("s1") });
  });
});

describe("useUpdateMember", () => {
  beforeEach(() => {
    vi.mocked(apiPatch).mockReset();
  });

  it("updates a member role and invalidates cache", async () => {
    vi.mocked(apiPatch).mockResolvedValue({ ...mockMember, role: "viewer" });

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateMember(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ spaceId: "s1", memberId: "m1", role: "viewer" });
    });

    expect(apiPatch).toHaveBeenCalledWith("/api/v1/spaces/s1/members/m1", { role: "viewer" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: memberKeys.list("s1") });
  });
});

describe("useRemoveMember", () => {
  beforeEach(() => {
    vi.mocked(apiDelete).mockReset();
  });

  it("removes a member and invalidates cache", async () => {
    vi.mocked(apiDelete).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRemoveMember(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ spaceId: "s1", memberId: "m1" });
    });

    expect(apiDelete).toHaveBeenCalledWith("/api/v1/spaces/s1/members/m1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: memberKeys.list("s1") });
  });
});
