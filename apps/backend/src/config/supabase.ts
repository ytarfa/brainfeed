import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

// Service client — bypasses RLS. Use only for public routes and admin ops.
export const serviceClient: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Create a per-request user client that respects RLS
export function createUserClient(userJwt: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
    auth: { persistSession: false },
  });
}
