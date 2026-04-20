import type { ParkingData } from "@/types";

interface Props {
  data: ParkingData;
}

export default function DashboardView({ data }: Props) {
  const totalSlots = data.areas.reduce((s, a) => s + a.slots.length, 0);
  const occupied   = data.areas.reduce((s, a) => s + a.slots.filter(sl => sl.status === "occupied").length, 0);
  const available  = totalSlots - occupied;
  const isFull     = available === 0;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>

      {/* Page header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Parking Monitor
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
          Real-time parking slot status
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem", marginBottom: "2rem",
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
              fontSize: "0.7rem", fontWeight: "600",
              color: "var(--text-muted)", textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}>
              {stat.label}
            </p>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: "1.8rem",
              fontWeight: "700", color: stat.color,
              lineHeight: 1.2, marginTop: "0.3rem",
            }}>
              {stat.value}
            </p>
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
        }}>
          ⚠ Parking lot is FULL — All slots occupied!
        </div>
      )}

      {/* Area parkir */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {data.areas.map((area, aIdx) => (
          <div key={area.id} style={{
            background: "white", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "1.5rem",
            boxShadow: "var(--shadow-sm)",
            animation: `fadeUp 0.5s ease ${0.1 + aIdx * 0.08}s both`,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "1.25rem",
            }}>
              <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: "700" }}>
                {area.name}
              </h2>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <span style={{ color: "#16a34a", fontWeight: "600" }}>
                  {area.slots.filter(s => s.status === "available").length}
                </span> / {area.slots.length} available
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.85rem" }}>
              {area.slots.map(slot => {
                const isOccupied = slot.status === "occupied";
                return (
                  <div
                    key={slot.id}
                    style={{
                      aspectRatio: "1 / 1.15", borderRadius: "12px",
                      border: `2px solid ${isOccupied ? "#fca5a5" : "#86efac"}`,
                      background: isOccupied ? "#fef2f2" : "#f0fdf4",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      gap: "0.4rem", cursor: "default",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* LED indicator */}
                    <span style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: isOccupied ? "#dc2626" : "#16a34a",
                      boxShadow: isOccupied ? "0 0 6px #dc2626" : "0 0 6px #16a34a",
                      animation: isOccupied ? "none" : "pulseLed 2s ease-in-out infinite",
                    }}/>

                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.78rem",
                      fontWeight: "700", color: isOccupied ? "#dc2626" : "#16a34a",
                    }}>
                      {slot.id}
                    </span>

                    {isOccupied ? (
                      <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
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
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 3"/>
                        <path d="M9 12h6M12 9v6" strokeLinecap="round"/>
                      </svg>
                    )}

                    <span style={{
                      fontSize: "0.6rem", fontWeight: "700",
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

      <style>{`
        @keyframes pulseLed {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}