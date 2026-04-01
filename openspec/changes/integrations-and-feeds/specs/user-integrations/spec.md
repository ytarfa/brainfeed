# User Integrations

## ADDED Requirements

### Requirement: user_integrations database table

The `user_integrations` table stores metadata about a user's connected third-party accounts. It does NOT store tokens directly — tokens are stored in Supabase Vault and referenced via `vault_secret_id`.

#### Scenario: Table schema

WHEN the migration is applied
THEN the `user_integrations` table exists with columns:
  - `id` uuid primary key (default `gen_random_uuid()`)
  - `user_id` uuid not null, FK to `profiles(id)` on delete cascade
  - `provider` text not null (e.g. `'github'`, `'google'`)
  - `vault_secret_id` uuid not null (references a Vault secret containing encrypted token JSON)
  - `token_expires_at` timestamptz (nullable — null means token does not expire)
  - `scopes` text array not null default `'{}'`
  - `provider_user_id` text (the user's ID on the provider platform)
  - `provider_username` text (display name on the provider)
  - `provider_avatar` text (avatar URL)
  - `status` text not null default `'active'`, CHECK in (`'active'`, `'expired'`, `'revoked'`)
  - `created_at` timestamptz not null default `now()`
  - `updated_at` timestamptz not null default `now()`
  - UNIQUE constraint on `(user_id, provider)`
AND RLS is enabled with a policy allowing authenticated users to read their own integrations
AND only the service role can insert/update/delete (token operations are server-side only)

### Requirement: Vault token storage functions

Server-side Postgres functions manage token CRUD in Vault, callable only by the service role.

#### Scenario: Storing tokens for a new integration

WHEN a new integration is created
THEN `vault.create_secret()` is called with:
  - value: JSON string `{"access_token": "...", "refresh_token": "..."}` (refresh_token may be null)
  - name: `'integration_<integration_id>'`
  - description: `'OAuth tokens for <provider> integration <integration_id>'`
AND the returned UUID is stored in `user_integrations.vault_secret_id`

#### Scenario: Retrieving tokens for an integration

WHEN a service needs tokens for an integration
THEN it queries `vault.decrypted_secrets` by the `vault_secret_id` from the integration row
AND the result `decrypted_secret` is parsed as JSON to extract `access_token` and `refresh_token`

#### Scenario: Updating tokens after refresh

WHEN a token is refreshed
THEN `vault.update_secret()` is called with the `vault_secret_id` and the new JSON blob
AND `user_integrations.token_expires_at` is updated to the new expiry
AND `user_integrations.updated_at` is set to `now()`

#### Scenario: Revoking an integration

WHEN a user revokes an integration
THEN the Vault secret is deleted (or its value cleared)
AND the `user_integrations` row is deleted
AND any feeds referencing this integration via `integration_id` have their `is_active` set to `false`

### Requirement: IntegrationService in worker-core

The `IntegrationService` class in `packages/worker-core` provides token management used by both the enrichment pipeline and the feed sync worker.

#### Scenario: Getting a token for a user and provider

WHEN `getTokenForUser(userId, provider)` is called
THEN it looks up the integration row for that user and provider
AND if the integration exists and status is `'active'`:
  - If `token_expires_at` is in the past, it calls `refreshToken()` first
  - It retrieves the decrypted token JSON from Vault
  - It returns `{ accessToken, refreshToken }` (or null if integration doesn't exist)
AND if the integration doesn't exist or status is not `'active'`, it returns `null`

#### Scenario: Token refresh with lazy strategy

WHEN `getTokenForUser()` detects an expired token
THEN it calls the provider-specific `refreshToken()` method
AND updates the Vault secret with new tokens
AND updates `token_expires_at` on the integration row
AND if refresh fails (e.g. refresh token revoked), sets integration status to `'expired'`

### Requirement: Integration Provider Registry

Each supported OAuth provider (GitHub, Google) is implemented as an `IntegrationProvider` and registered in a provider map.

#### Scenario: Provider interface

WHEN a new provider is registered
THEN it implements:
  - `id`: string identifier (e.g. `'github'`)
  - `displayName`: human-readable name (e.g. `'GitHub'`)
  - `defaultScopes`: string array of minimum OAuth scopes
  - `buildAuthUrl(state, redirectUri)`: returns the OAuth authorization URL
  - `exchangeCode(code, redirectUri)`: exchanges auth code for tokens, returns `{ accessToken, refreshToken, expiresAt, scopes, userInfo }`
  - `refreshToken(refreshToken)`: refreshes an expired access token, returns `{ accessToken, refreshToken, expiresAt }`
  - `getUserInfo(accessToken)`: fetches provider user profile, returns `{ id, username, avatar }`

#### Scenario: GitHub provider specifics

WHEN the GitHub provider builds an auth URL
THEN it uses `https://github.com/login/oauth/authorize` with scopes `['repo', 'read:user']`
AND when exchanging a code, it calls `https://github.com/login/oauth/access_token`
AND GitHub tokens do not expire by default (no refresh flow unless using GitHub App tokens)
AND `getUserInfo` calls `https://api.github.com/user`

#### Scenario: Google provider specifics

WHEN the Google provider builds an auth URL
THEN it uses `https://accounts.google.com/o/oauth2/v2/auth` with `access_type=offline` and `prompt=consent`
AND scopes include `'https://www.googleapis.com/auth/youtube.readonly'`
AND when exchanging a code, it calls `https://oauth2.googleapis.com/token`
AND Google tokens expire (typically 1 hour); refresh uses the refresh_token grant
AND `getUserInfo` calls `https://www.googleapis.com/oauth2/v2/userinfo`

### Requirement: Backend OAuth routes

The backend exposes routes for initiating and completing OAuth flows, and managing integrations.

#### Scenario: Initiating OAuth connection

WHEN a POST request is made to `/api/v1/integrations/connect/:provider`
THEN the backend validates the provider is supported
AND builds an OAuth URL with state containing the encrypted user ID and provider
AND returns `{ url: "https://provider.com/oauth/authorize?..." }`

#### Scenario: OAuth callback

WHEN a GET request is made to `/api/v1/integrations/callback` with `code` and `state` query params
THEN the backend decrypts the state to extract user ID and provider
AND calls the provider's `exchangeCode()` with the code
AND stores the tokens in Vault via `vault.create_secret()`
AND creates (or updates) the `user_integrations` row with the Vault reference and user info
AND redirects to the frontend settings page with a success indicator

#### Scenario: Listing integrations

WHEN a GET request is made to `/api/v1/integrations`
THEN it returns all integrations for the authenticated user
AND each integration includes: `id`, `provider`, `status`, `scopes`, `provider_username`, `provider_avatar`, `created_at`
AND tokens are NEVER included in the response

#### Scenario: Revoking an integration

WHEN a DELETE request is made to `/api/v1/integrations/:id`
THEN the integration row and its Vault secret are deleted
AND any feeds with `integration_id` matching this integration are deactivated (`is_active = false`)

### Requirement: Frontend integration management

The Settings page displays connected integrations and allows users to connect/disconnect providers.

#### Scenario: Connected accounts display

WHEN a user views the Settings → Connected Accounts tab
THEN each supported provider is displayed with:
  - Provider icon and name
  - Connection status (connected with username/avatar, or not connected)
  - "Connect" button if not connected, "Disconnect" button if connected

#### Scenario: Connecting a provider

WHEN a user clicks "Connect" on a provider
THEN the frontend calls `POST /api/v1/integrations/connect/:provider`
AND redirects the browser to the returned OAuth URL
AND after OAuth completes, the user returns to Settings with the provider now showing as connected

#### Scenario: Disconnecting a provider

WHEN a user clicks "Disconnect" on a connected provider
THEN a confirmation dialog is shown warning that feeds using this integration will be deactivated
AND on confirm, the frontend calls `DELETE /api/v1/integrations/:id`
AND the provider shows as disconnected

### Requirement: App-layer types

Integration types are defined in `packages/types/src/app.types.ts`.

#### Scenario: Integration type

WHEN integration data is used in the frontend or API responses
THEN it conforms to the `Integration` interface:
  - `id`: string
  - `provider`: string
  - `status`: `'active' | 'expired' | 'revoked'`
  - `scopes`: string[]
  - `providerUsername`: string | null
  - `providerAvatar`: string | null
  - `createdAt`: string
  - `updatedAt`: string

## MODIFIED Requirements

### Requirement: Enrichment pipeline token passthrough

#### Scenario: Using user tokens for enrichment

WHEN the enrichment pipeline processes a bookmark
THEN it checks if the bookmark's user has an active integration for the relevant provider (GitHub for GitHub URLs, Google for YouTube URLs)
AND if a token is available, it passes it to the source-specific service (e.g. `GitHubService`, `YouTubeService`)
AND if no user token is available, it falls back to the global API key (`GITHUB_TOKEN`, `GOOGLE_API_KEY`)

### Requirement: Account deletion cleanup

#### Scenario: Deleting integrations on account deletion

WHEN a user deletes their account via `DELETE /api/v1/settings/account`
THEN all `user_integrations` rows for the user are deleted (cascade from profiles)
AND associated Vault secrets are cleaned up
