import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPatch, apiDelete } from "../client";

// --- Response types ---

interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// --- Mutation params ---

interface UpdateProfileParams {
  display_name?: string;
  avatar_url?: string;
  onboarding_completed?: boolean;
}

// --- Query keys ---

export const settingsKeys = {
  all: ["settings"] as const,
  profile: () => [...settingsKeys.all, "profile"] as const,
};

// --- Hooks ---

export function useProfile() {
  return useQuery({
    queryKey: settingsKeys.profile(),
    queryFn: () => apiGet<ProfileRow>("/api/v1/settings/profile"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateProfileParams) =>
      apiPatch<ProfileRow>("/api/v1/settings/profile", params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => apiDelete("/api/v1/settings/account"),
  });
}

export type { ProfileRow };
