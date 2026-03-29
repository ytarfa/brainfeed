import { useQuery } from "@tanstack/react-query";

import { apiGet } from "../client";

// --- Response types ---

interface SearchBookmark extends Record<string, unknown> {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  content_type: string;
  source_type: string | null;
  tags: string[] | null;
  thumbnail_url: string | null;
  created_at: string;
  bookmark_spaces: {
    space_id: string;
    spaces: { id: string; name: string };
  }[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number | null;
  page: number;
  limit: number;
}

// --- Query params ---

interface SearchParams {
  q: string;
  type?: string;
  space_id?: string;
  page?: number;
  limit?: number;
}

// --- Query keys ---

export const searchKeys = {
  all: ["search"] as const,
  results: (params: SearchParams) => [...searchKeys.all, params] as const,
};

// --- Hooks ---

export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: searchKeys.results(params),
    queryFn: () =>
      apiGet<PaginatedResponse<SearchBookmark>>("/api/v1/search", {
        q: params.q,
        type: params.type,
        space_id: params.space_id,
        page: params.page,
        limit: params.limit,
      }),
    enabled: params.q.length > 0,
  });
}

export type { SearchBookmark, SearchParams };
