import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Logo from "../../components/Logo";
import { supabase } from "../../lib/supabase";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate("/confirm-email");
  };

  const handleGoogleSignUp = async () => {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (authError) {
      setError(authError.message);
    }
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
            left: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,132,90,0.07) 0%, transparent 70%)",
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
          maxWidth: 400,
          boxShadow: "0 8px 40px rgba(30,28,26,0.06)",
          animation: "fadeIn 320ms both",
          position: "relative",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Logo variant="full" size="lg" />
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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

          <button
            type="button"
            onClick={handleGoogleSignUp}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              height: 40,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 9,
              fontSize: 13,
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              color: "var(--text-primary)",
              cursor: "pointer",
              marginBottom: 20,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.3a3.67 3.67 0 01-1.59 2.41v2h2.57c1.5-1.38 2.4-3.42 2.4-5.87z" fill="#4285F4" />
              <path d="M8 16c2.16 0 3.97-.71 5.29-1.93l-2.57-2a4.77 4.77 0 01-7.1-2.5H1v2.07A8 8 0 008 16z" fill="#34A853" />
              <path d="M3.62 9.57A4.8 4.8 0 013.38 8c0-.55.1-1.08.24-1.57V4.36H1A8.01 8.01 0 000 8c0 1.3.3 2.52.84 3.6l2.78-2.03z" fill="#FBBC05" />
              <path d="M8 3.18c1.22 0 2.31.42 3.17 1.24l2.37-2.37A7.96 7.96 0 008 0 8 8 0 001 4.36L3.78 6.43A4.77 4.77 0 018 3.18z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>

          {[
            { label: "Name", type: "text", value: name, onChange: setName, placeholder: "Your name" },
            { label: "Email", type: "email", value: email, onChange: setEmail, placeholder: "you@example.com" },
            { label: "Password", type: "password", value: password, onChange: setPassword, placeholder: "Min. 8 characters" },
          ].map((field) => (
            <div key={field.label} style={{ marginBottom: 14 }}>
              <label className="text-label" style={{ display: "block", marginBottom: 5, color: "var(--text-secondary)" }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
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
                  transition: "border-color var(--transition-fast)",
                }}
                onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--accent)")}
                onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border-subtle)")}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
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
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: 8,
              transition: "background var(--transition-fast)",
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "var(--terra-600)"; }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
