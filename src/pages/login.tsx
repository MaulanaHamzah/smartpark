import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  const MAX_ATTEMPTS  = 5;
  const BLOCK_MINUTES = 15;

  function getRemainingTime() {
    if (!blockedUntil) return 0;
    return Math.ceil((blockedUntil - Date.now()) / 1000 / 60);
  }

  const isBlocked = blockedUntil !== null && Date.now() < blockedUntil;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (isBlocked) {
      setError(`Too many failed attempts. Please wait ${getRemainingTime()} minute(s).`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json() as { message: string; role?: string };

      if (!res.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          const blockTime = Date.now() + BLOCK_MINUTES * 60 * 1000;
          setBlockedUntil(blockTime);
          setAttempts(0);
          setError(`Too many failed attempts. Login blocked for ${BLOCK_MINUTES} minutes.`);
        } else {
          setError(`${data.message ?? "Login failed"} (${newAttempts}/${MAX_ATTEMPTS} attempts)`);
        }
      } else {
        setAttempts(0);
        setBlockedUntil(null);
        await router.push("/admin/history");
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
        <title>SmartPark — Admin Login</title>
      </Head>

      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "url('/parking-bg.jpeg') center/cover no-repeat",
        position: "relative",
      }}>
        {/* Overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)",
        }}/>

        <div style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: "400px",
          background: "white", borderRadius: "20px",
          padding: "2.5rem", margin: "1rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          animation: "fadeUp 0.5s ease both",
        }}>

          {/* Back button */}
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              background: "none", border: "none",
              fontSize: "0.78rem", color: "var(--text-muted)",
              cursor: "pointer", marginBottom: "1.5rem",
              padding: 0, transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#2563eb"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Kembali ke Dashboard
          </button>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{
              width: "52px", height: "52px",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1rem",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h1 style={{
              fontFamily: "var(--font-mono)", fontSize: "1.4rem",
              fontWeight: "700", color: "var(--text-primary)",
            }}>Admin Login</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              SmartPark Management System
            </p>
          </div>

          {/* Blocked warning */}
          {isBlocked && (
            <div style={{
              padding: "0.85rem 1rem",
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: "8px", marginBottom: "1rem",
              fontSize: "0.82rem", color: "#dc2626", fontWeight: "600",
              textAlign: "center",
            }}>
              🔒 Login diblokir selama {getRemainingTime()} menit lagi
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{
                fontSize: "0.75rem", fontWeight: "600",
                color: "var(--text-secondary)", textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                disabled={isBlocked}
                style={{
                  padding: "0.75rem 1rem",
                  border: "1.5px solid var(--border)",
                  borderRadius: "8px", fontSize: "0.9rem",
                  color: "var(--text-primary)", background: isBlocked ? "#f8fafc" : "white",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#2563eb"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{
                fontSize: "0.75rem", fontWeight: "600",
                color: "var(--text-secondary)", textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={isBlocked}
                  style={{
                    width: "100%", padding: "0.75rem 3.5rem 0.75rem 1rem",
                    border: "1.5px solid var(--border)",
                    borderRadius: "8px", fontSize: "0.9rem",
                    color: "var(--text-primary)", background: isBlocked ? "#f8fafc" : "white",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "0.75rem", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    fontSize: "0.75rem", fontWeight: "600",
                    color: "#2563eb", cursor: "pointer", padding: "0.25rem",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: "0.65rem 1rem",
                background: "#fef2f2", border: "1px solid #fca5a5",
                borderRadius: "8px", fontSize: "0.82rem", color: "#dc2626",
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Attempt warning */}
            {attempts > 0 && attempts < MAX_ATTEMPTS && !isBlocked && (
              <div style={{
                padding: "0.55rem 1rem",
                background: "#fffbeb", border: "1px solid #fde68a",
                borderRadius: "8px", fontSize: "0.78rem", color: "#d97706",
              }}>
                ⚠ {MAX_ATTEMPTS - attempts} attempt(s) remaining before login is blocked
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isBlocked}
              style={{
                marginTop: "0.5rem", padding: "0.85rem",
                background: isBlocked
                  ? "#e2e8f0"
                  : loading
                    ? "#93c5fd"
                    : "linear-gradient(135deg, #2563eb, #3b82f6)",
                color: isBlocked ? "var(--text-muted)" : "white",
                fontWeight: "600", fontSize: "0.9rem",
                borderRadius: "8px", border: "none",
                cursor: isBlocked || loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Signing in..." : isBlocked ? "Login Blocked" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}