## Why

The monorepo has zero logging infrastructure (all 41 log statements are raw `console.*` calls) and fragmented, minimal error handling. The backend's global error handler is 3 lines that always return 500. Most async Express 4 route handlers lack try/catch, risking unhandled promise rejections. The frontend has no Error Boundary, no global error toast, and no 401 interceptor. There are no structured logs, log levels, timestamps, or correlation IDs anywhere, making production debugging and incident response nearly impossible.

## What Changes

- **New `@brain-feed/error-types` package**: Universal error class hierarchy (`AppError` and subclasses for 400/401/403/404/409/502) with type guards and serialization helpers. Zero dependencies.
- **New `@brain-feed/logger` package**: Pino-based structured JSON logger with Express middleware (context/correlation IDs via AsyncLocalStorage, HTTP access logging, error handler, async route wrapper). Includes `pino-pretty` for dev.
- **New `@brain-feed/frontend-error-reporter` package**: Browser error reporting with `ErrorBoundary` component, `useErrorReporter()` hook, and Sentry-ready `report()` function.
- **Backend integration**: Replace all `console.*` calls with structured logger. Swap the 3-line error handler for the new error-classifying middleware. Wrap all async route handlers with `asyncHandler()`. Throw typed `AppError` subclasses instead of inline Supabase error checks. Propagate `requestId` to enrichment queue jobs.
- **Worker integration**: Replace all `console.*` calls with structured logger. Create child loggers per job with `{ jobId, requestId, bookmarkId }` context. Make `GoogleApiError` extend `ExternalServiceError`.
- **Frontend integration**: Add `ErrorBoundary` at app root. Wire `ToastProvider` context for global error toasts. Add 401 interceptor to API client for automatic redirect to login. Report 5xx errors via `errorReporter`.

## Capabilities

### New Capabilities
- `error-types`: Shared error class hierarchy (AppError, ValidationError, AuthenticationError, ForbiddenError, NotFoundError, ConflictError, ExternalServiceError) with type guards and HTTP serialization utilities
- `server-logging`: Pino-based structured JSON logging for Node.js services with Express middleware (context/correlation IDs, HTTP access logs, error handler, asyncHandler)
- `frontend-error-reporting`: Browser error reporting infrastructure with ErrorBoundary, useErrorReporter hook, toast notifications, and API client error interceptors

### Modified Capabilities
- `enrichment-worker`: GoogleApiError refactored to extend ExternalServiceError from error-types; all console.* replaced with structured child loggers; requestId propagated from backend via job data
- `worker-infrastructure`: Worker entry point updated to use structured logger instead of console.*

## Impact

- **New packages**: `packages/error-types`, `packages/logger`, `packages/frontend-error-reporter` added to pnpm workspace
- **Dependencies**: `pino` + `pino-pretty` added to logger package; no new frontend deps (ErrorBoundary is pure React)
- **All backend routes**: Wrapped with `asyncHandler`, inline Supabase error checks replaced with thrown AppErrors
- **Express middleware stack**: New middleware inserted (context, request logger, error handler)
- **API client** (`apps/frontend/src/api/client.ts`): 401 interceptor added, 5xx reporting added
- **App root** (`apps/frontend/src/App.tsx`): ErrorBoundary and ToastProvider wrappers added
- **Worker-enrichment**: GoogleApiError import path changes, logger replaces console.*
- **Environment**: `LOG_LEVEL` env var supported (default: "info" prod, "debug" dev)
- **No database changes**
- **No breaking API changes** (error response format becomes more structured but remains JSON `{ error }`)
