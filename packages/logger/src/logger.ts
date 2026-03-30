import pino from "pino";

import { requestContext } from "./context";

export interface CreateLoggerOptions {
  name?: string;
  level?: string;
  prettyPrint?: boolean;
}

export function createLogger(options: CreateLoggerOptions = {}): pino.Logger {
  const isProduction = process.env.NODE_ENV === "production";
  const level =
    options.level ??
    process.env.LOG_LEVEL ??
    (isProduction ? "info" : "debug");
  const usePretty = options.prettyPrint ?? !isProduction;

  const pinoOptions: pino.LoggerOptions = {
    name: options.name,
    level,
    mixin() {
      const store = requestContext.getStore();
      if (store) {
        return { requestId: store.requestId };
      }
      return {};
    },
  };

  if (usePretty) {
    return pino(pinoOptions, pino.transport({ target: "pino-pretty" }));
  }

  return pino(pinoOptions);
}
