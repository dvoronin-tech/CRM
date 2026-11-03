import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient<Database> | undefined;

export function hasSupabaseEnv(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function createSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local. Do not put a server secret in a VITE_ variable.',
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

/** Browser client. Created on first use so the UI shell can render without env. */
export function getSupabase(): SupabaseClient<Database> {
  client ??= createSupabaseClient();
  return client;
}
