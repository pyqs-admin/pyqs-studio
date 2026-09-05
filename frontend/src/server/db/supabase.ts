import { createClient } from "@supabase/supabase-js";

import { env } from "@/server/config/env";

export const studioSupabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});
