import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

import Logo from "../../components/Logo";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function ConfirmEmail() {
  const { user, signOut } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    setError(null);
    setResent(false);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
    });

    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
    }
    setResending(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(212,132,90,0.07)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(74,122,91,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl px-9 pt-9 pb-8 w-full max-w-[420px] shadow-[0_8px_40px_rgba(30,28,26,0.06)] animate-fade-in relative text-center">
        {/* Logo */}
        <div className="mb-7">
          <Logo variant="full" size="lg" />
        </div>

        {/* Mail icon */}
        <div className="mb-5">
          <Mail size={48} strokeWidth={1.5} className="text-[var(--accent)] mx-auto" />
        </div>

        <h2 className="text-xl font-semibold text-[var(--text-primary)] font-ui mb-2.5">
          Check your email
        </h2>

        <p className="text-sm text-[var(--text-secondary)] font-ui leading-relaxed mb-2">
          We sent a confirmation link to
        </p>

        <p className="text-sm font-semibold text-[var(--text-primary)] font-ui mb-6">
          {user?.email ?? "your email address"}
        </p>

        <p className="text-[13px] text-[var(--text-muted)] font-ui leading-relaxed mb-7">
          Click the link in the email to verify your account. If you don{"'"}t see it, check your spam folder.
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.2)] rounded-lg px-3.5 py-2.5 mb-4 text-[13px] text-[var(--text-primary)] font-ui">
            {error}
          </div>
        )}

        {/* Success message */}
        {resent && (
          <div className="bg-[rgba(74,122,91,0.08)] border border-[rgba(74,122,91,0.2)] rounded-lg px-3.5 py-2.5 mb-4 text-[13px] text-[var(--text-primary)] font-ui">
            Confirmation email resent successfully.
          </div>
        )}

        {/* Resend button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="w-full h-10 bg-[var(--accent)] border-none rounded-[9px] text-sm font-ui font-medium text-white cursor-pointer mb-3 transition-colors hover:bg-[var(--terra-600)] disabled:opacity-70 disabled:cursor-default disabled:hover:bg-[var(--accent)]"
        >
          {resending ? "Sending..." : "Resend confirmation email"}
        </button>

        {/* Sign out / back to sign in */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full h-10 bg-transparent border border-[var(--border-subtle)] rounded-[9px] text-sm font-ui font-medium text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--border-strong)]"
        >
          Use a different email
        </button>

        <p className="mt-5 text-xs text-[var(--text-muted)] font-ui">
          Already confirmed?{" "}
          <Link to="/login" className="text-[var(--accent)] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
