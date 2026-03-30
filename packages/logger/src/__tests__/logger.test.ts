import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";

import {
  AppError,
  NotFoundError,
  ValidationError,
  ExternalServiceError,
} from "@brain-feed/error-types";

import { requestContext, getRequestId, contextMiddleware } from "../context";
import { createLogger } from "../logger";
import {
  requestLoggerMiddleware,
  errorHandlerMiddleware,
  asyncHandler,
} from "../middleware";

/* ---------- helpers ---------- */

function mockReq(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    method: "GET",
    originalUrl: "/test",
    headers: {},
    ...overrides,
  };
}

function mockRes(): Record<string, unknown> & EventEmitter {
  const emitter = new EventEmitter();
  const res = Object.assign(emitter, {
    statusCode: 200,
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    getHeader: vi.fn(),
  });
  // Allow setting statusCode before emitting finish
  return res as unknown as Record<string, unknown> & EventEmitter;
}

/* ---------- context ---------- */

describe("context", () => {
  describe("getRequestId", () => {
    it("returns undefined outside of context", () => {
      expect(getRequestId()).toBeUndefined();
    });

    it("returns requestId inside context", () => {
      requestContext.run({ requestId: "test-id", startTime: Date.now() }, () => {
        expect(getRequestId()).toBe("test-id");
      });
    });
  });

  describe("contextMiddleware", () => {
    it("generates a requestId when none is provided", () => {
      const middleware = contextMiddleware();
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      middleware(req as never, res as never, next);

      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-Request-Id",
        expect.any(String),
      );
    });

    it("uses X-Request-Id header when provided", () => {
      const middleware = contextMiddleware();
      const req = mockReq({ headers: { "x-request-id": "incoming-id" } });
      const res = mockRes();
      const next = vi.fn();

      middleware(req as never, res as never, next);

      expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", "incoming-id");
    });

    it("makes requestId available via getRequestId inside next()", () => {
      const middleware = contextMiddleware();
      const req = mockReq({ headers: { "x-request-id": "ctx-id" } });
      const res = mockRes();
      let captured: string | undefined;

      const next = () => {
        captured = getRequestId();
      };

      middleware(req as never, res as never, next);

      expect(captured).toBe("ctx-id");
    });
  });
});

/* ---------- createLogger ---------- */

describe("createLogger", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("creates a logger with default options", () => {
    process.env.NODE_ENV = "production";
    const logger = createLogger();
    expect(logger).toBeDefined();
    expect(logger.level).toBe("info");
  });

  it("respects LOG_LEVEL env variable", () => {
    process.env.NODE_ENV = "production";
    process.env.LOG_LEVEL = "warn";
    const logger = createLogger();
    expect(logger.level).toBe("warn");
  });

  it("uses options.level over LOG_LEVEL", () => {
    process.env.LOG_LEVEL = "warn";
    const logger = createLogger({ level: "error", prettyPrint: false });
    expect(logger.level).toBe("error");
  });

  it("sets name when provided", () => {
    process.env.NODE_ENV = "production";
    const logger = createLogger({ name: "test-service" });
    // pino stores the name in bindings
    expect(logger).toBeDefined();
  });

  it("includes requestId in mixin when inside context", () => {
    process.env.NODE_ENV = "production";
    const logger = createLogger();
    // The mixin function is called internally by pino per log call.
    // We can verify by checking the mixin indirectly: the logger should
    // log successfully inside and outside of context without errors.
    requestContext.run({ requestId: "mixin-test", startTime: Date.now() }, () => {
      // Should not throw
      logger.info("test message inside context");
    });
    // Should not throw outside context either
    logger.info("test message outside context");
  });
});

/* ---------- requestLoggerMiddleware ---------- */

describe("requestLoggerMiddleware", () => {
  it("logs debug for 2xx responses", () => {
    const logger = { debug: vi.fn(), info: vi.fn(), error: vi.fn() };
    const middleware = requestLoggerMiddleware(logger as never);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    middleware(req as never, res as never, next);
    expect(next).toHaveBeenCalled();

    res.statusCode = 200;
    res.emit("finish");

    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: "/test", statusCode: 200 }),
      "request completed",
    );
  });

  it("logs info for 4xx responses", () => {
    const logger = { debug: vi.fn(), info: vi.fn(), error: vi.fn() };
    const middleware = requestLoggerMiddleware(logger as never);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    middleware(req as never, res as never, next);

    res.statusCode = 404;
    res.emit("finish");

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
      "request completed",
    );
  });

  it("logs error for 5xx responses", () => {
    const logger = { debug: vi.fn(), info: vi.fn(), error: vi.fn() };
    const middleware = requestLoggerMiddleware(logger as never);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    middleware(req as never, res as never, next);

    res.statusCode = 502;
    res.emit("finish");

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 502 }),
      "request completed",
    );
  });
});

/* ---------- errorHandlerMiddleware ---------- */

describe("errorHandlerMiddleware", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("handles AppError with correct status and code", () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const middleware = errorHandlerMiddleware(logger as never);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    const err = new NotFoundError("User not found");
    middleware(err, req as never, res as never, next);

    expect(logger.warn).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "User not found",
        code: "NOT_FOUND",
        statusCode: 404,
      }),
    );
  });

  it("handles ValidationError (4xx) with warn level", () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const middleware = errorHandlerMiddleware(logger as never);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    const err = new ValidationError("Invalid email");
    middleware(err, req as never, res as never, next);

    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("handles ExternalServiceError (5xx) with error level", () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const middleware = errorHandlerMiddleware(logger as never);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    const err = new ExternalServiceError("API down");
    middleware(err, req as never, res as never, next);

    expect(logger.error).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("handles plain Error as 500 Internal Server Error", () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const middleware = errorHandlerMiddleware(logger as never);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    const err = new Error("Something broke");
    middleware(err, req as never, res as never, next);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        statusCode: 500,
      }),
    );
  });

  it("includes stack trace in non-production", () => {
    process.env.NODE_ENV = "development";
    const logger = { warn: vi.fn(), error: vi.fn() };
    const middleware = errorHandlerMiddleware(logger as never);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    const err = new Error("dev error");
    middleware(err, req as never, res as never, next);

    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.stack).toBeDefined();
  });

  it("omits stack trace in production", () => {
    process.env.NODE_ENV = "production";
    const logger = { warn: vi.fn(), error: vi.fn() };
    const middleware = errorHandlerMiddleware(logger as never);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    const err = new Error("prod error");
    middleware(err, req as never, res as never, next);

    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.stack).toBeUndefined();
  });
});

/* ---------- asyncHandler ---------- */

describe("asyncHandler", () => {
  it("calls next with error when async function rejects", async () => {
    const next = vi.fn();
    const handler = asyncHandler(async () => {
      throw new Error("async failure");
    });

    handler(mockReq() as never, mockRes() as never, next);

    // Wait for microtask queue to flush
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe("async failure");
  });

  it("does not call next with error when async function resolves", async () => {
    const next = vi.fn();
    const handler = asyncHandler(async (_req, res) => {
      (res as unknown as { json: (v: unknown) => void }).json({ ok: true });
    });

    handler(mockReq() as never, mockRes() as never, next);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // next is not called with an error (it might be called with no args by the handler)
    const errorCalls = next.mock.calls.filter((call) => call.length > 0);
    expect(errorCalls).toHaveLength(0);
  });
});
