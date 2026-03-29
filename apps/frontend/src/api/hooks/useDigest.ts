import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPost, apiDelete } from "../client";
import type { DigestCandidate } from "../../data/mock";

// --- Response types ---

interface DigestCandidateRow {
  id: string;
  user_id: string;
  source_type: string;
  source_name: string;
  source_id: string | null;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DigestGroup {
  source_name: string;
  source_type: string;
  candidates: DigestCandidateRow[];
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

// --- Utility: Transform API row to frontend DigestCandidate type ---

export function toDigestCandidate(raw: DigestCandidateRow): DigestCandidate {
  return {
    id: raw.id,
    user_id: raw.user_id,
    source_type: raw.source_type as DigestCandidate["source_type"],
    source_name: raw.source_name,
    source_id: raw.source_id,
    url: raw.url,
    title: raw.title,
    description: raw.description,
    thumbnail_url: raw.thumbnail_url,
    published_at: raw.published_at,
    status: raw.status as DigestCandidate["status"],
    expires_at: raw.expires_at,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
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
      apiPost<{ bookmark: Record<string, unknown> }>(`/api/v1/digest/${id}/save`),
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
      apiPost<{ id: string; status: string }>(`/api/v1/digest/${id}/dismiss`),
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
