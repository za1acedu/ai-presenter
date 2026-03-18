import { SupabaseClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface Settings {
  id: string;
  owner_id: string;
  claude_api_key: string;
  google_api_key: string | null;
  nano_banana_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertSettingsParams {
  claude_api_key: string;
  google_api_key?: string | null;
  nano_banana_api_key?: string | null;
}

// ----------------------------------------------------------------
// Data access functions
// ----------------------------------------------------------------

/**
 * Retrieve the settings for a given owner.
 * Returns null if no settings row exists yet.
 */
export async function getSettings(
  supabase: SupabaseClient,
  ownerId: string
): Promise<Settings | null> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("owner_id", ownerId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // row not found
    throw error;
  }
  return data as Settings;
}

/**
 * Insert or update settings for a given owner.
 * Uses Supabase upsert with the unique (owner_id) constraint.
 */
export async function upsertSettings(
  supabase: SupabaseClient,
  ownerId: string,
  params: UpsertSettingsParams
): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .upsert(
      {
        owner_id: ownerId,
        claude_api_key: params.claude_api_key,
        google_api_key: params.google_api_key ?? null,
        nano_banana_api_key: params.nano_banana_api_key ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as Settings;
}
