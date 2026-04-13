import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json() as { message: string };

      if (!res.ok) {
        setError(data.message ?? "Login failed");
      } else {
        await router.push("/dashboard");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>SmartPark — Login</title>
      </Head>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "url('/parking-bg.jpeg') center/cover no-repeat",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "400px",
          background: "white",
          borderRadius: "20px",
          padding: "2.5rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          animation: "fadeUp 0.5s ease both",
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{
              width: "56px",
              height: "56px",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="8" width="20" height="12" rx="2" fill="white" opacity="0.9"/>
                <path d="M5 8l2-4h10l2 4" fill="white"/>
                <circle cx="7" cy="17" r="1.5" fill="#2563eb"/>
                <circle cx="17" cy="17" r="1.5" fill="#2563eb"/>
              </svg>
            </div>
            <h1 style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "var(--text-primary)",
            }}>SmartPark</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              IoT Parking Management System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                style={{
                  padding: "0.75rem 1rem",
                  border: "1.5px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                  background: "var(--bg-surface)",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#2563eb"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Enter password"
    required
    style={{
      width: "100%",
      padding: "0.75rem 3.5rem 0.75rem 1rem",
      border: "1.5px solid var(--border)",
      borderRadius: "8px",
      fontSize: "0.9rem",
      color: "var(--text-primary)",
      background: "var(--bg-surface)",
      transition: "border-color 0.2s",
    }}
    onFocus={e => e.target.style.borderColor = "#2563eb"}
    onBlur={e => e.target.style.borderColor = "var(--border)"}
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "0.75rem",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      fontSize: "0.75rem",
      fontWeight: "600",
      color: "#2563eb",
      cursor: "pointer",
      padding: "0.25rem",
    }}
  >
    {showPassword ? "Hide" : "Show"}
  </button>
</div>
            </div>

            {error && (
              <div style={{
                padding: "0.65rem 1rem",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                fontSize: "0.82rem",
                color: "#dc2626",
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "0.5rem",
                padding: "0.85rem",
                background: loading ? "#93c5fd" : "linear-gradient(135deg, #2563eb, #3b82f6)",
                color: "white",
                fontWeight: "600",
                fontSize: "0.9rem",
                borderRadius: "8px",
                transition: "opacity 0.2s, transform 0.15s",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Hint */}
          <div style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1rem",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            lineHeight: "1.8",
          }}>
            <strong style={{ color: "#2563eb" }}>Demo credentials:</strong><br/>
            admin / admin123 &nbsp;·&nbsp; user / user123
          </div>
        </div>
      </div>
    </>
  );
}