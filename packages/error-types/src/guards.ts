import type { AppError } from "./errors";

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "__appError" in error &&
    (error as Record<string, unknown>).__appError === true
  );
}
