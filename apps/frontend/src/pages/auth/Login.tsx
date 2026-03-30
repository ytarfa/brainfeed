import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Logo from "../../components/Logo";
import { authGetOAuthUrl } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <path d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.3a3.67 3.67 0 01-1.59 2.41v2h2.57c1.5-1.38 2.4-3.42 2.4-5.87z" fill="#4285F4" />
    <path d="M8 16c2.16 0 3.97-.71 5.29-1.93l-2.57-2a4.77 4.77 0 01-7.1-2.5H1v2.07A8 8 0 008 16z" fill="#34A853" />
    <path d="M3.62 9.57A4.8 4.8 0 013.38 8c0-.55.1-1.08.24-1.57V4.36H1A8.01 8.01 0 000 8c0 1.3.3 2.52.84 3.6l2.78-2.03z" fill="#FBBC05" />
    <path d="M8 3.18c1.22 0 2.31.42 3.17 1.24l2.37-2.37A7.96 7.96 0 008 0 8 8 0 001 4.36L3.78 6.43A4.77 4.77 0 018 3.18z" fill="#EA4335" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      navigate("/library");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const url = await authGetOAuthUrl("google", "/library");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth failed");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(42,138,98,0.07)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(61,214,140,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl px-9 pt-9 pb-8 w-full max-w-[400px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] animate-fade-in relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo variant="full" size="lg" />
          <p className="mt-2 text-[13px] text-[var(--text-muted)] font-ui">
            Save everything. Lose nothing.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error message */}
          {error && (
            <div className="bg-[rgba(208,80,80,0.08)] border border-[rgba(208,80,80,0.2)] rounded-lg px-3.5 py-2.5 mb-4 text-[13px] text-[var(--text-primary)] font-ui">
              {error}
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2 w-full h-10 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[9px] text-[13px] font-ui font-medium text-[var(--text-primary)] cursor-pointer mb-5 transition-colors hover:border-[var(--border-strong)]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[11px] text-[var(--text-muted)] font-ui">or</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Fields */}
          {[
            { label: "Email", type: "email", value: email, onChange: setEmail, placeholder: "you@example.com" },
            { label: "Password", type: "password", value: password, onChange: setPassword, placeholder: "••••••••" },
          ].map((field) => (
            <div key={field.label} className="mb-3.5">
              <label className="text-label block mb-1.5 text-[var(--text-secondary)]">
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                className="w-full h-10 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-ui text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
              />
            </div>
          ))}

          <div className="text-right mb-5 -mt-2">
            <Link
              to="/forgot-password"
              className="text-xs text-[var(--accent)] font-ui"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-[var(--accent)] border-none rounded-[9px] text-sm font-ui font-medium text-white cursor-pointer transition-colors hover:bg-[var(--terra-600)] disabled:opacity-70 disabled:cursor-default disabled:hover:bg-[var(--accent)]"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[var(--text-muted)] font-ui">
          No account?{" "}
          <Link to="/signup" className="text-[var(--accent)] font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
