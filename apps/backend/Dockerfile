# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/error-types/package.json ./packages/error-types/
COPY packages/logger/package.json ./packages/logger/
COPY packages/worker-core/package.json ./packages/worker-core/

# Install deps for backend and all workspace dependencies
RUN pnpm install --frozen-lockfile \
    --filter @brain-feed/backend \
    --filter @brain-feed/error-types \
    --filter @brain-feed/logger \
    --filter @brain-feed/worker-core

# Copy source and tsconfig
COPY tsconfig.json ./
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src
COPY packages/types/src ./packages/types/src
COPY packages/types/tsconfig.json ./packages/types/
COPY packages/error-types/src ./packages/error-types/src
COPY packages/error-types/tsconfig.json ./packages/error-types/
COPY packages/logger/src ./packages/logger/src
COPY packages/logger/tsconfig.json ./packages/logger/
COPY packages/worker-core/src ./packages/worker-core/src
COPY packages/worker-core/tsconfig.json ./packages/worker-core/

# Build TypeScript — dependency order: error-types -> logger -> worker-core -> backend
RUN pnpm --filter @brain-feed/error-types run build && \
    pnpm --filter @brain-feed/logger run build && \
    pnpm --filter @brain-feed/worker-core run build && \
    pnpm --filter @brain-feed/backend run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests for production install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/error-types/package.json ./packages/error-types/
COPY packages/logger/package.json ./packages/logger/
COPY packages/worker-core/package.json ./packages/worker-core/

# Install production dependencies
RUN pnpm install --frozen-lockfile \
    --filter @brain-feed/backend \
    --filter @brain-feed/error-types \
    --filter @brain-feed/logger \
    --filter @brain-feed/worker-core \
    --prod

# Copy compiled output from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/error-types/dist ./packages/error-types/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/packages/worker-core/dist ./packages/worker-core/dist

EXPOSE 3001

CMD ["node", "apps/backend/dist/index.js"]
