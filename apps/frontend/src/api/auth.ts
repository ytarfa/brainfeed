const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// ---------------------------------------------------------------------------
// Types — replace Supabase Session/User in the frontend
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email_confirmed_at: string | null;
  created_at: string | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number | null;
}

interface AuthResponse {
  user: AuthUser | null;
  session: AuthSession | null;
}

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

const TOKEN_KEY = "bf-auth-tokens";

export function getStoredTokens(): AuthSession | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function storeTokens(session: AuthSession): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function post<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const tokens = getStoredTokens();
  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }

  return data as T;
}

async function get<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {};

  const tokens = getStoredTokens();
  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Auth API functions
// ---------------------------------------------------------------------------

/** Sign up with email and password. */
export async function authSignUp(
  email: string,
  password: string,
  display_name?: string,
): Promise<AuthResponse> {
  const result = await post<AuthResponse>("/api/v1/auth/sign-up", {
    email,
    password,
    display_name,
  });

  if (result.session) {
    storeTokens(result.session);
  }

  return result;
}

/** Sign in with email and password. */
export async function authSignIn(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const result = await post<AuthResponse>("/api/v1/auth/sign-in", {
    email,
    password,
  });

  if (result.session) {
    storeTokens(result.session);
  }

  return result;
}

/** Get the OAuth redirect URL. The caller should do `window.location.href = url`. */
export async function authGetOAuthUrl(
  provider: string,
  redirect_path?: string,
): Promise<string> {
  const data = await post<{ url: string }>("/api/v1/auth/oauth/url", {
    provider,
    redirect_path,
  });
  return data.url;
}

/** Sign out. Invalidates the session server-side and clears local tokens. */
export async function authSignOut(): Promise<void> {
  try {
    await post<{ success: boolean }>("/api/v1/auth/sign-out");
  } catch {
    // If the server call fails (e.g. token already expired), still clear locally
  }
  clearTokens();
}

/** Get the current user from the stored access token. */
export async function authGetMe(): Promise<AuthUser | null> {
  const tokens = getStoredTokens();
  if (!tokens?.access_token) return null;

  try {
    const data = await get<{ user: AuthUser }>("/api/v1/auth/me");
    return data.user;
  } catch {
    return null;
  }
}

/** Refresh the access token using the stored refresh token. */
export async function authRefresh(): Promise<AuthResponse | null> {
  const tokens = getStoredTokens();
  if (!tokens?.refresh_token) return null;

  try {
    const result = await post<AuthResponse>("/api/v1/auth/refresh", {
      refresh_token: tokens.refresh_token,
    });

    if (result.session) {
      storeTokens(result.session);
    }

    return result;
  } catch {
    clearTokens();
    return null;
  }
}

/** Send a password reset email. */
export async function authForgotPassword(email: string): Promise<void> {
  await post<{ success: boolean }>("/api/v1/auth/forgot-password", { email });
}

/** Resend the signup confirmation email. */
export async function authResendConfirmation(email: string): Promise<void> {
  await post<{ success: boolean }>("/api/v1/auth/resend-confirmation", {
    email,
  });
}

// ---------------------------------------------------------------------------
// OAuth callback token parsing
// ---------------------------------------------------------------------------

/** Parse auth tokens from the URL fragment hash (used after OAuth callback). */
export function parseHashTokens(): AuthSession | null {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;

  const params = new URLSearchParams(hash.substring(1));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const expires_at_str = params.get("expires_at");

  if (!access_token || !refresh_token) return null;

  const session: AuthSession = {
    access_token,
    refresh_token,
    expires_at: expires_at_str ? Number(expires_at_str) : null,
  };

  // Store tokens and clean up the URL
  storeTokens(session);
  window.history.replaceState(null, "", window.location.pathname + window.location.search);

  return session;
}
