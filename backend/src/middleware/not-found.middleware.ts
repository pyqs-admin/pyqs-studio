import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AppError } from '../lib/AppError.js';

export const notFoundMiddleware: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError({
    statusCode: 404,
    code: 'ROUTE_NOT_FOUND',
    message: 'Route not found',
    details: { method: req.method, path: req.originalUrl },
  }));
};
