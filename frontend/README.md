# PYQS Content Studio

A single Next.js full-stack application for the internal PYQS content workflow. There is no separate backend server: the database, business logic, and external services live inside this Next.js app.

## Architecture

```
Next.js
├── app/            routes (App Router)
├── actions/        Server Actions (auth, projects, questions, review, …)
├── server/
│   ├── services/   business logic
│   ├── repositories/  database access
│   ├── schemas/    shared zod validation
│   ├── db/         Drizzle schema, client, Supabase admin, seeds
│   ├── auth/       server-side session resolution
│   └── config/     server-only environment
├── components/
├── hooks/
└── lib/            client-safe helpers and API glue
```

The browser talks to Server Actions, which resolve the signed-in Supabase session from cookies, validate input, and delegate to services. Route handlers are reserved for genuine HTTP endpoints (none are required by the current feature set).

## Environment

| Concern | Variable |
| --- | --- |
| Supabase (browser) | `NEXT_PUBLIC_STUDIO_SUPABASE_URL`, `NEXT_PUBLIC_STUDIO_SUPABASE_PUBLISHABLE_KEY` |
| Database | `DATABASE_URL` |
| Supabase admin (server) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Media bucket | `STUDIO_MEDIA_BUCKET` |
| Publishing webhook | `PYQS_PUBLISHING_WEBHOOK_URL`, `PYQS_PUBLISHING_WEBHOOK_SECRET` |

Only `NEXT_PUBLIC_*` values reach the browser. Service-role and webhook secrets stay server-side.

## Required before use against a live environment

1. Copy `.env.example` to `.env.local` and set the dedicated Studio Supabase URL and publishable key plus the server-only variables.
2. Run migrations and seeds:
   - `pnpm db:migrate`
   - `pnpm db:seed`
3. Provision at least one active `studio_profile` with roles and permissions in the Studio database.
4. Set the deployed origin as an allowed redirect URL in Studio Supabase Auth.

## Release checks

1. Run `pnpm typecheck`, `pnpm lint`, and `pnpm build` with production-shaped environment values.
2. Verify sign-in, inactive-access handling, sign-out, project/question creation, explanation upload, review decisions, and publishing in staging.
3. Confirm keyboard navigation, visible focus, small-screen tables, and loading/error/empty states on every primary route.
4. Configure client/server error monitoring in the deployment platform; the application route error boundary preserves a recoverable fallback for unexpected route failures.
## Question reports integration

Set `PYQS_REPORTS_API_URL` to the main PYQS backend base URL and set `PYQS_REPORTS_API_KEY` to the same 32+ character secret configured as `STUDIO_REPORTS_API_KEY` in the main backend. Run the Studio seed once after deploying the permissions changes so the `question.report.view` and `question.report.manage` permissions are available to roles.
