import type { Request, Response } from 'express';

import { sendSuccess } from '../../lib/api-response.js';
import { authService } from './auth.service.js';

export class AuthController {
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
