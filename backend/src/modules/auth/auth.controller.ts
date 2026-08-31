import type { Request, Response } from 'express';

import { sendSuccess } from '../../lib/api-response.js';
import { authService } from './auth.service.js';
import { authRepository } from './auth.repository.js';

export class AuthController {
  async listUsers(req: Request, res: Response): Promise<void> {
    const session = await authService.resolveCurrentSession(req);
    if (!session) { res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'A valid Studio access token is required.' }); return; }
    sendSuccess(res, await authRepository.listProfiles(typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) || undefined : undefined));
  }
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    const session = await authService.resolveCurrentSession(req);
    if (!session) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'A valid Studio access token is required.',
      });
      return;
    }

    sendSuccess(res, session);
  }
}

export const authController = new AuthController();
