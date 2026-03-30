## MODIFIED Requirements

### Requirement: Worker-core environment configuration

The `worker-core` package SHALL validate required environment variables at initialization and export a typed configuration object. The configuration SHALL additionally accept `LOG_LEVEL` as an optional environment variable.

#### Scenario: Required environment variables
- **WHEN** the worker-core configuration is initialized
- **THEN** it SHALL require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and accept optional `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, and `LOG_LEVEL` with sensible defaults

#### Scenario: Missing required variables
- **WHEN** `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is not set
- **THEN** initialization SHALL throw an error with a clear message indicating which variable is missing
