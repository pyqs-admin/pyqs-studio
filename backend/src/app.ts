import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { sendSuccess } from './lib/api-response.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware.js';
import { requestLoggingMiddleware } from './middleware/request-logging.middleware.js';
import { apiRouter } from './router.js';

export const app: Express = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || env.CORS_ORIGINS.includes(origin)),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLoggingMiddleware);
app.use(rateLimitMiddleware);

app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok', service: env.SERVICE_NAME, timestamp: new Date().toISOString() });
});

app.use('/api/v1', apiRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
