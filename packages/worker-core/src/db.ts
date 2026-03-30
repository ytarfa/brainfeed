import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database, EnrichedData, EnrichmentStatus } from "@brain-feed/types";

export function createServiceClient(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function updateEnrichmentStatus(
  client: SupabaseClient<Database>,
  bookmarkId: string,
  status: EnrichmentStatus,
): Promise<void> {
  const { error } = await client
    .from("bookmarks")
    .update({
      enrichment_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookmarkId);

  if (error) {
    throw new Error(`Failed to update enrichment status for bookmark ${bookmarkId}: ${error.message}`);
  }
}

export async function writeEnrichedData(
  client: SupabaseClient<Database>,
  bookmarkId: string,
  data: EnrichedData,
): Promise<void> {
  // Fetch existing user tags so we can merge with AI-generated tags
  const { data: existing, error: fetchError } = await client
    .from("bookmarks")
    .select("tags")
    .eq("id", bookmarkId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch existing tags for bookmark ${bookmarkId}: ${fetchError.message}`);
  }

  // Merge: existing user tags + new AI tags, deduplicated and lowercased
  const existingTags: string[] = existing?.tags ?? [];
  const aiTags: string[] = (data.tags ?? []).map((t) => t.toLowerCase());
  const mergedTags = [...new Set([...existingTags, ...aiTags])];

  const { error } = await client
    .from("bookmarks")
    .update({
      enriched_data: data as unknown as Database["public"]["Tables"]["bookmarks"]["Update"]["enriched_data"],
      enrichment_status: "completed",
      tags: mergedTags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookmarkId);

  if (error) {
    throw new Error(`Failed to write enriched data for bookmark ${bookmarkId}: ${error.message}`);
  }
}

export interface BookmarkForProcessing {
  id: string;
  url: string | null;
  title: string | null;
  content_type: string;
  source_type: string | null;
  raw_content: string | null;
}

export async function fetchBookmarkForProcessing(
  client: SupabaseClient<Database>,
  bookmarkId: string,
): Promise<BookmarkForProcessing | null> {
  const { data, error } = await client
    .from("bookmarks")
    .select("id, url, title, content_type, source_type, raw_content")
    .eq("id", bookmarkId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to fetch bookmark ${bookmarkId}: ${error.message}`);
  }

  return data;
}
