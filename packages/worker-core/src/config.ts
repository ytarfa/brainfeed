import dotenv from "dotenv";
dotenv.config();

export interface WorkerCoreConfig {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string | undefined;
  REDIS_TLS: boolean;
  LOG_LEVEL: string | undefined;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(): WorkerCoreConfig {
  return {
    SUPABASE_URL: requireEnv("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    REDIS_HOST: process.env.REDIS_HOST ?? "localhost",
    REDIS_PORT: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD ?? undefined,
    REDIS_TLS: process.env.REDIS_TLS === "true",
    LOG_LEVEL: process.env.LOG_LEVEL ?? undefined,
  };
}
