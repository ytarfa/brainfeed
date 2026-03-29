# Cloud Redis Setup

This guide covers provisioning a managed Redis instance for the enrichment worker in production. Locally, use the Docker Compose file at the repository root (`docker-compose up redis`).

---

## Option 1: Railway Redis

[Railway](https://railway.app) provides one-click Redis provisioning.

1. Open your Railway project dashboard.
2. Click **New** → **Database** → **Redis**.
3. Railway provisions a Redis 7 instance and exposes connection variables automatically.
4. Copy the following environment variables from the Railway service's **Variables** tab:

   | Railway Variable | Worker Env Var | Example |
   |---|---|---|
   | `REDISHOST` | `REDIS_HOST` | `containers-us-west-123.railway.app` |
   | `REDISPORT` | `REDIS_PORT` | `6379` |
   | `REDISPASSWORD` | `REDIS_PASSWORD` | `abc123...` |

5. Set `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` on your backend and worker services.

> **Tip:** If your backend and worker run on the same Railway project, use the private network hostname (e.g., `redis.railway.internal`) instead of the public one for lower latency and no egress charges.

---

## Option 2: Upstash Redis

[Upstash](https://upstash.com) offers serverless Redis with a generous free tier.

1. Sign up at [console.upstash.com](https://console.upstash.com).
2. Click **Create Database**.
3. Choose a region close to your Supabase project (e.g., `us-east-1`).
4. Enable **TLS** (recommended for production).
5. From the database details page, copy:

   | Upstash Field | Worker Env Var | Example |
   |---|---|---|
   | Endpoint | `REDIS_HOST` | `us1-shiny-whale-12345.upstash.io` |
   | Port | `REDIS_PORT` | `6379` |
   | Password | `REDIS_PASSWORD` | `AX...` |

6. Since Upstash uses TLS by default, ensure your Redis client enables TLS. In `worker-core`, the `createRedisConnection` function supports this via the `REDIS_TLS` environment variable:

   ```
   REDIS_TLS=true
   ```

---

## Environment Variables Summary

All worker and backend services need these variables to connect to Redis:

```bash
REDIS_HOST=localhost          # or your cloud Redis hostname
REDIS_PORT=6379               # default Redis port
REDIS_PASSWORD=               # leave empty for local, set for cloud
REDIS_TLS=false               # set to "true" for Upstash or any TLS-enabled Redis
```

These are configured in each service's `.env` file or via your hosting platform's environment variable management.

---

## Verifying the Connection

After setting the variables, start the enrichment worker:

```bash
pnpm --filter worker-enrichment dev
```

The worker logs should show a successful Redis connection. The health endpoint (`GET http://localhost:3002/health`) should return `{ "status": "ok" }`.
