import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True when both Supabase env vars are present. The app is local-first, so
 * everything auth/sync-related is gated behind this — with no credentials the
 * PWA runs exactly as it did before (fully on-device), just without cloud sync.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * The shared Supabase client, or `null` when unconfigured. Callers should guard
 * with `isSupabaseConfigured` (or a null check) before using it.
 *
 * `detectSessionInUrl` lets the client consume the magic-link tokens when the
 * user lands back on the app from their email; `persistSession` + auto-refresh
 * keep them signed in across reloads.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
