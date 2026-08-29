import type { RequestHandler } from 'express';
import { z } from 'zod';

import { AppError } from '../lib/AppError.js';

export function validateRequest(schemas: { body?: z.ZodType; params?: z.ZodType }): RequestHandler {
  return (req, _res, next) => {
    for (const value of [schemas.body?.safeParse(req.body), schemas.params?.safeParse(req.params)]) {
      if (value && !value.success) {
        next(new AppError({ statusCode: 400, code: 'VALIDATION_ERROR', message: 'Invalid request.', details: z.treeifyError(value.error) }));
        return;
      }
    }
    next();
  };
}
