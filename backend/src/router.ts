import { Router, type Router as ExpressRouter } from 'express';

import { env } from './config/env.js';
import { checkDbConnection } from './database/client.js';
import { asyncHandler } from './lib/async-handler.js';
import { sendSuccess } from './lib/api-response.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { taxonomyRouter } from './modules/taxonomy/taxonomy.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { questionsRouter } from './modules/questions/questions.routes.js';

export const apiRouter: ExpressRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/taxonomy', taxonomyRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/questions', questionsRouter);

apiRouter.get('/health', asyncHandler(async (_req, res) => {
  await checkDbConnection();
  sendSuccess(res, {
    status: 'ok',
    service: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
}));
