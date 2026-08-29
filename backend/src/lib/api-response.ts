import type { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function sendError(
  res: Response,
  options: { statusCode: number; code: string; message: string; details?: unknown },
): void {
  res.status(options.statusCode).json({
    success: false,
    code: options.code,
    message: options.message,
    ...(options.details === undefined ? {} : { details: options.details }),
  });
}
