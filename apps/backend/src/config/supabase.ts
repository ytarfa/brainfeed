import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@brain-feed/types";
import { env } from "./env";

// Service client — bypasses RLS. Use only for public routes and admin ops.
export const serviceClient: SupabaseClient<Database> = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Create a per-request user client that respects RLS
export function createUserClient(userJwt: string): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
    auth: { persistSession: false },
  });
}
