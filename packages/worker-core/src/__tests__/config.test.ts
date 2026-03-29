import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("loadConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should load config with required and default values", async () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const { loadConfig } = await import("../config");
    const config = loadConfig();

    expect(config.SUPABASE_URL).toBe("https://test.supabase.co");
    expect(config.SUPABASE_SERVICE_ROLE_KEY).toBe("test-service-key");
    expect(config.REDIS_HOST).toBe("localhost");
    expect(config.REDIS_PORT).toBe(6379);
    expect(config.REDIS_PASSWORD).toBeUndefined();
    expect(config.REDIS_TLS).toBe(false);
  });

  it("should use custom Redis values when provided", async () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.REDIS_HOST = "redis.example.com";
    process.env.REDIS_PORT = "6380";
    process.env.REDIS_PASSWORD = "secret";
    process.env.REDIS_TLS = "true";

    const { loadConfig } = await import("../config");
    const config = loadConfig();

    expect(config.REDIS_HOST).toBe("redis.example.com");
    expect(config.REDIS_PORT).toBe(6380);
    expect(config.REDIS_PASSWORD).toBe("secret");
    expect(config.REDIS_TLS).toBe(true);
  });

  it("should throw when SUPABASE_URL is missing", async () => {
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const { loadConfig } = await import("../config");

    expect(() => loadConfig()).toThrow("Missing required environment variable: SUPABASE_URL");
  });

  it("should throw when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { loadConfig } = await import("../config");

    expect(() => loadConfig()).toThrow("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  });
});
