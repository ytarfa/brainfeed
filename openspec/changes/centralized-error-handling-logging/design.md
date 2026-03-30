## Context

The brain-feed monorepo has zero logging infrastructure and fragmented error handling. All 41 log statements across the codebase are raw `console.*` calls. The backend's global error handler is 3 lines that always return HTTP 500. Most Express 4 async route handlers lack try/catch, risking unhandled promise rejections. The frontend has no Error Boundary, no global error toast, and no 401 interceptor. There are no structured logs, log levels, timestamps, or correlation IDs, making production debugging impractical.

The monorepo deploys backend to Railway (which natively parses JSON logs) and frontend to Vercel (static SPA). Three new workspace packages will be created to provide shared, consistent infrastructure across all apps and services.

## Goals / Non-Goals

**Goals:**
- Structured JSON logging in all Node.js services (backend + worker) with log levels, timestamps, and correlation IDs
- Universal error class hierarchy shared across all packages
- Request-scoped context (requestId) propagated from HTTP request through to background jobs
- Express middleware stack: context injection, HTTP access logging, error classification/handling, async route wrapping
- Frontend error boundary, global error toasts, and API error interceptors
- All existing `console.*` calls replaced with structured logger calls
- Zero-config sensible defaults with `LOG_LEVEL` env var override

**Non-Goals:**
- Log aggregation/shipping infrastructure (Railway handles this natively)
- Sentry integration implementation (architecture is Sentry-ready but integration is deferred)
- Distributed tracing / OpenTelemetry spans
- Rate limiting or circuit breaker patterns
- Frontend logging library (browser uses `errorReporter`, not Pino)
- Dead-letter queue handling for failed jobs (existing BullMQ retry behavior preserved)

## Decisions

### D1: Three separate packages vs. one monolithic package

**Decision**: Three packages: `@brain-feed/error-types`, `@brain-feed/logger`, `@brain-feed/frontend-error-reporter`.

**Rationale**: Error types have zero dependencies and are needed everywhere (frontend, backend, worker). The logger depends on Pino (Node.js only) and should not be bundled into the frontend. The frontend error reporter depends on React and should not be pulled into backend/worker. Three packages respect the dependency graph and keep bundle sizes minimal.

**Alternatives considered**:
- Single `@brain-feed/common` package: would force Pino into frontend bundle and React into backend. Rejected.
- Two packages (shared + frontend): would still couple error types to Pino. Rejected.

### D2: Pino as the logging library

**Decision**: Use Pino with `pino-pretty` for dev.

**Rationale**: JSON output by default (Railway parses natively). Child loggers for context binding (requestId, jobId). Async/non-blocking. Smallest footprint of mature Node.js loggers. Native TypeScript types.

**Alternatives considered**:
- Winston: heavier, synchronous transports by default, more config surface. Rejected.
- Bunyan: less maintained, similar features to Pino but slower. Rejected.
- Console wrapper: insufficient — no JSON structure, no child loggers, no log levels. Rejected.

### D3: AsyncLocalStorage for request context

**Decision**: Use Node.js `AsyncLocalStorage` to propagate request context (requestId, userId) through the entire async call chain without explicit parameter passing.

**Rationale**: Allows any code in the request path to access requestId without threading it through every function signature. The logger reads from AsyncLocalStorage automatically, ensuring all log lines within a request share the same correlation ID.

**Implementation**: `contextMiddleware()` creates a new `AsyncLocalStorage` store per request with `{ requestId, startTime }`. The logger's `mixin()` function reads from the store. The requestId is either read from `X-Request-Id` header or generated via `crypto.randomUUID()`.

### D4: Error class hierarchy in a zero-dep package

**Decision**: `AppError` base class with HTTP-specific subclasses in `@brain-feed/error-types`. Zero runtime dependencies.

**Rationale**: Error types are consumed by every package. Zero deps means no version conflicts and instant installation. The `isAppError()` type guard enables safe `instanceof` checks across package boundaries (single source class). `toErrorResponse()` standardizes JSON error serialization.

**Hierarchy**:
```
AppError { message, statusCode, code, isOperational, context }
├── ValidationError (400, VALIDATION_ERROR)
├── AuthenticationError (401, AUTHENTICATION_ERROR)
├── ForbiddenError (403, FORBIDDEN)
├── NotFoundError (404, NOT_FOUND)
├── ConflictError (409, CONFLICT)
└── ExternalServiceError (502, EXTERNAL_SERVICE_ERROR)
```

`GoogleApiError` in worker-enrichment becomes a subclass of `ExternalServiceError`, preserving its existing `code` and `details` properties.

### D5: Express middleware ordering

