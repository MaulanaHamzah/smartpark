import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { subscribeGates, subscribeSlots, type SlotData } from "@/lib/historyService";
import type { ParkingData } from "@/types";

function GateIndicator({ name, status }: { name: string; status: string }) {
  const isOpen = status === "open";
  return (
    <div style={{
      background: "white", border: "1px solid var(--border)",
      borderRadius: "12px", padding: "1rem 1.25rem",
      boxShadow: "var(--shadow-sm)",
      display: "flex", flexDirection: "column", gap: "0.75rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: "0.78rem", fontWeight: "700",
          color: "var(--text-primary)", fontFamily: "var(--font-mono)",
        }}>
          {name}
        </span>
        <span style={{
          padding: "0.2rem 0.6rem",
          background: isOpen ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${isOpen ? "#86efac" : "#fca5a5"}`,
          borderRadius: "99px", fontSize: "0.65rem",
          color: isOpen ? "#16a34a" : "#dc2626",
          fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {isOpen ? "Open" : "Closed"}
        </span>
      </div>

      {/* Visual palang */}
      <div style={{
        position: "relative", width: "100%", height: "70px",
        background: "#f8fafc", borderRadius: "8px",
        border: "1px solid var(--border)", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Tiang */}
        <div style={{
          position: "absolute", left: "16px", top: "10px",
          width: "10px", height: "50px",
          background: "#475569", borderRadius: "3px",
        }}/>

        {/* Palang */}
        <div style={{
          position: "absolute", left: "26px",
          top: isOpen ? "10px" : "28px",
          width: isOpen ? "10px" : "65%",
          height: isOpen ? "50px" : "10px",
          background: isOpen ? "#16a34a" : "#dc2626",
          borderRadius: "3px", transformOrigin: "left center",
          transition: "all 0.5s ease",
          boxShadow: isOpen ? "0 0 8px rgba(22,163,74,0.4)" : "0 0 8px rgba(220,38,38,0.4)",
        }}/>

        {/* LED */}
        <div style={{
          position: "absolute", right: "12px", top: "12px",
          width: "10px", height: "10px", borderRadius: "50%",
          background: isOpen ? "#16a34a" : "#dc2626",
          boxShadow: isOpen ? "0 0 8px rgba(22,163,74,0.8)" : "0 0 8px rgba(220,38,38,0.8)",
          animation: "pulseLed 1.5s ease-in-out infinite",
        }}/>

        <span style={{
          position: "absolute", bottom: "6px", right: "10px",
          fontSize: "0.6rem", fontWeight: "600",
          color: isOpen ? "#16a34a" : "#dc2626",
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {isOpen ? "● Active" : "● Locked"}
        </span>
      </div>
    </div>
  );
}

export default function PublicDashboardView() {
  const router = useRouter();
  const [gates, setGates] = useState({ gateA: "open", gateB: "closed" });
  const [parkingData, setParkingData] = useState<ParkingData>({
    systemStatus: "online",
    lastUpdated: "",
    areas: [
      { id: "A", name: "Area A", slots: [{ id: "A1", status: "available" }, { id: "A2", status: "available" }] },
      { id: "B", name: "Area B", slots: [{ id: "B1", status: "available" }, { id: "B2", status: "available" }] },
    ],
  });
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    const unsubGates = subscribeGates(g => setGates(g));
    const unsubSlots = subscribeSlots((slots: Record<string, SlotData>) => {
      setParkingData({
        systemStatus: "online",
        lastUpdated: new Date().toISOString(),
        areas: [
          {
            id: "A", name: "Area A",
            slots: [
              { id: "A1", status: slots["A1"]?.terisi ? "occupied" : "available" },
              { id: "A2", status: slots["A2"]?.terisi ? "occupied" : "available" },
            ],
          },
          {
            id: "B", name: "Area B",
            slots: [
              { id: "B1", status: slots["B1"]?.terisi ? "occupied" : "available" },
              { id: "B2", status: slots["B2"]?.terisi ? "occupied" : "available" },
            ],
          },
        ],
      });
      setLastUpdated(new Date().toLocaleTimeString("id-ID"));
    });
    return () => { unsubGates(); unsubSlots(); };
  }, []);

  const totalSlots = parkingData.areas.reduce((s, a) => s + a.slots.length, 0);
  const occupied   = parkingData.areas.reduce((s, a) => s + a.slots.filter(sl => sl.status === "occupied").length, 0);
  const available  = totalSlots - occupied;
  const isFull     = available === 0;

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
    }}>

      {/* Navbar */}
      <nav style={{
        background: "white", borderBottom: "1px solid var(--border)",
        padding: "0 2rem", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "var(--shadow-sm)", position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* Kiri: tombol kembali */}
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            background: "none", border: "1.5px solid var(--border)",
            borderRadius: "8px", padding: "0.45rem 1rem",
            fontSize: "0.82rem", fontWeight: "600",
            color: "var(--text-secondary)", cursor: "pointer",
            transition: "all 0.2s",
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Beranda
        </button>

        {/* Kanan: system status + admin login */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* System status */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.25rem 0.75rem",
            background: "#f0fdf4", border: "1px solid #86efac",
            borderRadius: "99px",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#16a34a",
              animation: "pulseDot 1.5s ease-in-out infinite",
            }}/>
            <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#16a34a" }}>
              System Online
            </span>
          </div>

          {/* Admin login button */}
          <button
            onClick={() => router.push("/login")}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.45rem 1rem",
              background: "transparent",
              border: "1.5px solid var(--border)",
              borderRadius: "8px", fontSize: "0.78rem",
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Admin Login
          </button>
        </div>
      </nav>

      {/* Main */}
      <main style={{
        flex: 1, padding: "2rem",
        maxWidth: "1000px", width: "100%", margin: "0 auto",
      }}>

        {/* Page header */}
        <div style={{ marginBottom: "1.75rem", animation: "fadeUp 0.4s ease both" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
            Parking Monitor
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Status slot parkir secara real-time
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem", marginBottom: "2rem",
          animation: "fadeUp 0.45s ease 0.05s both",
        }}>
          {[
            { label: "Total Slots", value: totalSlots, color: "#0f172a" },
            { label: "Available",   value: available,  color: "#16a34a" },
            { label: "Occupied",    value: occupied,   color: "#dc2626" },
            { label: "Status",      value: isFull ? "FULL" : "OK", color: isFull ? "#dc2626" : "#16a34a" },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "white", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "1.1rem 1.25rem",
              boxShadow: "var(--shadow-sm)",
            }}>
              <p style={{
                fontSize: "0.7rem", fontWeight: "600", color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>{stat.label}</p>
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: "1.8rem",
                fontWeight: "700", color: stat.color,
                lineHeight: 1.2, marginTop: "0.3rem",
              }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* FULL banner */}
        {isFull && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.85rem 1.25rem", background: "#fef2f2",
            border: "1.5px solid #fca5a5", borderRadius: "12px",
            marginBottom: "1.5rem", color: "#dc2626",
            fontWeight: "600", fontSize: "0.88rem",
            animation: "fadeUp 0.4s ease both",
          }}>
            ⚠ Parking lot is FULL — All slots occupied!
          </div>
        )}

        {/* Gate indicators */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "1rem", marginBottom: "2rem",
          animation: "fadeUp 0.5s ease 0.1s both",
        }}>
          <GateIndicator name="Palang Masuk" status={gates.gateA} />
          <GateIndicator name="Palang Keluar" status={gates.gateB} />
        </div>

        {/* Area parkir */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}>
          {parkingData.areas.map((area, aIdx) => (
            <div key={area.id} style={{
              background: "white", border: "1px solid var(--border)",
              borderRadius: "16px", padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
              animation: `fadeUp 0.5s ease ${0.15 + aIdx * 0.08}s both`,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "1.25rem",
              }}>
                <h2 style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1rem", fontWeight: "700",
                }}>
                  {area.name}
                </h2>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <span style={{ color: "#16a34a", fontWeight: "600" }}>
                    {area.slots.filter(s => s.status === "available").length}
                  </span> / {area.slots.length} available
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {area.slots.map(slot => {
                  const isOccupied = slot.status === "occupied";
                  return (
                    <div
                      key={slot.id}
                      style={{
                        aspectRatio: "1 / 1", borderRadius: "12px",
                        border: `2px solid ${isOccupied ? "#fca5a5" : "#86efac"}`,
                        background: isOccupied ? "#fef2f2" : "#f0fdf4",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: "0.5rem", position: "relative",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {/* LED */}
                      <span style={{
                        position: "absolute", top: "8px", right: "8px",
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: isOccupied ? "#dc2626" : "#16a34a",
                        boxShadow: isOccupied
                          ? "0 0 6px rgba(220,38,38,0.8)"
                          : "0 0 6px rgba(22,163,74,0.8)",
                        animation: isOccupied ? "none" : "pulseLed 2s ease-in-out infinite",
                      }}/>

                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "1rem",
                        fontWeight: "700", color: isOccupied ? "#dc2626" : "#16a34a",
                      }}>
                        {slot.id}
                      </span>

                      {isOccupied ? (
                        <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
                          <rect x="12" y="16" width="40" height="32" rx="6" fill="#dc2626"/>
                          <rect x="16" y="20" width="32" height="18" rx="4" fill="white" opacity="0.2"/>
                          <rect x="14" y="14" width="36" height="8" rx="3" fill="#dc2626"/>
                          <circle cx="18" cy="48" r="5" fill="#1e293b"/>
                          <circle cx="18" cy="48" r="2.5" fill="#475569"/>
                          <circle cx="46" cy="48" r="5" fill="#1e293b"/>
                          <circle cx="46" cy="48" r="2.5" fill="#475569"/>
                          <circle cx="18" cy="16" r="5" fill="#1e293b"/>
                          <circle cx="18" cy="16" r="2.5" fill="#475569"/>
                          <circle cx="46" cy="16" r="5" fill="#1e293b"/>
                          <circle cx="46" cy="16" r="2.5" fill="#475569"/>
                          <rect x="10" y="28" width="6" height="8" rx="2" fill="#fbbf24" opacity="0.9"/>
                          <rect x="48" y="28" width="6" height="8" rx="2" fill="#fbbf24" opacity="0.9"/>
                        </svg>
                      ) : (
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 3"/>
                          <path d="M9 12h6M12 9v6" strokeLinecap="round"/>
                        </svg>
                      )}

                      <span style={{
                        fontSize: "0.65rem", fontWeight: "700",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        color: isOccupied ? "#dc2626" : "#16a34a",
                      }}>
                        {isOccupied ? "Occupied" : "Available"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "1rem 2rem", textAlign: "center",
        fontSize: "0.75rem", color: "var(--text-muted)",
        background: "white",
      }}>
        SmartPark © 2026 · TI3A - Kelompok 5 · Politeknik Negeri Malang
      </footer>

      <style>{`
        @keyframes pulseLed {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}