## 1. Package: @brain-feed/error-types

- [x] 1.1 Scaffold `packages/error-types` package (package.json, tsconfig.json, src/index.ts barrel export)
- [x] 1.2 Implement `AppError` base class with `message`, `statusCode`, `code`, `isOperational`, `context`, `__appError` brand
- [x] 1.3 Implement HTTP error subclasses: `ValidationError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ExternalServiceError`
- [x] 1.4 Implement `isAppError()` type guard using `__appError` brand check
- [x] 1.5 Implement `toErrorResponse()` serializer (strips stack/context in production)
- [x] 1.6 Implement `httpStatusFromError()` utility
- [x] 1.7 Add to pnpm workspace, run `pnpm install`, verify `pnpm --filter error-types build` succeeds
- [x] 1.8 Write unit tests for all error classes, type guard, serializer, and utility; run tests and verify they pass

## 2. Package: @brain-feed/logger

- [x] 2.1 Scaffold `packages/logger` package (package.json with `pino` + `pino-pretty` deps, tsconfig.json, src/index.ts barrel export)
- [x] 2.2 Implement `createLogger(options?)` factory: Pino instance with JSON output, LOG_LEVEL env var, pino-pretty transport for dev
- [x] 2.3 Implement `requestContext` AsyncLocalStorage instance and `contextMiddleware()` Express middleware (generates/reads requestId, sets X-Request-Id header)
- [x] 2.4 Implement logger `mixin` function that reads `requestId` from AsyncLocalStorage store
- [x] 2.5 Implement `requestLoggerMiddleware(logger)`: logs HTTP access on response finish with level based on status code (2xx/3xx=debug, 4xx=info, 5xx=error)
- [x] 2.6 Implement `errorHandlerMiddleware(logger)`: classifies errors via `isAppError`, logs, responds JSON with `toErrorResponse()`, strips stack in prod
- [x] 2.7 Implement `asyncHandler(fn)` wrapper for Express async route handlers
- [x] 2.8 Implement `getRequestId()` utility that reads from AsyncLocalStorage
- [x] 2.9 Add to pnpm workspace, add `@brain-feed/error-types` as dependency, verify build succeeds
- [x] 2.10 Write unit tests for logger factory, middleware stack, asyncHandler, getRequestId; run tests and verify they pass

## 3. Package: @brain-feed/frontend-error-reporter

- [x] 3.1 Scaffold `packages/frontend-error-reporter` package (package.json with `react` peer dep, tsconfig.json, src/index.ts barrel export)
- [x] 3.2 Implement `errorReporter` singleton with `init(options?)` and `report(error, context?)` methods
- [x] 3.3 Implement `ErrorBoundary` React component (catches render errors, calls report(), renders fallback)
- [x] 3.4 Implement `useErrorReporter()` hook returning `{ report }`
- [x] 3.5 Add to pnpm workspace, verify build succeeds
- [x] 3.6 Write unit tests for errorReporter singleton, ErrorBoundary, and useErrorReporter hook; run tests and verify they pass

## 4. Backend Integration

- [x] 4.1 Add `@brain-feed/error-types` and `@brain-feed/logger` as dependencies to `apps/backend`
- [x] 4.2 Create logger instance in backend (e.g., `src/lib/logger.ts`) via `createLogger({ name: "backend" })`
- [x] 4.3 Register middleware stack in `src/index.ts`: `contextMiddleware()` first, then `requestLoggerMiddleware(logger)` early, then existing middleware, then `errorHandlerMiddleware(logger)` last (replacing current 3-line error handler)
- [x] 4.4 Wrap all async route handlers across all route files with `asyncHandler()`
- [x] 4.5 Replace inline Supabase error checks (`if (error) { res.status(500).json(...) }`) with thrown `AppError` subclasses (NotFoundError, ValidationError, etc.) across all route files
- [x] 4.6 Replace all `console.*` calls in backend with structured logger calls at appropriate levels
- [x] 4.7 Propagate `requestId` (via `getRequestId()`) into enrichment job data in `src/lib/enrichmentQueue.ts`
- [x] 4.8 Run existing backend tests, update/create tests for the new middleware and error handling; verify all pass

## 5. Worker Integration

- [x] 5.1 Add `@brain-feed/error-types` and `@brain-feed/logger` as dependencies to `packages/worker-enrichment`
- [x] 5.2 Create logger instance in worker entry point via `createLogger({ name: "enrichment-worker" })`
- [x] 5.3 Create child logger per job in processor with `{ jobId, requestId, bookmarkId }` bindings
- [x] 5.4 Replace all `console.*` calls in worker-enrichment (`index.ts`, `processor.ts`, `health.ts`) with structured logger at appropriate levels
- [x] 5.5 Refactor `GoogleApiError` to extend `ExternalServiceError` from `@brain-feed/error-types`, passing `status`, `code`, `details` through `context`
- [x] 5.6 Add `LOG_LEVEL` to `worker-core` config (optional env var in `WorkerCoreConfig`)
- [x] 5.7 Run existing worker tests, update/create tests for structured logging and GoogleApiError refactor; verify all pass

## 6. Frontend Integration

- [x] 6.1 Add `@brain-feed/frontend-error-reporter` and `@brain-feed/error-types` as dependencies to `apps/frontend`
- [x] 6.2 Build `ToastProvider` context and `Toast` component in `apps/frontend` (inline styles per project conventions)
- [x] 6.3 Wire `errorReporter.init({ onError: showToast })` in App.tsx, wrap app root with `ErrorBoundary` and `ToastProvider`
- [x] 6.4 Add 401 interceptor to API client (`src/api/client.ts`): clear auth state and redirect to login on 401 responses
- [x] 6.5 Add 5xx error reporting to API client: call `errorReporter.report()` on server errors
- [x] 6.6 Replace `console.warn` in `AuthContext.tsx` with `errorReporter.report()`
- [x] 6.7 Run existing frontend tests, create tests for ErrorBoundary, ToastProvider, and API interceptors; verify all pass
- [x] 6.8 Verify ErrorBoundary, toast notifications, and 401 redirect behavior via Playwright browser automation

## 7. Final Verification

- [x] 7.1 Run full monorepo build (`pnpm build`) and verify all packages and apps compile successfully
- [x] 7.2 Run full monorepo lint (`pnpm lint`) and verify no lint errors
- [x] 7.3 Run all tests across the monorepo and verify they pass
- [x] 7.4 Manual smoke test: start backend and frontend in dev mode, trigger error scenarios, verify structured logs appear and error responses are correct
