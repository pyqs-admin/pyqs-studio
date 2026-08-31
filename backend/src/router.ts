import { Router, type Router as ExpressRouter } from 'express';

import { env } from './config/env.js';
import { checkDbConnection } from './database/client.js';
import { asyncHandler } from './lib/async-handler.js';
import { sendSuccess } from './lib/api-response.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { taxonomyRouter } from './modules/taxonomy/taxonomy.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { questionRevisionsRouter, questionsRouter, questionWorkspaceRouter } from './modules/questions/questions.routes.js';
import { explanationsRouter } from './modules/explanations/explanations.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { reviewRouter } from './modules/review/review.routes.js';
import { mediaRouter } from './modules/media/media.routes.js';
import { publishRouter } from './modules/publish/publish.routes.js';

export const apiRouter: ExpressRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/taxonomy', taxonomyRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/questions', questionsRouter);
apiRouter.use('/', questionWorkspaceRouter);
apiRouter.use('/', questionRevisionsRouter);
apiRouter.use('/', explanationsRouter);
apiRouter.use('/', auditRouter);
apiRouter.use('/', reviewRouter);
apiRouter.use('/', mediaRouter);
apiRouter.use('/', publishRouter);

apiRouter.get('/health', asyncHandler(async (_req, res) => {
  await checkDbConnection();
  sendSuccess(res, {
    status: 'ok',
    service: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
}));
