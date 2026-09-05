import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .trim()
      .min(1, "SUPABASE_SERVICE_ROLE_KEY is required")
      .refine(
        (value) => !value.startsWith("sb_publishable_"),
        "SUPABASE_SERVICE_ROLE_KEY must be a Studio project secret key.",
      ),
    STUDIO_MEDIA_BUCKET: z.string().trim().min(1).default("studio-media"),
    PYQS_PUBLISHING_WEBHOOK_URL: z.string().url().optional(),
    PYQS_PUBLISHING_WEBHOOK_SECRET: z.string().trim().min(32).optional(),
  })
  .superRefine((value, context) => {
    const hasUrl = value.PYQS_PUBLISHING_WEBHOOK_URL !== undefined;
    const hasSecret = value.PYQS_PUBLISHING_WEBHOOK_SECRET !== undefined;

    if (hasUrl !== hasSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PYQS_PUBLISHING_WEBHOOK_URL and PYQS_PUBLISHING_WEBHOOK_SECRET must be configured together.",
      });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${details}`);
}

export const env = Object.freeze(parsedEnv.data);
export type Env = typeof env;
