import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPost, apiPatch, apiDelete, apiPostFormData } from "../client";
import type { Bookmark } from "../../data/mock";
import { timeAgo } from "../../lib/utils";
import { isEnriching } from "../../lib/bookmark-status";
import { tagKeys } from "./useTags";

/** Poll interval (ms) used while any bookmark is still enriching. */
const ENRICHMENT_POLL_INTERVAL = 5_000;

// --- Response types ---

interface BookmarkSpaceJoin {
  space_id: string;
  spaces: { id: string; name: string };
}

interface BookmarkWithSpaces extends Record<string, unknown> {
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
  bookmark_spaces: BookmarkSpaceJoin[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number | null;
  page: number;
  limit: number;
}

interface CreateBookmarkResponse extends Record<string, unknown> {
  id: string;
  signed_url: string | null;
}

// --- Query params ---

interface BookmarkListParams {
  type?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

// --- Mutation params ---

interface CreateBookmarkParams {
  content_type: string;
  url?: string;
  title?: string;
  description?: string;
  notes?: string;
  space_ids?: string[];
  tags?: string[];
  raw_content?: string;
  file?: File;
}

interface UpdateBookmarkParams {
  id: string;
  title?: string;
  notes?: string;
  tags?: string[];
  description?: string;
  space_ids?: string[];
}

// --- Query keys ---

export const bookmarkKeys = {
  all: ["bookmarks"] as const,
  lists: () => [...bookmarkKeys.all, "list"] as const,
  list: (params: BookmarkListParams) => [...bookmarkKeys.lists(), params] as const,
  details: () => [...bookmarkKeys.all, "detail"] as const,
  detail: (id: string) => [...bookmarkKeys.details(), id] as const,
};

// --- Polling helpers (exported for testing) ---

/** Returns `ENRICHMENT_POLL_INTERVAL` if any bookmark in the list is enriching, otherwise `false`. */
export function shouldPollBookmarkList(
  data: PaginatedResponse<BookmarkWithSpaces> | undefined,
): number | false {
  const items = data?.data;
  if (!items) return false;
  const hasEnriching = items.some((b) =>
    isEnriching(b.enrichment_status as Bookmark["enrichment_status"]),
  );
  return hasEnriching ? ENRICHMENT_POLL_INTERVAL : false;
}

/** Returns `ENRICHMENT_POLL_INTERVAL` if the bookmark is enriching, otherwise `false`. */
export function shouldPollBookmarkDetail(
  data: BookmarkWithSpaces | undefined,
): number | false {
  if (!data) return false;
  return isEnriching(data.enrichment_status as Bookmark["enrichment_status"])
    ? ENRICHMENT_POLL_INTERVAL
    : false;
}

// --- Hooks ---

export function useBookmarks(params: BookmarkListParams = {}) {
  return useQuery({
    queryKey: bookmarkKeys.list(params),
    queryFn: () =>
      apiGet<PaginatedResponse<BookmarkWithSpaces>>("/api/v1/bookmarks", {
        type: params.type,
        sort: params.sort,
        order: params.order,
        page: params.page,
        limit: params.limit,
      }),
    refetchInterval: (query) => shouldPollBookmarkList(query.state.data),
  });
}

export function useBookmark(id: string | null) {
  return useQuery({
    queryKey: bookmarkKeys.detail(id ?? ""),
    queryFn: () => apiGet<BookmarkWithSpaces>(`/api/v1/bookmarks/${id}`),
    enabled: !!id,
    refetchInterval: (query) => shouldPollBookmarkDetail(query.state.data),
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateBookmarkParams) => {
      if (params.file) {
        const formData = new FormData();
        formData.append("content_type", params.content_type);
        if (params.url) formData.append("url", params.url);
        if (params.title) formData.append("title", params.title);
        if (params.description) formData.append("description", params.description);
        if (params.notes) formData.append("notes", params.notes);
        if (params.raw_content) formData.append("raw_content", params.raw_content);
        if (params.space_ids) formData.append("space_ids", JSON.stringify(params.space_ids));
        if (params.tags) formData.append("tags", JSON.stringify(params.tags));
        formData.append("file", params.file);
        return apiPostFormData<CreateBookmarkResponse>("/api/v1/bookmarks", formData);
      }

      const { file: _file, ...body } = params;
      return apiPost<CreateBookmarkResponse>("/api/v1/bookmarks", body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
      void queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateBookmarkParams) =>
      apiPatch<BookmarkWithSpaces>(`/api/v1/bookmarks/${id}`, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: bookmarkKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/bookmarks/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
      void queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

// --- Utility: Transform API bookmark to frontend Bookmark type ---

export function toBookmark(raw: BookmarkWithSpaces): Bookmark {
  const spaceId = raw.bookmark_spaces?.[0]?.space_id ?? "";
  return {
    id: raw.id,
    title: raw.title ?? "",
    url: raw.url,
    description: raw.description,
    notes: raw.notes,
    content_type: raw.content_type as Bookmark["content_type"],
    source_type: (raw.source_type ?? null) as Bookmark["source_type"],
    tags: (raw.tags ?? []).map((t: string) => ({ id: t, label: t })),
    thumbnail_url: raw.thumbnail_url,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    user_id: raw.user_id,
    spaceId,
    savedAt: timeAgo(raw.created_at),
    domain: raw.url ? new URL(raw.url).hostname.replace("www.", "") : undefined,
    raw_content: (raw.raw_content as string) ?? null,
    file_path: (raw.file_path as string) ?? null,
    enriched_data: (raw.enriched_data ?? null) as Bookmark["enriched_data"],
    enrichment_status: (raw.enrichment_status ?? "pending") as Bookmark["enrichment_status"],
    digest_status: ((raw.digest_status as string) ?? null) as Bookmark["digest_status"],
    source_name: (raw.source_name as string) ?? null,
    source_id: (raw.source_id as string) ?? null,
    published_at: (raw.published_at as string) ?? null,
    expires_at: (raw.expires_at as string) ?? null,
  };
}
