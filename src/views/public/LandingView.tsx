import { useRouter } from "next/router";

export default function LandingView() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f4f8 0%, #e8f0fe 50%, #f0f9ff 100%)",
      display: "flex", flexDirection: "column",
    }}>

      {/* Navbar */}
      <nav style={{
        padding: "0 2rem", height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "white", borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: "36px", height: "36px",
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="8" width="20" height="12" rx="2" fill="white" opacity="0.9"/>
              <path d="M5 8l2-4h10l2 4" fill="white"/>
              <circle cx="7" cy="17" r="1.5" fill="#2563eb"/>
              <circle cx="17" cy="17" r="1.5" fill="#2563eb"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "var(--font-mono)", fontWeight: "700",
            fontSize: "1.1rem", color: "var(--text-primary)",
          }}>SmartPark</span>
        </div>

        <button
          onClick={() => router.push("/login")}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.5rem 1.1rem",
            background: "transparent",
            border: "1.5px solid var(--border)",
            borderRadius: "8px", fontSize: "0.85rem",
            fontWeight: "600", color: "var(--text-secondary)",
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb";
            (e.currentTarget as HTMLButtonElement).style.color = "#2563eb";
            (e.currentTarget as HTMLButtonElement).style.background = "#eff6ff";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Admin Login
        </button>
      </nav>

      {/* Hero section */}
      <section style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "4rem 2rem", textAlign: "center",
        animation: "fadeUp 0.6s ease both",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.35rem 1rem",
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: "99px", fontSize: "0.75rem",
          color: "#2563eb", fontWeight: "600",
          marginBottom: "1.5rem",
          letterSpacing: "0.04em",
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#2563eb",
            animation: "pulseDot 1.5s ease-in-out infinite",
          }}/>
          IoT Smart Parking System
        </div>

        {/* Judul */}
        <h1 style={{
          fontSize: "3rem", fontWeight: "800",
          color: "var(--text-primary)", lineHeight: 1.2,
          marginBottom: "1rem", maxWidth: "600px",
        }}>
          Selamat Datang di{" "}
          <span style={{
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            SmartPark
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: "1.05rem", color: "var(--text-secondary)",
          maxWidth: "500px", lineHeight: 1.7, marginBottom: "2.5rem",
        }}>
          Sistem parkir cerdas berbasis IoT dengan monitoring slot parkir
          secara real-time. Temukan slot kosong dengan mudah dan cepat.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.85rem 2rem",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              color: "white", border: "none", borderRadius: "10px",
              fontSize: "0.95rem", fontWeight: "700",
              cursor: "pointer", transition: "opacity 0.2s, transform 0.15s",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="2" y="8" width="20" height="12" rx="2"/>
              <path d="M5 8l2-4h10l2 4"/>
              <circle cx="7" cy="17" r="1.5"/>
              <circle cx="17" cy="17" r="1.5"/>
            </svg>
            Cek Slot Parkir
          </button>
        </div>
      </section>

      {/* Feature cards */}
      <section style={{
        padding: "3rem 2rem 4rem",
        maxWidth: "900px", width: "100%", margin: "0 auto",
      }}>
        <p style={{
          textAlign: "center", fontSize: "0.8rem", fontWeight: "700",
          color: "var(--text-muted)", textTransform: "uppercase",
          letterSpacing: "0.1em", marginBottom: "2rem",
        }}>
          Fitur Unggulan
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              ),
              title: "Real-Time Monitoring",
              desc: "Status slot parkir diperbarui secara otomatis setiap saat melalui sensor IoT.",
              bg: "#eff6ff", border: "#bfdbfe",
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              ),
              title: "Notifikasi Otomatis",
              desc: "Dapatkan notifikasi saat slot parkir penuh atau tersedia kembali.",
              bg: "#f0fdf4", border: "#86efac",
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
                </svg>
              ),
              title: "Heatmap Analitik",
              desc: "Visualisasi slot mana yang paling sering digunakan berdasarkan data historis.",
              bg: "#fffbeb", border: "#fde68a",
            },
          ].map(item => (
            <div key={item.title} style={{
              background: "white", border: "1px solid var(--border)",
              borderRadius: "14px", padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: item.bg, border: `1px solid ${item.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1rem",
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: "0.92rem", fontWeight: "700", marginBottom: "0.4rem", color: "var(--text-primary)" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "1.25rem 2rem",
        textAlign: "center",
        fontSize: "0.75rem", color: "var(--text-muted)",
        background: "white",
      }}>
        SmartPark © 2026 · TI3A - Kelompok 5 · Politeknik Negeri Malang
      </footer>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}