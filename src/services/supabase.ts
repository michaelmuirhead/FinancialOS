import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * When Supabase env vars are not configured the app runs in demo mode
 * against a local sample dataset, so the interface is fully explorable
 * before the backend is provisioned.
 */
export const isDemoMode = !url || !anonKey;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
