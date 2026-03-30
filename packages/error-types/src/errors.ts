export interface ErrorResponseBody {
  error: string;
  code: string;
  statusCode: number;
  stack?: string;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly context: Record<string, unknown>;
  public readonly __appError: true = true;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 400, "VALIDATION_ERROR", context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 401, "AUTHENTICATION_ERROR", context);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 403, "FORBIDDEN", context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 404, "NOT_FOUND", context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 409, "CONFLICT", context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 502, "EXTERNAL_SERVICE_ERROR", context);
  }
}
