## Purpose

Defines the shared error type hierarchy (`@brain-feed/error-types` package) used across the backend, workers, and frontend for consistent error classification, serialization, and HTTP status mapping.

## Requirements

### Requirement: AppError base class

The `@brain-feed/error-types` package SHALL export an `AppError` class that extends `Error`. `AppError` SHALL accept `message` (string), `statusCode` (number, default 500), `code` (string, default `"INTERNAL_ERROR"`), and an optional `context` (Record<string, unknown>). It SHALL have a readonly `isOperational` property defaulting to `true` and a `__appError` brand property set to `true` for cross-boundary identification.

#### Scenario: AppError construction with defaults
- **WHEN** `new AppError("Something went wrong")` is called
- **THEN** the error SHALL have `message: "Something went wrong"`, `statusCode: 500`, `code: "INTERNAL_ERROR"`, `isOperational: true`, `context: {}`, and `__appError: true`

#### Scenario: AppError construction with all options
- **WHEN** `new AppError("Not found", 404, "NOT_FOUND", { resourceId: "abc" })` is called
- **THEN** the error SHALL have `statusCode: 404`, `code: "NOT_FOUND"`, and `context: { resourceId: "abc" }`

#### Scenario: AppError is an instance of Error
- **WHEN** an `AppError` is thrown
- **THEN** `error instanceof Error` SHALL return `true` and `error.stack` SHALL be defined

### Requirement: HTTP error subclasses

The package SHALL export the following `AppError` subclasses with preset `statusCode` and `code`:
- `ValidationError` (400, `VALIDATION_ERROR`)
- `AuthenticationError` (401, `AUTHENTICATION_ERROR`)
- `ForbiddenError` (403, `FORBIDDEN`)
- `NotFoundError` (404, `NOT_FOUND`)
- `ConflictError` (409, `CONFLICT`)
- `ExternalServiceError` (502, `EXTERNAL_SERVICE_ERROR`)

Each subclass SHALL accept `message` (string) and optional `context` (Record<string, unknown>).

#### Scenario: ValidationError defaults
- **WHEN** `new ValidationError("Invalid email")` is thrown
- **THEN** the error SHALL have `statusCode: 400`, `code: "VALIDATION_ERROR"`, and `isOperational: true`

#### Scenario: NotFoundError with context
- **WHEN** `new NotFoundError("Bookmark not found", { bookmarkId: "123" })` is thrown
- **THEN** the error SHALL have `statusCode: 404`, `code: "NOT_FOUND"`, and `context: { bookmarkId: "123" }`

#### Scenario: ExternalServiceError defaults
- **WHEN** `new ExternalServiceError("YouTube API failed")` is thrown
- **THEN** the error SHALL have `statusCode: 502`, `code: "EXTERNAL_SERVICE_ERROR"`, and `isOperational: true`

### Requirement: isAppError type guard

The package SHALL export an `isAppError(error: unknown): error is AppError` function that checks for the `__appError` brand property rather than relying solely on `instanceof`.

#### Scenario: Type guard with AppError instance
- **WHEN** `isAppError(new NotFoundError("x"))` is called
- **THEN** it SHALL return `true`

#### Scenario: Type guard with plain Error
- **WHEN** `isAppError(new Error("x"))` is called
- **THEN** it SHALL return `false`

#### Scenario: Type guard with non-error value
- **WHEN** `isAppError("string")` or `isAppError(null)` is called
- **THEN** it SHALL return `false`

### Requirement: toErrorResponse serializer

The package SHALL export a `toErrorResponse(error: AppError)` function that returns a plain JSON-serializable object with `{ error: string, code: string, statusCode: number }`. In non-production environments (`NODE_ENV !== "production"`), the response SHALL additionally include `stack` and `context`.

#### Scenario: Production error response
- **WHEN** `toErrorResponse(new ValidationError("Bad input"))` is called with `NODE_ENV=production`
- **THEN** it SHALL return `{ error: "Bad input", code: "VALIDATION_ERROR", statusCode: 400 }` without `stack` or `context`

#### Scenario: Development error response
- **WHEN** `toErrorResponse(new ValidationError("Bad input", { field: "email" }))` is called with `NODE_ENV=development`
- **THEN** it SHALL return an object that includes `error`, `code`, `statusCode`, `stack`, and `context: { field: "email" }`

### Requirement: httpStatusFromError utility

The package SHALL export an `httpStatusFromError(error: unknown): number` function. For `AppError` instances it SHALL return `error.statusCode`. For all other errors it SHALL return `500`.

#### Scenario: Status from AppError
- **WHEN** `httpStatusFromError(new NotFoundError("x"))` is called
- **THEN** it SHALL return `404`

#### Scenario: Status from unknown error
- **WHEN** `httpStatusFromError(new Error("x"))` is called
- **THEN** it SHALL return `500`
