import type { ErrorRequestHandler } from 'express';

import { env } from '../config/env.js';
import { AppError } from '../lib/AppError.js';
import { sendError } from '../lib/api-response.js';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    sendError(res, error);
    return;
  }

  console.error('Unhandled Studio error', error);
  sendError(res, {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    ...(env.NODE_ENV === 'production' ? {} : { details: error instanceof Error ? error.message : String(error) }),
  });
};
