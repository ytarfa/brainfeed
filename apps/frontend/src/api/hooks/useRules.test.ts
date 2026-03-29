import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

import { createHookWrapper } from "../../test/test-utils";
import { useRules, useCreateRule, useUpdateRule, useDeleteRule, ruleKeys } from "./useRules";

vi.mock("../client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

const mockRule = {
  id: "r1",
  space_id: "s1",
  rule_type: "tag",
  rule_value: "react",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("ruleKeys", () => {
  it("generates correct key hierarchy", () => {
    expect(ruleKeys.all).toEqual(["rules"]);
    expect(ruleKeys.lists()).toEqual(["rules", "list"]);
    expect(ruleKeys.list("s1")).toEqual(["rules", "list", "s1"]);
  });
});

describe("useRules", () => {
  beforeEach(() => { vi.mocked(apiGet).mockReset(); });

  it("fetches rules for a space", async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [mockRule] });

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useRules("s1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledWith("/api/v1/spaces/s1/rules");
    expect(result.current.data?.data).toHaveLength(1);
  });

  it("is disabled when spaceId is undefined", () => {
    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useRules(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateRule", () => {
  beforeEach(() => { vi.mocked(apiPost).mockReset(); });

  it("creates a rule and invalidates cache", async () => {
    vi.mocked(apiPost).mockResolvedValue(mockRule);

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateRule(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ spaceId: "s1", rule_type: "tag", rule_value: "react" });
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/spaces/s1/rules", {
      rule_type: "tag",
      rule_value: "react",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ruleKeys.list("s1") });
  });
});

describe("useUpdateRule", () => {
  beforeEach(() => { vi.mocked(apiPatch).mockReset(); });

  it("updates a rule and invalidates cache", async () => {
    vi.mocked(apiPatch).mockResolvedValue({ ...mockRule, rule_value: "typescript" });

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateRule(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ spaceId: "s1", ruleId: "r1", rule_value: "typescript" });
    });

    expect(apiPatch).toHaveBeenCalledWith("/api/v1/spaces/s1/rules/r1", {
      rule_value: "typescript",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ruleKeys.list("s1") });
  });
});

describe("useDeleteRule", () => {
  beforeEach(() => { vi.mocked(apiDelete).mockReset(); });

  it("deletes a rule and invalidates cache", async () => {
    vi.mocked(apiDelete).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createHookWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteRule(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ spaceId: "s1", ruleId: "r1" });
    });

    expect(apiDelete).toHaveBeenCalledWith("/api/v1/spaces/s1/rules/r1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ruleKeys.list("s1") });
  });
});
