import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

// --- Response types ---

interface MemberRow {
  id: string;
  role: string;
  invited_at: string;
  accepted_at: string | null;
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

// --- Mutation params ---

interface InviteMemberParams {
  spaceId: string;
  email: string;
  role: "editor" | "viewer";
}

interface UpdateMemberParams {
  spaceId: string;
  memberId: string;
  role: "editor" | "viewer";
}

interface RemoveMemberParams {
  spaceId: string;
  memberId: string;
}

// --- Query keys ---

export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (spaceId: string) => [...memberKeys.lists(), spaceId] as const,
};

// --- Hooks ---

export function useMembers(spaceId: string | undefined) {
  return useQuery({
    queryKey: memberKeys.list(spaceId ?? ""),
    queryFn: () =>
      apiGet<{ data: MemberRow[] }>(`/api/v1/spaces/${spaceId}/members`),
    enabled: !!spaceId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, ...body }: InviteMemberParams) =>
      apiPost<MemberRow>(`/api/v1/spaces/${spaceId}/members`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.list(variables.spaceId) });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, memberId, ...body }: UpdateMemberParams) =>
      apiPatch<MemberRow>(`/api/v1/spaces/${spaceId}/members/${memberId}`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.list(variables.spaceId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, memberId }: RemoveMemberParams) =>
      apiDelete(`/api/v1/spaces/${spaceId}/members/${memberId}`),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.list(variables.spaceId) });
    },
  });
}

export type { MemberRow };
