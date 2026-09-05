import "server-only";

import type { StudioSession } from "@/lib/api/types";
import { AppError } from "@/server/lib/AppError";

export class AuthService {
  requirePermission(session: StudioSession, permission: string): void {
    if (!session.permissions.includes(permission)) {
      throw new AppError({
        statusCode: 403,
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        details: { permission },
      });
    }
  }
}

export const authService = new AuthService();
