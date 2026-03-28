import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
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
      <div
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 16,
          padding: "36px 36px 32px",
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 8px 40px rgba(30,28,26,0.06)",
          animation: "fadeIn 320ms both",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Logo variant="full" size="lg" />
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "var(--accent-subtle)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 22,
                color: "var(--accent)",
              }}
            >
              ✉
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 18, marginBottom: 8 }}>
              Check your email
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
              We've sent a reset link to <strong style={{ color: "var(--text-secondary)" }}>{email}</strong>
            </p>
            <Link to="/login" style={{ color: "var(--accent)", fontSize: 13, fontWeight: 500 }}>
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 20, marginBottom: 8, textAlign: "center" }}>
              Reset password
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", marginBottom: 24 }}>
              Enter your email and we'll send you a reset link.
            </p>

            <label className="text-label" style={{ display: "block", marginBottom: 5, color: "var(--text-secondary)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: "100%",
                height: 40,
                padding: "0 12px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "var(--font-ui)",
                color: "var(--text-primary)",
                outline: "none",
                marginBottom: 20,
                transition: "border-color var(--transition-fast)",
              }}
              onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--accent)")}
              onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border-subtle)")}
            />

            <button
              type="submit"
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
                cursor: "pointer",
                marginBottom: 16,
              }}
            >
              Send reset link
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              <Link to="/login" style={{ color: "var(--accent)" }}>← Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
