import { Router, type Router as ExpressRouter } from 'express';

import { env } from './config/env.js';
import { checkDbConnection } from './database/client.js';
import { asyncHandler } from './lib/async-handler.js';
import { sendSuccess } from './lib/api-response.js';
import { authRouter } from './modules/auth/auth.routes.js';

export const apiRouter: ExpressRouter = Router();

apiRouter.use('/auth', authRouter);

apiRouter.get('/health', asyncHandler(async (_req, res) => {
  await checkDbConnection();
  sendSuccess(res, {
    status: 'ok',
    service: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
}));
