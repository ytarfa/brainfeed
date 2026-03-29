import { useQuery } from "@tanstack/react-query";

import { apiGet } from "../client";

// --- Response types ---

interface PublicSpaceBookmark {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  content_type: string;
  source_type: string;
  thumbnail_url: string | null;
  tags: string[] | null;
  created_at: string;
  bookmark_spaces: { space_id: string }[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number | null;
  page: number;
  limit: number;
}

interface PublicSpaceResponse {
  space: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  };
  bookmarks: PaginatedResponse<PublicSpaceBookmark>;
}

// --- Query params ---

interface PublicSpaceParams {
  page?: number;
  limit?: number;
}

// --- Query keys ---

export const publicSpaceKeys = {
  all: ["publicSpace"] as const,
  detail: (shareToken: string, params?: PublicSpaceParams) =>
    [...publicSpaceKeys.all, shareToken, params ?? {}] as const,
};

// --- Hooks ---

export function usePublicSpace(shareToken: string | undefined, params: PublicSpaceParams = {}) {
  return useQuery({
    queryKey: publicSpaceKeys.detail(shareToken ?? "", params),
    queryFn: () =>
      apiGet<PublicSpaceResponse>(`/api/v1/public/spaces/${shareToken}`, {
        page: params.page,
        limit: params.limit,
      }),
    enabled: !!shareToken,
  });
}

export type { PublicSpaceResponse, PublicSpaceBookmark };
