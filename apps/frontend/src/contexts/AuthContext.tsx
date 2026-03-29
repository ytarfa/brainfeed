import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

import type { AuthUser, AuthSession } from "../api/auth";
import {
  getStoredTokens,
  storeTokens,
  clearTokens,
  authGetMe,
  authRefresh,
  authSignOut,
  authSignIn as apiSignIn,
  parseHashTokens,
} from "../api/auth";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule a token refresh ~60 seconds before expiry
  const scheduleRefresh = useCallback((sess: AuthSession) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    if (!sess.expires_at) return;

    const expiresMs = sess.expires_at * 1000;
    const nowMs = Date.now();
    // Refresh 60 seconds before expiry, or immediately if already close
    const delayMs = Math.max(expiresMs - nowMs - 60_000, 0);

    refreshTimerRef.current = setTimeout(async () => {
      const result = await authRefresh();
      if (result?.session && result.user) {
        setSession(result.session);
        setUser(result.user);
        scheduleRefresh(result.session);
      } else {
        // Refresh failed — clear everything
        setSession(null);
        setUser(null);
        clearTokens();
      }
    }, delayMs);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Check for OAuth callback tokens in the URL hash
      const hashSession = parseHashTokens();

      // 2. Determine which tokens to use
      const tokens = hashSession ?? getStoredTokens();

      if (!tokens) {
        if (!cancelled) setLoading(false);
        return;
      }

      // 3. Validate token with the backend
      // If the tokens are fresh from hash, store them first
      if (hashSession) {
        storeTokens(hashSession);
      }

      const me = await authGetMe();
      if (cancelled) return;

      if (me) {
        setUser(me);
        setSession(tokens);
        scheduleRefresh(tokens);
      } else {
        // Token invalid — try refresh
        const refreshed = await authRefresh();
        if (cancelled) return;

        if (refreshed?.session && refreshed.user) {
          setUser(refreshed.user);
          setSession(refreshed.session);
          scheduleRefresh(refreshed.session);
        } else {
          clearTokens();
        }
      }

      if (!cancelled) setLoading(false);
    }

    init();

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [scheduleRefresh]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const result = await apiSignIn(email, password);
    if (result.user && result.session) {
      setUser(result.user);
      setSession(result.session);
      scheduleRefresh(result.session);
    }
  }, [scheduleRefresh]);

  const handleSignOut = useCallback(async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    await authSignOut();
    setUser(null);
    setSession(null);
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
