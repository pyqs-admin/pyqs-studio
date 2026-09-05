import "server-only";

import type { StudioSession } from "@/lib/api/types";
import { createClient } from "@/lib/supabase/server";
import { authRepository } from "@/server/repositories/auth.repository";
import { AppError } from "@/server/lib/AppError";

export async function getCurrentSession(): Promise<StudioSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const profile = await authRepository.findProfileById(data.user.id);
  if (!profile) {
    throw new AppError({
      statusCode: 403,
      code: "STUDIO_ACCESS_NOT_PROVISIONED",
      message: "This account has not been granted access to Content Studio.",
    });
  }

  if (profile.status !== "active") {
    throw new AppError({
      statusCode: 403,
      code: "STUDIO_ACCOUNT_INACTIVE",
      message: "This Content Studio account is inactive.",
    });
  }

  const [roles, permissions] = await Promise.all([
    authRepository.findRoleCodes(profile.id),
    authRepository.findPermissionCodes(profile.id),
  ]);

  return {
    profileId: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    roles,
    permissions,
  };
}

export async function requireUser(): Promise<StudioSession> {
  const session = await getCurrentSession();
  if (!session) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "A valid Studio access token is required.",
    });
  }
  return session;
}