**Decision**: Middleware registered in this order:
1. `contextMiddleware()` — AsyncLocalStorage + requestId + X-Request-Id response header
2. Existing middleware (helmet, cors, json, auth, validation)
3. Route handlers wrapped with `asyncHandler()`
4. `requestLoggerMiddleware(logger)` — logs on response `finish` event (placed early, logs at end)
5. `errorHandlerMiddleware(logger)` — catch-all error handler (replaces current 3-line handler)

**Rationale**: Context must be first so all subsequent middleware/handlers have access to requestId. Request logger hooks into response `finish` event so it can be registered early but log after response. Error handler must be last to catch everything.

### D6: Log level policy

**Decision**: Six levels with clear assignment:
- `fatal`: process about to crash
- `error`: operation failed, needs attention (5xx, failed jobs after retries)
- `warn`: unexpected but handled (retries, degraded responses, auth failures)
- `info`: significant business events (server start, job completed, 4xx responses)
- `debug`: operational detail (2xx/3xx responses, cache hits, queue publishes)
- `trace`: granular internals (raw payloads, LLM prompts — never in production)

Default: `"info"` in production, `"debug"` in development. Override via `LOG_LEVEL` env var.

### D7: RequestId propagation to workers

**Decision**: Add `requestId` to enrichment job data payload. Worker creates child logger bound with `{ jobId, requestId, bookmarkId }`.

**Rationale**: Enables tracing a user action from HTTP request through queue to worker completion. Worker-side logging includes the originating requestId so log aggregation can correlate the full chain.

### D8: Frontend ErrorBoundary and Toast architecture

**Decision**: `ErrorBoundary` component in `@brain-feed/frontend-error-reporter`. `ToastProvider` and `Toast` component built in `apps/frontend` (not in the package). Connected via `errorReporter.init({ onError: showToast })`.

**Rationale**: The error reporter package should be framework-agnostic enough to reuse. The Toast UI is app-specific styling. The `init()` pattern allows the app to wire them together at startup.

**API client changes**: Add response interceptor — 401 clears auth state and redirects to login; 5xx calls `errorReporter.report()`.

## Risks / Trade-offs

- **[AsyncLocalStorage performance]** → Negligible overhead for HTTP request lifecycles. Node.js docs confirm it's production-ready since v16. No mitigation needed.
- **[Pino JSON output in dev terminal]** → Mitigated by `pino-pretty` as dev dependency with transport config. Dev gets human-readable, prod gets JSON.
- **[Package boundary `instanceof` checks]** → If multiple versions of `@brain-feed/error-types` are installed, `instanceof AppError` may fail. Mitigated by `isAppError()` type guard that checks for the `__appError` brand property, plus pnpm workspace ensures single version.
- **[Migration effort for 30+ inline error checks]** → Significant but mechanical. Each `if (error) { res.status(500).json(...) }` becomes a thrown `AppError` subclass caught by the error handler. Can be done file-by-file.
- **[Express 4 async handling]** → `asyncHandler()` wrapper is required for every async route handler. Missing a wrapper means unhandled rejections. Mitigated by lint rule or code review convention. Express 5 migration would eliminate this need but is out of scope.
- **[Frontend error reporter without Sentry]** → Initially just console.error + toast. Acceptable for current scale. Sentry integration is architecturally prepared but not implemented.

## Migration Plan

**Phase 1 — Package creation** (no existing code changes):
1. Create `packages/error-types` with error hierarchy, type guards, serialization
2. Create `packages/logger` with Pino logger factory, Express middleware, AsyncLocalStorage context
3. Create `packages/frontend-error-reporter` with ErrorBoundary, useErrorReporter, report()
4. Add all three to pnpm workspace, verify builds

**Phase 2 — Backend integration**:
1. Add middleware stack to `apps/backend/src/index.ts` (context, request logger, error handler)
2. Create `asyncHandler` wrapper, apply to all route files
3. Replace inline Supabase error checks with thrown AppError subclasses
4. Replace `console.*` calls with logger calls
5. Propagate requestId in enrichment job data

**Phase 3 — Worker integration**:
1. Replace all `console.*` in worker-enrichment with structured logger
2. Create child loggers per job with context binding
3. Refactor `GoogleApiError` to extend `ExternalServiceError`

**Phase 4 — Frontend integration**:
1. Add ErrorBoundary wrapper at app root
2. Build ToastProvider and Toast component
3. Wire errorReporter.init() with toast callback
4. Add 401/5xx interceptors to API client
5. Clean up per-page error handling where redundant

**Rollback**: Each phase is independently deployable. Packages can be reverted by removing workspace entries and reverting import changes. No database changes involved.

## Open Questions

- None — all decisions resolved during explore session.
