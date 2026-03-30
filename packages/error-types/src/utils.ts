import { isAppError } from "./guards";

export function httpStatusFromError(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}
