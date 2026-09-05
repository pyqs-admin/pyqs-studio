"use server";

import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { authRepository } from "@/server/repositories/auth.repository";

export async function getCurrentUser() {
  return runAction(async () => requireUser());
}

export async function listUsers(query?: string) {
  return runAction(async () => {
    await requireUser();
    return authRepository.listProfiles(query && query.trim().slice(0, 100) ? query.trim().slice(0, 100) : undefined);
  });
}
