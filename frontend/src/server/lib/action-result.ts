import { z } from "zod";

import type { ApiResult } from "@/lib/api/types";
import { AppError } from "./AppError";

function zodErrorDetails(error: z.ZodError): { properties: Record<string, { errors: string[] }> } {
  const properties: Record<string, { errors: string[] }> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "_";
    const entry = (properties[field] ??= { errors: [] });
    entry.errors.push(issue.message);
  }
  return { properties };
}

function toJsonSafe<T>(value: T): T {
  if (value === undefined) {
    return undefined as T;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function runAction<T>(fn: () => Promise<T>): Promise<ApiResult<T>> {
  try {
    const data = await fn();
    return { success: true, data: toJsonSafe(data) };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false,
        code: error.code,
        message: error.message,
        status: error.statusCode,
        ...(error.details === undefined ? {} : { details: error.details }),
      };
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid request.",
        status: 400,
        details: zodErrorDetails(error),
      };
    }

    console.error("Unhandled Studio action error", error);
    return {
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      status: 500,
      ...(process.env.NODE_ENV === "production" ? {} : { details: error instanceof Error ? error.message : String(error) }),
    };
  }
}
