## ADDED Requirements

### Requirement: Logger factory

The `@brain-feed/logger` package SHALL export a `createLogger(options?)` function that returns a Pino logger instance. The options SHALL accept `name` (string), `level` (string), and `prettyPrint` (boolean). The default log level SHALL be determined by `LOG_LEVEL` environment variable, falling back to `"debug"` when `NODE_ENV !== "production"` and `"info"` otherwise. When `prettyPrint` is true or `NODE_ENV !== "production"`, the logger SHALL use `pino-pretty` transport for human-readable output.

#### Scenario: Logger creation with defaults in production
- **WHEN** `createLogger({ name: "backend" })` is called with `NODE_ENV=production`
- **THEN** the logger SHALL output JSON logs at `"info"` level with the `name` field set to `"backend"`

#### Scenario: Logger creation with defaults in development
- **WHEN** `createLogger({ name: "backend" })` is called with `NODE_ENV=development`
- **THEN** the logger SHALL output pretty-printed logs at `"debug"` level

#### Scenario: LOG_LEVEL override
- **WHEN** `createLogger()` is called with `LOG_LEVEL=warn`
- **THEN** the logger SHALL output logs at `"warn"` level regardless of `NODE_ENV`

### Requirement: Child logger support

The logger returned by `createLogger()` SHALL support creating child loggers via `.child(bindings)` that inherit the parent's configuration and add additional context fields to every log line.

#### Scenario: Child logger with job context
- **WHEN** `logger.child({ jobId: "j1", bookmarkId: "b1" })` is called
- **THEN** every log line from the child logger SHALL include `jobId: "j1"` and `bookmarkId: "b1"` fields

### Requirement: AsyncLocalStorage request context

The package SHALL export a `requestContext` object (an `AsyncLocalStorage` instance) and a `contextMiddleware()` Express middleware function. The middleware SHALL create a new store with `{ requestId, startTime }` for each request. The `requestId` SHALL be read from the incoming `X-Request-Id` header or generated via `crypto.randomUUID()`. The middleware SHALL set the `X-Request-Id` response header.

#### Scenario: Request context with generated ID
- **WHEN** an HTTP request arrives without an `X-Request-Id` header
- **THEN** the middleware SHALL generate a UUID v4 `requestId`, store it in AsyncLocalStorage, and set it as the `X-Request-Id` response header

#### Scenario: Request context with provided ID
- **WHEN** an HTTP request arrives with `X-Request-Id: abc-123`
- **THEN** the middleware SHALL use `"abc-123"` as the `requestId` in the store and response header

#### Scenario: Request context accessible in handlers
- **WHEN** a route handler calls `requestContext.getStore()`
- **THEN** it SHALL receive `{ requestId: string, startTime: number }` or `undefined` if called outside request scope

### Requirement: Logger mixin for request context

The logger SHALL be configurable with a `mixin` function that reads from `requestContext` AsyncLocalStorage and injects `requestId` into every log line emitted within a request scope.

#### Scenario: Log line within request scope
- **WHEN** a log statement is executed inside an Express route handler
- **THEN** the log output SHALL include the `requestId` field from the current AsyncLocalStorage store

#### Scenario: Log line outside request scope
- **WHEN** a log statement is executed outside of any request scope (e.g., at startup)
- **THEN** the log output SHALL NOT include a `requestId` field

### Requirement: Request logger middleware

The package SHALL export a `requestLoggerMiddleware(logger)` Express middleware that logs HTTP access information on response completion. The log SHALL include `method`, `url`, `statusCode`, and `responseTime` (in milliseconds). The log level SHALL be determined by status code: 2xx and 3xx at `debug`, 4xx at `info`, 5xx at `error`.

#### Scenario: Successful request logging
- **WHEN** a request completes with status 200
- **THEN** the middleware SHALL log at `debug` level with `{ method, url, statusCode: 200, responseTime }`

#### Scenario: Client error logging
- **WHEN** a request completes with status 404
- **THEN** the middleware SHALL log at `info` level with `{ method, url, statusCode: 404, responseTime }`

#### Scenario: Server error logging
- **WHEN** a request completes with status 500
- **THEN** the middleware SHALL log at `error` level with `{ method, url, statusCode: 500, responseTime }`

### Requirement: Error handler middleware

The package SHALL export an `errorHandlerMiddleware(logger)` Express error middleware that classifies errors, logs them, and sends a JSON response. For `AppError` instances, it SHALL use the error's `statusCode` and call `toErrorResponse()`. For unknown errors, it SHALL respond with 500. The middleware SHALL log at `error` level for 5xx status codes and `warn` level for 4xx. In non-production environments, the response SHALL include the stack trace.

#### Scenario: AppError handling
- **WHEN** a `NotFoundError("Bookmark not found")` reaches the error handler
- **THEN** it SHALL log at `warn` level, respond with status 404 and JSON body `{ error: "Bookmark not found", code: "NOT_FOUND", statusCode: 404 }`

#### Scenario: Unknown error handling
- **WHEN** a plain `Error("something broke")` reaches the error handler
- **THEN** it SHALL log at `error` level with the full stack trace, respond with status 500 and JSON body `{ error: "Internal server error", code: "INTERNAL_ERROR", statusCode: 500 }`

#### Scenario: Stack trace in development
- **WHEN** any error reaches the handler with `NODE_ENV=development`
- **THEN** the JSON response SHALL include a `stack` field

### Requirement: asyncHandler wrapper

The package SHALL export an `asyncHandler(fn)` function that wraps an Express async route handler and forwards rejected promises to Express's `next()` error handler.

#### Scenario: Successful async handler
- **WHEN** an async route handler wrapped with `asyncHandler` resolves successfully
- **THEN** the response SHALL be sent normally with no error forwarding

#### Scenario: Failed async handler
- **WHEN** an async route handler wrapped with `asyncHandler` rejects with an error
- **THEN** the error SHALL be passed to `next()` so the error handler middleware can process it

### Requirement: getRequestId utility

The package SHALL export a `getRequestId()` function that reads the current `requestId` from AsyncLocalStorage. If called outside a request scope, it SHALL return `undefined`.

#### Scenario: Get requestId within request
- **WHEN** `getRequestId()` is called inside an Express route handler
- **THEN** it SHALL return the current request's UUID string

#### Scenario: Get requestId outside request
- **WHEN** `getRequestId()` is called at module level or in a worker
- **THEN** it SHALL return `undefined`
