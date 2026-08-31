export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; code: string; message: string; details?: unknown };
export type StudioSession = { profileId: string; email: string; displayName: string; roles: string[]; permissions: string[] };

export class StudioApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
    this.name = "StudioApiError";
  }
}
