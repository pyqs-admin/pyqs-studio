import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const defaultCorsOrigins = ['http://localhost:5174'];

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8100),
  SERVICE_NAME: z.string().trim().min(1).default('pyqs-content-studio-backend'),
  CORS_ORIGINS: z.string().optional().transform((value) => {
    if (!value) {
      return defaultCorsOrigins;
    }

    return value.split(',').map((origin) => origin.trim()).filter(Boolean);
  }),
  DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required'),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1, 'SUPABASE_PUBLISHABLE_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required').refine(
    (value) => !value.startsWith('sb_publishable_'),
    'SUPABASE_SERVICE_ROLE_KEY must be a Studio project secret key.',
  ),
  AUTH_BEARER_TOKEN_REQUIRED: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  STUDIO_MEDIA_BUCKET: z.string().trim().min(1).default('studio-media'),
  PYQS_PUBLISHING_WEBHOOK_URL: z.url().optional(),
  PYQS_PUBLISHING_WEBHOOK_SECRET: z.string().trim().min(32).optional(),
}).superRefine((value, context) => {
  const hasUrl = value.PYQS_PUBLISHING_WEBHOOK_URL !== undefined;
  const hasSecret = value.PYQS_PUBLISHING_WEBHOOK_SECRET !== undefined;

  if (hasUrl !== hasSecret) {
    context.addIssue({
      code: 'custom',
      message: 'PYQS_PUBLISHING_WEBHOOK_URL and PYQS_PUBLISHING_WEBHOOK_SECRET must be configured together.',
    });
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables:\n${JSON.stringify(z.treeifyError(parsedEnv.error), null, 2)}`);
}

export const env = Object.freeze(parsedEnv.data);
export type Env = typeof env;
