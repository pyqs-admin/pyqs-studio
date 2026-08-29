import type { RequestHandler } from 'express';

import { AppError } from '../lib/AppError.js';

const windowMs = 60_000;
const maxRequests = 120;
const buckets = new Map<string, { count: number; startedAt: number }>();

export const rateLimitMiddleware: RequestHandler = (req, _res, next) => {
  if (req.path === '/health' || req.path === '/api/v1/health') {
    next();
    return;
  }

  const key = req.header('authorization') ?? req.ip ?? 'unknown';
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.startedAt >= windowMs) {
    buckets.set(key, { count: 1, startedAt: now });
    next();
    return;
  }

  if (bucket.count >= maxRequests) {
    next(new AppError({ statusCode: 429, code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }));
    return;
  }

  bucket.count += 1;
  next();
};
