import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";

import type { Request, Response, NextFunction } from "express";

export interface RequestStore {
  requestId: string;
  startTime: number;
}

export const requestContext = new AsyncLocalStorage<RequestStore>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

export function contextMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId =
      (req.headers["x-request-id"] as string | undefined) ??
      crypto.randomUUID();
    const store: RequestStore = {
      requestId,
      startTime: Date.now(),
    };
    res.setHeader("X-Request-Id", requestId);
    requestContext.run(store, () => next());
  };
}
