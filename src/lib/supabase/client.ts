import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { publicEnvironment } from "../env";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (!publicEnvironment.configured) return null;

  browserClient ??= createClient<Database>(
    publicEnvironment.value.VITE_SUPABASE_URL,
    publicEnvironment.value.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        persistSession: true,
      },
    },
  );

  return browserClient;
}
