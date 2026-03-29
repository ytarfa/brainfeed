import { useQuery } from "@tanstack/react-query";
import type { Json } from "@brain-feed/types";

import { apiGet } from "../client";

// --- Response types ---

interface ActivityRow {
  id: string;
  action: string;
  details: Json | null;
  created_at: string;
  bookmarks: {
    id: string;
    title: string;
  };
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  total: number | null;
  page: number;
  limit: number;
}

// --- Query params ---

interface ActivityParams {
  page?: number;
  limit?: number;
}

// --- Query keys ---

export const activityKeys = {
  all: ["activity"] as const,
  lists: () => [...activityKeys.all, "list"] as const,
  list: (spaceId: string, params?: ActivityParams) => [...activityKeys.lists(), spaceId, params ?? {}] as const,
};

// --- Hooks ---

export function useActivity(spaceId: string | undefined, params: ActivityParams = {}) {
  return useQuery({
    queryKey: activityKeys.list(spaceId ?? "", params),
    queryFn: () =>
      apiGet<PaginatedResponse<ActivityRow>>(`/api/v1/spaces/${spaceId}/activity`, {
        page: params.page,
        limit: params.limit,
      }),
    enabled: !!spaceId,
  });
}

export type { ActivityRow };
