import { type ApiResult, StudioApiError } from "./types";

export async function callAction<T>(result: Promise<ApiResult<unknown>>): Promise<T> {
  const res = await result;
  if (!res.success) {
    const failure = res;
    throw new StudioApiError(
      failure.code ?? "REQUEST_FAILED",
      failure.message ?? "The request could not be completed.",
      failure.status ?? 500,
      failure.details,
    );
  }
  return res.data as T;
}
