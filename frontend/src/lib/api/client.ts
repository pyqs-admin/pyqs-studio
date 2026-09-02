import { getBrowserEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { type ApiFailure, type ApiSuccess, StudioApiError } from "./types";

export async function studioFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await createClient().auth.getSession();
  if (!session?.access_token) throw new StudioApiError("UNAUTHENTICATED", "Please sign in to continue.", 401);
  const response = await fetch(`${getBrowserEnv().NEXT_PUBLIC_STUDIO_API_URL}${path}`, {
    ...init,
    headers: { Accept: "application/json", Authorization: `Bearer ${session.access_token}`, ...init.headers },
  });
  const body = await response.json() as ApiSuccess<T> | ApiFailure;
  if (!response.ok || !body.success) {
    const failure = body as ApiFailure;
    throw new StudioApiError(failure.code ?? "REQUEST_FAILED", failure.message ?? "The request could not be completed.", response.status, failure.details);
  }
  return body.data;
}
