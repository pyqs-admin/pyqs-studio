# PYQS Content Studio Frontend

This directory will contain the separate internal Content Studio application. It is intentionally independent from the public `FRONTEND` Vite application.

## Phase 0 integration contract

The planned Next.js application will use the dedicated Studio Supabase project for browser authentication, then pass the current access token as `Authorization: Bearer <token>` to the Studio API.

| Concern | Contract |
| --- | --- |
| Frontend API URL | `NEXT_PUBLIC_STUDIO_API_URL`, normally `http://localhost:8100/api/v1` in development |
| Authentication | Dedicated Studio Supabase project; no public-PYQS keys or service-role keys in the browser |
| API authentication | Bearer token supplied by the signed-in Studio user |
| CORS | `studio/backend` must include the deployed frontend origin in `CORS_ORIGINS` |
| Publishing | The browser never calls the PYQS publishing webhook; it asks Studio to publish through its authenticated API |
| Secrets | Only `NEXT_PUBLIC_*` values belong in this app. Service-role and webhook secrets stay server-side |

## Required before Phase 1 is used against a live environment

1. Copy `.env.example` to `.env.local` and set the dedicated Studio Supabase URL and publishable key.
2. Add the frontend's local/deployed origin to `studio/backend`'s `CORS_ORIGINS`.
3. Provision at least one active `studio_profile` with roles and permissions in the Studio database.
4. Decide which Supabase sign-in methods to enable. The frontend will support email/password and magic-link flows unless a different provider is selected before implementation.

## API readiness notes

The question, project, review, explanation, media, publishing, search, saved-view, and bulk-operation APIs can support the initial frontend vertical slices. Dashboards, notifications, project aggregate endpoints, and Studio user administration remain backend prerequisites for their respective frontend phases. RAG remains intentionally deferred.
