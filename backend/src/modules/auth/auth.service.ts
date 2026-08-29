import type { Request } from 'express';

import { studioSupabase } from '../../database/supabase.js';
import { AppError } from '../../lib/AppError.js';
import { authRepository } from './auth.repository.js';
import type { StudioSession } from './auth.types.js';

export class AuthService {
  async resolveCurrentSession(req: Request): Promise<StudioSession | null> {
    const token = this.extractBearerToken(req);

    if (!token) {
      return null;
    }

    const { data, error } = await studioSupabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }

    const profile = await authRepository.findProfileById(data.user.id);
    if (!profile) {
      throw new AppError({
        statusCode: 403,
        code: 'STUDIO_ACCESS_NOT_PROVISIONED',
        message: 'This account has not been granted access to Content Studio.',
      });
    }

    if (profile.status !== 'active') {
      throw new AppError({
        statusCode: 403,
        code: 'STUDIO_ACCOUNT_INACTIVE',
        message: 'This Content Studio account is inactive.',
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

  requirePermission(session: StudioSession, permission: string): void {
    if (!session.permissions.includes(permission)) {
      throw new AppError({
        statusCode: 403,
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to perform this action.',
        details: { permission },
      });
    }
  }

  private extractBearerToken(req: Request): string | null {
    const authorization = req.header('authorization');
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}

export const authService = new AuthService();
