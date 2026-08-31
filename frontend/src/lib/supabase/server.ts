import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { browserEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    browserEnv.NEXT_PUBLIC_STUDIO_SUPABASE_URL,
    browserEnv.NEXT_PUBLIC_STUDIO_SUPABASE_PUBLISHABLE_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}
