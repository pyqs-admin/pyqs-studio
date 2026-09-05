export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; code: string; message: string; status?: number; details?: unknown };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
export type StudioSession = { profileId: string; email: string; displayName: string; roles: string[]; permissions: string[] };

export class StudioApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
    this.name = "StudioApiError";
  }
}
