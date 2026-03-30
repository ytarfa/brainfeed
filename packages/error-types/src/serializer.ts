import type { AppError, ErrorResponseBody } from "./errors";

export function toErrorResponse(error: AppError): ErrorResponseBody {
  const isProduction = process.env.NODE_ENV === "production";

  const response: ErrorResponseBody = {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
  };

  if (!isProduction) {
    response.stack = error.stack;
    response.context = error.context;
  }

  return response;
}
