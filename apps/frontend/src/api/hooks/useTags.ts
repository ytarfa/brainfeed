import { useQuery } from "@tanstack/react-query";

import { apiGet } from "../client";

// --- Query keys ---

export const tagKeys = {
  all: ["tags"] as const,
};

// --- Hooks ---

/**
 * Fetches all unique tags for the current user.
 * Returns a sorted, deduplicated string array from GET /api/v1/tags.
 */
export function useTags() {
  return useQuery({
    queryKey: tagKeys.all,
    queryFn: () => apiGet<string[]>("/api/v1/tags"),
    staleTime: 60_000,
  });
}
