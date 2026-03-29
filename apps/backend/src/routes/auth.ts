import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { serviceClient } from "../config/supabase";
import { env } from "../config/env";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a one-off anon client (no session persistence) for flows that need
 *  to call SDK auth methods that interact with sessions. */
function anonClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

/** Standardised user payload sent to the frontend. */
function serializeUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  email_confirmed_at?: string | null;
  created_at?: string;
}) {
  return {
    id: user.id,
    email: user.email ?? null,
    display_name:
      (user.user_metadata?.display_name as string) ??
      (user.user_metadata?.full_name as string) ??
      null,
    avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,
    created_at: user.created_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// POST /auth/sign-up — email + password
// ---------------------------------------------------------------------------
router.post("/sign-up", async (req: Request, res: Response) => {
  try {
    const { email, password, display_name } = req.body as {
      email?: string;
      password?: string;
      display_name?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const client = anonClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: display_name ? { display_name } : undefined,
      },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({
      user: data.user ? serializeUser(data.user) : null,
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
          }
        : null,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/sign-in — email + password
// ---------------------------------------------------------------------------
router.post("/sign-in", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const client = anonClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    res.json({
      user: data.user ? serializeUser(data.user) : null,
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
          }
        : null,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/oauth/url — generate OAuth redirect URL
// Body: { provider: string, redirect_path?: string }
// ---------------------------------------------------------------------------
router.post("/oauth/url", async (req: Request, res: Response) => {
  try {
    const { provider, redirect_path } = req.body as {
      provider?: string;
      redirect_path?: string;
    };

    if (!provider) {
      res.status(400).json({ error: "Provider is required" });
      return;
    }

    const client = anonClient();

    // The redirectTo should point to our backend callback which will then
    // forward tokens to the frontend.
    const callbackUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/callback`;

    const { data, error } = await client.auth.signInWithOAuth({
      provider: provider as "google",
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
        queryParams: {
          // Encode the desired frontend path so the callback can redirect there
          redirect_path: redirect_path ?? "/library",
        },
      },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ url: data.url });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /auth/callback — OAuth callback from Supabase
// Supabase sends the code/tokens back here, we exchange them and redirect
// to the frontend with tokens in the URL fragment.
// ---------------------------------------------------------------------------
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;

    if (!code) {
      res.redirect(`${env.FRONTEND_URL}/login?error=missing_code`);
      return;
    }

    // Exchange the code for a session using the anon client
    const client = anonClient();
    const { data, error } = await client.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
      return;
    }

    // Encode tokens into the URL fragment so they aren't sent to the server
    // on subsequent requests. The frontend will parse them.
    const params = new URLSearchParams({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: String(data.session.expires_at ?? ""),
    });

    // Check the redirect_path from the original OAuth params if available
    // Default to /library
    const redirectPath = "/library";

    res.redirect(`${env.FRONTEND_URL}${redirectPath}#${params.toString()}`);
  } catch {
    res.redirect(`${env.FRONTEND_URL}/login?error=internal`);
  }
});

// ---------------------------------------------------------------------------
// POST /auth/sign-out — invalidate the current session
// Requires Authorization: Bearer <access_token>
// ---------------------------------------------------------------------------
router.post("/sign-out", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" });
      return;
    }

    const token = authHeader.slice(7);

    // Use admin API to invalidate the user's session
    const { data: userData, error: userError } =
      await serviceClient.auth.getUser(token);

    if (userError || !userData.user) {
      // Token already invalid — treat as successful sign-out
      res.json({ success: true });
      return;
    }

    // Sign out using a client initialised with the user's token
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    await client.auth.signOut();

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// GET /auth/me — get the current user from access token
// Requires Authorization: Bearer <access_token>
// ---------------------------------------------------------------------------
router.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" });
      return;
    }

    const token = authHeader.slice(7);
    const { data, error } = await serviceClient.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    res.json({ user: serializeUser(data.user) });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/refresh — exchange a refresh token for new tokens
// Body: { refresh_token: string }
// ---------------------------------------------------------------------------
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body as { refresh_token?: string };

    if (!refresh_token) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    // Create a temporary client, set the session, then refresh
    const client = anonClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session) {
      res.status(401).json({ error: error?.message ?? "Failed to refresh session" });
      return;
    }

    res.json({
      user: data.user ? serializeUser(data.user) : null,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/forgot-password — send password reset email
// Body: { email: string }
// ---------------------------------------------------------------------------
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const client = anonClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.FRONTEND_URL}/login`,
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/resend-confirmation — resend signup confirmation email
// Body: { email: string }
// ---------------------------------------------------------------------------
router.post("/resend-confirmation", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const client = anonClient();
    const { error } = await client.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
