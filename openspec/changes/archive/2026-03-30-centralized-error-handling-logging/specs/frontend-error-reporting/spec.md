## ADDED Requirements

### Requirement: Error reporter initialization

The `@brain-feed/frontend-error-reporter` package SHALL export an `errorReporter` singleton with an `init(options?)` method. Options SHALL accept `onError` (callback receiving error and context) and `sentry` (optional Sentry-like client for future integration). The `init()` method SHALL configure the reporter and MAY be called multiple times to update configuration.

#### Scenario: Init with onError callback
- **WHEN** `errorReporter.init({ onError: (err, ctx) => showToast(err.message) })` is called
- **THEN** subsequent calls to `errorReporter.report()` SHALL invoke the `onError` callback

#### Scenario: Init without options
- **WHEN** `errorReporter.init()` is called with no arguments
- **THEN** the reporter SHALL fall back to `console.error` for error reporting

### Requirement: Error reporting function

The `errorReporter` SHALL expose a `report(error: unknown, context?: Record<string, unknown>)` method. It SHALL always call `console.error` with the error. If an `onError` callback was configured, it SHALL be called with the error and context. If a Sentry client was configured, it SHALL call `captureException`.

#### Scenario: Report with configured callback
- **WHEN** `errorReporter.report(new Error("API failed"), { endpoint: "/bookmarks" })` is called after init with `onError`
- **THEN** the reporter SHALL call `console.error` and invoke `onError` with the error and `{ endpoint: "/bookmarks" }`

#### Scenario: Report without init
- **WHEN** `errorReporter.report(new Error("oops"))` is called without prior `init()`
- **THEN** the reporter SHALL call `console.error` only

### Requirement: ErrorBoundary component

The package SHALL export an `ErrorBoundary` React component that catches render-phase errors in its children. It SHALL accept `fallback` (ReactNode or render function receiving the error) and `onError` (optional callback). When an error is caught, it SHALL call `errorReporter.report()` and render the fallback.

#### Scenario: Child render error caught
- **WHEN** a child component throws during rendering
- **THEN** the ErrorBoundary SHALL catch the error, call `errorReporter.report(error, { componentStack })`, and render the `fallback` content

#### Scenario: No error in children
- **WHEN** all child components render successfully
- **THEN** the ErrorBoundary SHALL render children normally with no overhead

#### Scenario: Fallback as render function
- **WHEN** `fallback` is a function `(error) => <div>{error.message}</div>`
- **THEN** the ErrorBoundary SHALL call the function with the caught error and render the result

### Requirement: useErrorReporter hook

The package SHALL export a `useErrorReporter()` hook that returns `{ report }` for use in React components. The `report` function SHALL delegate to `errorReporter.report()`.

#### Scenario: Hook usage in component
- **WHEN** a component calls `const { report } = useErrorReporter()` and then `report(error, { action: "save" })`
- **THEN** it SHALL invoke `errorReporter.report(error, { action: "save" })`
