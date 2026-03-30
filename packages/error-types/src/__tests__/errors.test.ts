import { describe, it, expect } from "vitest";

import {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ExternalServiceError,
  isAppError,
  toErrorResponse,
  httpStatusFromError,
} from "../index";

describe("AppError", () => {
  it("has correct defaults", () => {
    const err = new AppError("Something went wrong");
    expect(err.message).toBe("Something went wrong");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.isOperational).toBe(true);
    expect(err.context).toEqual({});
    expect(err.__appError).toBe(true);
  });

  it("accepts all constructor args", () => {
    const err = new AppError("Not found", 404, "NOT_FOUND", { resourceId: "abc" });
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.context).toEqual({ resourceId: "abc" });
  });

  it("is an instance of Error", () => {
    const err = new AppError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err.stack).toBeDefined();
  });

  it("has name set to constructor name", () => {
    const err = new AppError("test");
    expect(err.name).toBe("AppError");
  });
});

describe("HTTP error subclasses", () => {
  it("ValidationError has correct defaults", () => {
    const err = new ValidationError("Invalid email");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ValidationError");
  });

  it("AuthenticationError has correct defaults", () => {
    const err = new AuthenticationError("Unauthorized");
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("AUTHENTICATION_ERROR");
    expect(err.name).toBe("AuthenticationError");
  });

  it("ForbiddenError has correct defaults", () => {
    const err = new ForbiddenError("Forbidden");
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.name).toBe("ForbiddenError");
  });

  it("NotFoundError has correct defaults", () => {
    const err = new NotFoundError("Bookmark not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.name).toBe("NotFoundError");
  });

  it("NotFoundError with context", () => {
    const err = new NotFoundError("Bookmark not found", { bookmarkId: "123" });
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.context).toEqual({ bookmarkId: "123" });
  });

  it("ConflictError has correct defaults", () => {
    const err = new ConflictError("Already exists");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
    expect(err.name).toBe("ConflictError");
  });

  it("ExternalServiceError has correct defaults", () => {
    const err = new ExternalServiceError("YouTube API failed");
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe("EXTERNAL_SERVICE_ERROR");
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe("ExternalServiceError");
  });
});

describe("isAppError", () => {
  it("returns true for AppError instance", () => {
    expect(isAppError(new AppError("x"))).toBe(true);
  });

  it("returns true for subclass instances", () => {
    expect(isAppError(new NotFoundError("x"))).toBe(true);
    expect(isAppError(new ValidationError("x"))).toBe(true);
    expect(isAppError(new ExternalServiceError("x"))).toBe(true);
  });

  it("returns false for plain Error", () => {
    expect(isAppError(new Error("x"))).toBe(false);
  });

  it("returns false for string", () => {
    expect(isAppError("string")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAppError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isAppError(undefined)).toBe(false);
  });

  it("returns false for object without __appError", () => {
    expect(isAppError({ message: "x", statusCode: 500 })).toBe(false);
  });
});

describe("toErrorResponse", () => {
  it("returns basic fields in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const err = new ValidationError("Bad input");
      const response = toErrorResponse(err);
      expect(response).toEqual({
        error: "Bad input",
        code: "VALIDATION_ERROR",
        statusCode: 400,
      });
      expect(response.stack).toBeUndefined();
      expect(response.context).toBeUndefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("includes stack and context in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const err = new ValidationError("Bad input", { field: "email" });
      const response = toErrorResponse(err);
      expect(response.error).toBe("Bad input");
      expect(response.code).toBe("VALIDATION_ERROR");
      expect(response.statusCode).toBe(400);
      expect(response.stack).toBeDefined();
      expect(response.context).toEqual({ field: "email" });
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});

describe("httpStatusFromError", () => {
  it("returns statusCode from AppError", () => {
    expect(httpStatusFromError(new NotFoundError("x"))).toBe(404);
    expect(httpStatusFromError(new ValidationError("x"))).toBe(400);
    expect(httpStatusFromError(new AppError("x"))).toBe(500);
  });

  it("returns 500 for plain Error", () => {
    expect(httpStatusFromError(new Error("x"))).toBe(500);
  });

  it("returns 500 for non-error values", () => {
    expect(httpStatusFromError("string")).toBe(500);
    expect(httpStatusFromError(null)).toBe(500);
  });
});
