import { Router, type Router as ExpressRouter } from 'express';

import { asyncHandler } from '../../lib/async-handler.js';
import { authController } from './auth.controller.js';

export const authRouter: ExpressRouter = Router();

authRouter.get('/me', asyncHandler((req, res) => authController.getCurrentUser(req, res)));
