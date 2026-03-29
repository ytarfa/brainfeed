import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

// --- Response types ---

interface RuleRow {
  id: string;
  space_id: string;
  rule_type: string;
  rule_value: string;
  created_at: string;
  updated_at: string;
}

// --- Mutation params ---

interface CreateRuleParams {
  spaceId: string;
  rule_type: string;
  rule_value: string;
}

interface UpdateRuleParams {
  spaceId: string;
  ruleId: string;
  rule_type?: string;
  rule_value?: string;
}

interface DeleteRuleParams {
  spaceId: string;
  ruleId: string;
}

// --- Query keys ---

export const ruleKeys = {
  all: ["rules"] as const,
  lists: () => [...ruleKeys.all, "list"] as const,
  list: (spaceId: string) => [...ruleKeys.lists(), spaceId] as const,
};

// --- Hooks ---

export function useRules(spaceId: string | undefined) {
  return useQuery({
    queryKey: ruleKeys.list(spaceId ?? ""),
    queryFn: () =>
      apiGet<{ data: RuleRow[] }>(`/api/v1/spaces/${spaceId}/rules`),
    enabled: !!spaceId,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, ...body }: CreateRuleParams) =>
      apiPost<RuleRow>(`/api/v1/spaces/${spaceId}/rules`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ruleKeys.list(variables.spaceId) });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, ruleId, ...body }: UpdateRuleParams) =>
      apiPatch<RuleRow>(`/api/v1/spaces/${spaceId}/rules/${ruleId}`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ruleKeys.list(variables.spaceId) });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, ruleId }: DeleteRuleParams) =>
      apiDelete(`/api/v1/spaces/${spaceId}/rules/${ruleId}`),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ruleKeys.list(variables.spaceId) });
    },
  });
}

export type { RuleRow };
