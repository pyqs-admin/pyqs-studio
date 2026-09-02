import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getBrowserEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    getBrowserEnv().NEXT_PUBLIC_STUDIO_SUPABASE_URL,
    getBrowserEnv().NEXT_PUBLIC_STUDIO_SUPABASE_PUBLISHABLE_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}
