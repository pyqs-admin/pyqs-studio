import crypto from 'node:crypto';

import type { RequestHandler } from 'express';

export const requestLoggingMiddleware: RequestHandler = (req, res, next) => {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    console.info(JSON.stringify({
      event: 'request_finished',
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
    }));
  });

  next();
};
