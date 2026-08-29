# PYQS Content Studio Backend

This is an isolated backend for the internal PYQS Content Studio. It uses a dedicated Supabase project and must never share database credentials, Storage buckets, or service-role secrets with the public PYQS application.

## Foundation module

This first module provides the Express/TypeScript service scaffold, validated configuration, PostgreSQL/Drizzle client, request IDs, rate limiting, consistent API errors, graceful shutdown, and health endpoints.

Copy `.env.example` to `.env`, configure the dedicated Studio Supabase/PostgreSQL project, run `pnpm install`, then run `pnpm dev`.

`GET /health` verifies process availability. `GET /api/v1/health` also verifies database connectivity.

## Database workflow

Use `pnpm db:generate` followed by `pnpm db:migrate` for the shared Studio database. This retains an auditable, versioned schema history.

`pnpm db:push` is available only for a disposable local development database. It calculates the difference between `src/database/schema.ts` and the live database, then applies it directly without using migration files. Do not run `db:push` against a database that has pending generated migrations, and do not use it for the shared Studio environment.

Use `pnpm db:push:preview` to inspect the proposed direct changes without applying them.

## Authentication and access

Studio uses tokens issued by its dedicated Supabase project. `GET /api/v1/auth/me` accepts `Authorization: Bearer <studio-access-token>`. A valid Supabase account is not enough: the matching `studio_profile` must have been provisioned by an administrator and be active. Roles and permissions are database records, not frontend-controlled values.
