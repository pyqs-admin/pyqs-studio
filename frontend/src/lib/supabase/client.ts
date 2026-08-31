import { createBrowserClient } from "@supabase/ssr";
import { browserEnv } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    browserEnv.NEXT_PUBLIC_STUDIO_SUPABASE_URL,
    browserEnv.NEXT_PUBLIC_STUDIO_SUPABASE_PUBLISHABLE_KEY,
  );
}
