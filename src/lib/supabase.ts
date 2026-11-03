import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | undefined;

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local. Do not put a server secret in a VITE_ variable.',
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/** Browser client. Created on first use so the UI shell can render without env. */
export function getSupabase(): SupabaseClient {
  client ??= createSupabaseClient();
  return client;
}
