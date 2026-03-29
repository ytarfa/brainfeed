import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

import Logo from "../../components/Logo";
import { authForgotPassword } from "../../api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authForgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset link");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
      <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl px-9 pt-9 pb-8 w-full max-w-[400px] shadow-[0_8px_40px_rgba(30,28,26,0.06)] animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo variant="full" size="lg" />
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-[var(--accent-subtle)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={22} className="text-[var(--accent)]" />
            </div>
            <h2 className="font-display font-medium text-lg mb-2">
              Check your email
            </h2>
            <p className="text-[13px] text-[var(--text-muted)] mb-6">
              We've sent a reset link to <strong className="text-[var(--text-secondary)]">{email}</strong>
            </p>
            <Link to="/login" className="text-[var(--accent)] text-[13px] font-medium">
              &larr; Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="font-display font-medium text-xl mb-2 text-center">
              Reset password
            </h2>
            <p className="text-[13px] text-[var(--text-muted)] text-center mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            {/* Error message */}
            {error && (
              <div className="bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.2)] rounded-lg px-3.5 py-2.5 mb-4 text-[13px] text-[var(--text-primary)] font-ui">
                {error}
              </div>
            )}

            <label className="text-label block mb-1.5 text-[var(--text-secondary)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full h-10 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-ui text-[var(--text-primary)] outline-none mb-5 transition-colors focus:border-[var(--accent)]"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[var(--accent)] border-none rounded-[9px] text-sm font-ui font-medium text-white cursor-pointer mb-4 transition-colors hover:bg-[var(--terra-600)] disabled:opacity-70 disabled:cursor-default disabled:hover:bg-[var(--accent)]"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <p className="text-center text-[13px] text-[var(--text-muted)]">
              <Link to="/login" className="text-[var(--accent)]">&larr; Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
