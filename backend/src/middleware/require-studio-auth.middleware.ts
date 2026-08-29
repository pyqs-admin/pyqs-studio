import type { RequestHandler } from 'express';

import { AppError } from '../lib/AppError.js';
import { authService } from '../modules/auth/auth.service.js';
import type { StudioSession } from '../modules/auth/auth.types.js';

export const requireStudioAuth: RequestHandler = async (req, res, next) => {
  try {
    const session = await authService.resolveCurrentSession(req);
    if (!session) {
      next(new AppError({ statusCode: 401, code: 'UNAUTHORIZED', message: 'A valid Studio access token is required.' }));
      return;
    }

    res.locals.studioSession = session;
    next();
  } catch (error) {
    next(error);
  }
};

export function requireStudioPermission(permission: string): RequestHandler {
  return (req, res, next) => {
    const session = res.locals.studioSession as StudioSession | undefined;
    if (!session) {
      next(new AppError({ statusCode: 401, code: 'UNAUTHORIZED', message: 'A valid Studio access token is required.' }));
      return;
    }
    try {
      authService.requirePermission(session, permission);
      next();
    } catch (error) {
      next(error);
    }
  };
}
