/**
 * Supabase Client Module
 *
 * Provides two clients:
 *   - supabaseBrowser: for client-side (uses anon key, safe to expose)
 *   - supabaseServer: for API routes / server (uses service role key, bypasses RLS)
 *
 * Lazily initialized to avoid build-time crashes when env vars are not yet set.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _browser: SupabaseClient | null = null;
let _server: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!_browser) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    _browser = createClient(url, anonKey);
  }
  return _browser;
}

export function getSupabaseServer(): SupabaseClient {
  if (!_server) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    }
    _server = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _server;
}

/**
 * Convenience aliases for backward compatibility.
 * These create the client lazily on first property access.
 */
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseServer() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseBrowser() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
