import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

// --- Response types ---

interface SpaceMember {
  user_id: string;
  role: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface BookmarkSpaceCount {
  count: number;
}

interface SpaceListItem extends Record<string, unknown> {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  share_token: string | null;
  ai_auto_categorize: boolean;
  color: string | null;
  bookmark_spaces: BookmarkSpaceCount[];
  space_members: SpaceMember[];
}

interface BookmarkInSpace extends Record<string, unknown> {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  notes: string | null;
  content_type: string;
  source_type: string | null;
  tags: string[] | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  bookmark_spaces: { space_id: string }[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number | null;
  page: number;
  limit: number;
}

interface SpaceDetailResponse extends Record<string, unknown> {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  share_token: string | null;
  ai_auto_categorize: boolean;
  color: string | null;
  space_members: SpaceMember[];
  bookmarks: PaginatedResponse<BookmarkInSpace>;
}

interface SpaceRow extends Record<string, unknown> {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  share_token: string | null;
  ai_auto_categorize: boolean;
}

// --- Query params ---

interface SpaceBookmarkParams {
  sort?: string;
  order?: string;
  type?: string;
  page?: number;
  limit?: number;
}

// --- Mutation params ---

interface CreateSpaceParams {
  name: string;
  description?: string;
}

interface UpdateSpaceParams {
  id: string;
  name?: string;
  description?: string;
  ai_auto_categorize?: boolean;
}

// --- Query keys ---

export const spaceKeys = {
  all: ["spaces"] as const,
  lists: () => [...spaceKeys.all, "list"] as const,
  list: () => [...spaceKeys.lists(), "all"] as const,
  details: () => [...spaceKeys.all, "detail"] as const,
  detail: (id: string, params?: SpaceBookmarkParams) => [...spaceKeys.details(), id, params ?? {}] as const,
};

// --- Hooks ---

export function useSpaces() {
  return useQuery({
    queryKey: spaceKeys.list(),
    queryFn: () => apiGet<{ data: SpaceListItem[] }>("/api/v1/spaces"),
  });
}

export function useSpace(id: string | undefined, params: SpaceBookmarkParams = {}) {
  return useQuery({
    queryKey: spaceKeys.detail(id ?? "", params),
    queryFn: () =>
      apiGet<SpaceDetailResponse>(`/api/v1/spaces/${id}`, {
        sort: params.sort,
        order: params.order,
        type: params.type,
        page: params.page,
        limit: params.limit,
      }),
    enabled: !!id,
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateSpaceParams) =>
      apiPost<SpaceRow>("/api/v1/spaces", params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: spaceKeys.all });
    },
  });
}

export function useUpdateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateSpaceParams) =>
      apiPatch<SpaceRow>(`/api/v1/spaces/${id}`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: spaceKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: spaceKeys.lists() });
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/spaces/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: spaceKeys.all });
    },
  });
}

export function useShareSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPost<{ id: string; share_token: string }>(`/api/v1/spaces/${id}/share`),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: spaceKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: spaceKeys.lists() });
    },
  });
}

export function useUnshareSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/api/v1/spaces/${id}/share`),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: spaceKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: spaceKeys.lists() });
    },
  });
}

// --- Utility exports for typing ---

export type { SpaceListItem, SpaceDetailResponse, SpaceMember, BookmarkInSpace };
