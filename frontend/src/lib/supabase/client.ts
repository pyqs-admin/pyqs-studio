import { createBrowserClient } from "@supabase/ssr";
import { getBrowserEnv } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    getBrowserEnv().NEXT_PUBLIC_STUDIO_SUPABASE_URL,
    getBrowserEnv().NEXT_PUBLIC_STUDIO_SUPABASE_PUBLISHABLE_KEY,
  );
}
