export interface AppErrorOptions {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  isOperational?: boolean;
  cause?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(options: AppErrorOptions) {
    const { statusCode, code, message, details, isOperational = true, cause } = options;
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
