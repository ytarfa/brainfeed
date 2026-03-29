import { describe, it, expect, vi } from "vitest";
import { createRedisConnection, createRedisConnectionFromConfig } from "../redis";
import type { WorkerCoreConfig } from "../config";

// Mock ioredis
vi.mock("ioredis", () => {
  const MockRedis = vi.fn().mockImplementation((opts) => ({
    options: opts,
    status: "ready",
    disconnect: vi.fn(),
  }));
  return { default: MockRedis };
});

describe("createRedisConnection", () => {
  it("should create a connection with default values when no config provided", () => {
    const redis = createRedisConnection();
    expect(redis).toBeDefined();
    expect(redis.options).toMatchObject({
      host: "localhost",
      port: 6379,
      maxRetriesPerRequest: null,
    });
    expect(redis.options.password).toBeUndefined();
  });

  it("should create a connection with custom config", () => {
    const redis = createRedisConnection({
      host: "redis.example.com",
      port: 6380,
      password: "secret",
    });
    expect(redis.options).toMatchObject({
      host: "redis.example.com",
      port: 6380,
      password: "secret",
      maxRetriesPerRequest: null,
    });
  });

  it("should include TLS options when tls is true", () => {
    const redis = createRedisConnection({
      host: "redis.example.com",
      port: 6380,
      tls: true,
    });
    expect(redis.options).toMatchObject({
      host: "redis.example.com",
      port: 6380,
      tls: {},
      maxRetriesPerRequest: null,
    });
  });

  it("should not include TLS options when tls is false", () => {
    const redis = createRedisConnection({
      host: "localhost",
      port: 6379,
      tls: false,
    });
    expect(redis.options.tls).toBeUndefined();
  });
});

describe("createRedisConnectionFromConfig", () => {
  it("should create a connection from WorkerCoreConfig", () => {
    const config: WorkerCoreConfig = {
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-key",
      REDIS_HOST: "redis.example.com",
      REDIS_PORT: 6380,
      REDIS_PASSWORD: "secret",
      REDIS_TLS: true,
    };

    const redis = createRedisConnectionFromConfig(config);
    expect(redis.options).toMatchObject({
      host: "redis.example.com",
      port: 6380,
      password: "secret",
      tls: {},
      maxRetriesPerRequest: null,
    });
  });
});
