import { z } from "zod";

const browserEnvSchema = z.object({
  NEXT_PUBLIC_STUDIO_API_URL: z.string().url(),
  NEXT_PUBLIC_STUDIO_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_STUDIO_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export function getBrowserEnv() {
  return browserEnvSchema.parse({
    NEXT_PUBLIC_STUDIO_API_URL: process.env.NEXT_PUBLIC_STUDIO_API_URL,
    NEXT_PUBLIC_STUDIO_SUPABASE_URL: process.env.NEXT_PUBLIC_STUDIO_SUPABASE_URL,
    NEXT_PUBLIC_STUDIO_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STUDIO_SUPABASE_PUBLISHABLE_KEY,
  });
}
