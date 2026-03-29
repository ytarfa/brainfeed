import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

// --- Response types ---

interface SyncSourceRow {
  id: string;
  platform: string;
  external_id: string;
  external_name: string | null;
  space_id: string;
  sync_frequency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface SyncSourceWithSpace extends SyncSourceRow {
  spaces: { id: string; name: string };
}

// --- Mutation params ---

interface CreateSyncSourceParams {
  platform: "youtube" | "spotify" | "rss" | "reddit";
  external_id: string;
  external_name?: string;
  space_id: string;
  sync_frequency: "15min" | "1h" | "6h" | "daily";
}

interface UpdateSyncSourceParams {
  id: string;
  sync_frequency?: string;
  space_id?: string;
  is_active?: boolean;
}

// --- Query keys ---

export const syncSourceKeys = {
  all: ["syncSources"] as const,
  lists: () => [...syncSourceKeys.all, "list"] as const,
  list: () => [...syncSourceKeys.lists(), "all"] as const,
};

// --- Hooks ---

export function useSyncSources() {
  return useQuery({
    queryKey: syncSourceKeys.list(),
    queryFn: () =>
      apiGet<{ data: SyncSourceWithSpace[] }>("/api/v1/sync-sources"),
  });
}

export function useCreateSyncSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateSyncSourceParams) =>
      apiPost<SyncSourceRow>("/api/v1/sync-sources", params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: syncSourceKeys.all });
    },
  });
}

export function useUpdateSyncSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateSyncSourceParams) =>
      apiPatch<SyncSourceRow>(`/api/v1/sync-sources/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: syncSourceKeys.all });
    },
  });
}

export function useDeleteSyncSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete(`/api/v1/sync-sources/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: syncSourceKeys.all });
    },
  });
}

export type { SyncSourceRow, SyncSourceWithSpace };
