import React, { useState } from "react";
import { Link } from "react-router-dom";

import Logo from "../../components/Logo";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

const MailIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 4L12 13L2 4" />
  </svg>
);

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
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Decorative background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,132,90,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "-10%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(74,122,91,0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      <div
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 16,
          padding: "36px 36px 32px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 8px 40px rgba(30,28,26,0.06)",
          animation: "fadeIn 320ms both",
          position: "relative",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <Logo variant="full" size="lg" />
        </div>

        {/* Mail icon */}
        <div style={{ marginBottom: 20 }}>
          <MailIcon />
        </div>

        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily: "var(--font-ui)",
            marginBottom: 10,
          }}
        >
          Check your email
        </h2>

        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-ui)",
            lineHeight: 1.5,
            marginBottom: 8,
          }}
        >
          We sent a confirmation link to
        </p>

        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily: "var(--font-ui)",
            marginBottom: 24,
          }}
        >
          {user?.email ?? "your email address"}
        </p>

        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            fontFamily: "var(--font-ui)",
            lineHeight: 1.5,
            marginBottom: 28,
          }}
        >
          Click the link in the email to verify your account. If you don{"'"}t see it, check your spam folder.
        </p>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
              color: "var(--text-primary)",
              fontFamily: "var(--font-ui)",
            }}
          >
            {error}
          </div>
        )}

        {/* Success message */}
        {resent && (
          <div
            style={{
              background: "rgba(74,122,91,0.08)",
              border: "1px solid rgba(74,122,91,0.2)",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
              color: "var(--text-primary)",
              fontFamily: "var(--font-ui)",
            }}
          >
            Confirmation email resent successfully.
          </div>
        )}

        {/* Resend button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          style={{
            width: "100%",
            height: 40,
            background: "var(--accent)",
            border: "none",
            borderRadius: 9,
            fontSize: 14,
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            color: "#fff",
            cursor: resending ? "default" : "pointer",
            opacity: resending ? 0.7 : 1,
            marginBottom: 12,
            transition: "background var(--transition-fast)",
          }}
          onMouseEnter={(e) => { if (!resending) (e.currentTarget as HTMLElement).style.background = "var(--terra-600)"; }}
          onMouseLeave={(e) => { if (!resending) (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}
        >
          {resending ? "Sending..." : "Resend confirmation email"}
        </button>

        {/* Sign out / back to sign in */}
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            width: "100%",
            height: 40,
            background: "transparent",
            border: "1px solid var(--border-subtle)",
            borderRadius: 9,
            fontSize: 14,
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "border-color var(--transition-fast)",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)")}
        >
          Use a different email
        </button>

        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "var(--font-ui)",
          }}
        >
          Already confirmed?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
