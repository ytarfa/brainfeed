import type { Request, Response, NextFunction } from "express";
import type pino from "pino";

import { isAppError, toErrorResponse } from "@brain-feed/error-types";

import { requestContext } from "./context";

export function requestLoggerMiddleware(logger: pino.Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on("finish", () => {
      const responseTime = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
      };

      if (res.statusCode >= 500) {
        logger.error(logData, "request completed");
      } else if (res.statusCode >= 400) {
        logger.info(logData, "request completed");
      } else {
        logger.debug(logData, "request completed");
      }
    });

    next();
  };
}

export function errorHandlerMiddleware(logger: pino.Logger) {
  return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (isAppError(err)) {
      const level = err.statusCode >= 500 ? "error" : "warn";
      logger[level](
        { err, statusCode: err.statusCode, code: err.code },
        err.message,
      );
      const body = toErrorResponse(err);
      res.status(err.statusCode).json(body);
    } else {
      logger.error({ err }, err.message || "Internal server error");
      const statusCode = 500;
      const isProduction = process.env.NODE_ENV === "production";
      const body: Record<string, unknown> = {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        statusCode,
      };
      if (!isProduction) {
        body.stack = err.stack;
      }
      res.status(statusCode).json(body);
    }
  };
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
