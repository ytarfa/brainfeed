import Redis from "ioredis";
import type { WorkerCoreConfig } from "./config";

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  tls?: boolean;
}

export function createRedisConnection(config?: RedisConfig): Redis {
  const host = config?.host ?? "localhost";
  const port = config?.port ?? 6379;
  const password = config?.password;
  const tls = config?.tls ?? false;

  return new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: null, // Required by BullMQ
    ...(tls ? { tls: {} } : {}),
  });
}

export function createRedisConnectionFromConfig(config: WorkerCoreConfig): Redis {
  return createRedisConnection({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    tls: config.REDIS_TLS,
  });
}
