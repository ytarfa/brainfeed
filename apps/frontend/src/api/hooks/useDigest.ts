import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPost, apiDelete } from "../client";
import type { DigestCandidate, Bookmark } from "../../data/mock";
import { timeAgo } from "../../lib/utils";

// --- Response types ---

/**
 * A bookmark row returned by the digest endpoints.
 * Digest candidates are now bookmarks with digest_status = 'active'.
 */
interface DigestBookmarkRow {
  id: string;
  user_id: string;
  url: string | null;
  title: string | null;
  description: string | null;
  notes: string | null;
  content_type: string;
  source_type: string | null;
  tags: string[] | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  enrichment_status: string;
  enriched_data: unknown;
  raw_content: string | null;
  file_path: string | null;
  digest_status: string;
  source_name: string | null;
  source_id: string | null;
  published_at: string | null;
  expires_at: string | null;
}

export interface DigestGroup {
  source_name: string;
  source_type: string;
  candidates: DigestBookmarkRow[];
}

interface DigestListResponse {
  data: DigestGroup[];
}

export interface DigestSummaryGroup {
  source_name: string;
  source_type: string;
  count: number;
}

interface DigestSummaryResponse {
  total: number;
  groups: DigestSummaryGroup[];
}

// --- Query keys ---

export const digestKeys = {
  all: ["digest"] as const,
  list: () => [...digestKeys.all, "list"] as const,
  summary: () => [...digestKeys.all, "summary"] as const,
};

// --- Utility: Transform API bookmark row to frontend DigestCandidate type ---

export function toDigestCandidate(raw: DigestBookmarkRow): DigestCandidate {
  return {
    id: raw.id,
    user_id: raw.user_id,
    url: raw.url,
    title: raw.title ?? "",
    description: raw.description,
    notes: raw.notes,
    content_type: raw.content_type as Bookmark["content_type"],
    source_type: (raw.source_type ?? null) as Bookmark["source_type"],
    tags: (raw.tags ?? []).map((t: string) => ({ id: t, label: t })),
    thumbnail_url: raw.thumbnail_url,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    enrichment_status: (raw.enrichment_status ?? "pending") as Bookmark["enrichment_status"],
    enriched_data: (raw.enriched_data ?? null) as Bookmark["enriched_data"],
    raw_content: (raw.raw_content as string) ?? null,
    file_path: (raw.file_path as string) ?? null,
    digest_status: "active" as const,
    source_name: raw.source_name,
    source_id: raw.source_id,
    published_at: raw.published_at,
    expires_at: raw.expires_at,
    spaceId: "",
    savedAt: timeAgo(raw.created_at),
    domain: raw.url ? (() => { try { return new URL(raw.url).hostname.replace("www.", ""); } catch { return undefined; } })() : undefined,
  };
}

// --- Hooks ---

export function useDigest() {
  return useQuery({
    queryKey: digestKeys.list(),
    queryFn: async () => {
      const res = await apiGet<DigestListResponse>("/api/v1/digest");
      return res.data.map((group) => ({
        ...group,
        candidates: group.candidates.map(toDigestCandidate),
      }));
    },
  });
}

export function useDigestSummary() {
  return useQuery({
    queryKey: digestKeys.summary(),
    queryFn: () => apiGet<DigestSummaryResponse>("/api/v1/digest/summary"),
  });
}

export function useSaveCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPost<Record<string, unknown>>(`/api/v1/digest/${id}/save`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: digestKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useDismissCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPost<Record<string, unknown>>(`/api/v1/digest/${id}/dismiss`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: digestKeys.all });
    },
  });
}

export function useDismissAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<{ dismissed: number }>("/api/v1/digest/dismiss-all"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: digestKeys.all });
    },
  });
}

export function useDismissGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { source_name: string; source_type?: string }) =>
      apiPost<{ dismissed: number }>("/api/v1/digest/dismiss-group", params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: digestKeys.all });
    },
  });
}

export function usePurgeExpired() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiDelete<{ purged: number }>("/api/v1/digest/expired"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: digestKeys.all });
    },
  });
}
