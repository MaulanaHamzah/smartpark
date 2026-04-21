import { useEffect, useState } from "react";
import { subscribeHistory } from "@/lib/historyService";
import type { CarRecord } from "@/pages/dashboard";
import { getDummyParkingData } from "@/lib/data";

function getHeatColor(count: number, max: number): { bg: string; border: string; label: string } {
  if (max === 0 || count === 0) return { bg: "#f0fdf4", border: "#86efac", label: "Never" };
  const ratio = count / max;
  if (ratio <= 0.25) return { bg: "#f0fdf4", border: "#86efac", label: "Low" };
  if (ratio <= 0.5)  return { bg: "#fffbeb", border: "#fde68a", label: "Medium" };
  if (ratio <= 0.75) return { bg: "#fff7ed", border: "#fed7aa", label: "High" };
  return { bg: "#fef2f2", border: "#fca5a5", label: "Very High" };
}

function getHeatTextColor(count: number, max: number): string {
  if (max === 0 || count === 0) return "#16a34a";
  const ratio = count / max;
  if (ratio <= 0.25) return "#16a34a";
  if (ratio <= 0.5)  return "#d97706";
  if (ratio <= 0.75) return "#ea580c";
  return "#dc2626";
}

export default function HeatmapView() {
  const [records, setRecords] = useState<(CarRecord & { firebaseKey: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const areas = getDummyParkingData().areas;

  useEffect(() => {
    const unsubscribe = subscribeHistory(data => {
      setRecords(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Hitung frekuensi per slot
  const slotCount: Record<string, number> = {};
  areas.forEach(area => {
    area.slots.forEach(slot => {
      slotCount[slot.id] = 0;
    });
  });
  records.forEach(r => {
    if (r.slotId && slotCount[r.slotId] !== undefined) {
      slotCount[r.slotId]++;
    }
  });

  const maxCount = Math.max(...Object.values(slotCount), 1);
  const totalUsage = Object.values(slotCount).reduce((a, b) => a + b, 0);

  // Slot paling sering & paling jarang
  const sortedSlots = Object.entries(slotCount).sort((a, b) => b[1] - a[1]);
  const mostUsed   = sortedSlots[0];
  const leastUsed  = sortedSlots[sortedSlots.length - 1];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>

      {/* Page header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Parking Heatmap
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
          Slot usage frequency based on parking history
        </p>
      </div>

      {loading ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "4rem", color: "var(--text-muted)", gap: "0.75rem",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ animation: "spin 0.8s linear infinite" }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Loading heatmap data...
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem", marginBottom: "2rem",
          }}>
            {[
              { label: "Total Usage",     value: totalUsage,             color: "#0f172a", unit: "times" },
              { label: "Most Used Slot",  value: mostUsed?.[0] ?? "—",   color: "#dc2626", unit: `${mostUsed?.[1] ?? 0}x` },
              { label: "Least Used Slot", value: leastUsed?.[0] ?? "—",  color: "#16a34a", unit: `${leastUsed?.[1] ?? 0}x` },
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
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.3rem" }}>
                  <p style={{
                    fontFamily: "var(--font-mono)", fontSize: "1.8rem",
                    fontWeight: "700", color: stat.color, lineHeight: 1.2,
                  }}>{stat.value}</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{stat.unit}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem",
            marginBottom: "1.5rem", flexWrap: "wrap",
          }}>
            <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)" }}>
              FREQUENCY:
            </p>
            {[
              { bg: "#f0fdf4", border: "#86efac", color: "#16a34a", label: "Never / Low (0–25%)" },
              { bg: "#fffbeb", border: "#fde68a", color: "#d97706", label: "Medium (26–50%)" },
              { bg: "#fff7ed", border: "#fed7aa", color: "#ea580c", label: "High (51–75%)" },
              { bg: "#fef2f2", border: "#fca5a5", color: "#dc2626", label: "Very High (76–100%)" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{
                  width: "16px", height: "16px", borderRadius: "4px",
                  background: item.bg, border: `2px solid ${item.border}`,
                  flexShrink: 0,
                }}/>
                <span style={{ fontSize: "0.75rem", color: item.color, fontWeight: "500" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {areas.map((area, aIdx) => (
              <div key={area.id} style={{
                background: "white", border: "1px solid var(--border)",
                borderRadius: "16px", padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
                animation: `fadeUp 0.5s ease ${0.1 + aIdx * 0.08}s both`,
              }}>
                {/* Area header */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: "1.25rem",
                }}>
                  <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: "700" }}>
                    {area.name}
                  </h2>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Total usage:{" "}
                    <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                      {area.slots.reduce((s, slot) => s + (slotCount[slot.id] ?? 0), 0)}x
                    </span>
                  </span>
                </div>

                {/* Slots */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                  {area.slots.map(slot => {
                    const count = slotCount[slot.id] ?? 0;
                    const heat  = getHeatColor(count, maxCount);
                    const textColor = getHeatTextColor(count, maxCount);
                    const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

                    return (
                      <div
                        key={slot.id}
                        style={{
                          borderRadius: "12px",
                          border: `2px solid ${heat.border}`,
                          background: heat.bg,
                          padding: "1rem 0.75rem",
                          display: "flex", flexDirection: "column",
                          alignItems: "center", gap: "0.5rem",
                          transition: "all 0.2s",
                        }}
                      >
                        {/* Slot ID */}
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "0.85rem",
                          fontWeight: "700", color: textColor,
                        }}>
                          {slot.id}
                        </span>

                        {/* Flame icon - makin merah makin besar */}
                        <svg
                          width={24 + Math.round(pct / 10)}
                          height={24 + Math.round(pct / 10)}
                          viewBox="0 0 24 24" fill={textColor} opacity="0.8"
                        >
                          <path d="M12 2C9 7 6 8 6 13a6 6 0 0 0 12 0c0-5-3-6-6-11zm0 16a3 3 0 0 1-3-3c0-2 1.5-3 3-5 1.5 2 3 3 3 5a3 3 0 0 1-3 3z"/>
                        </svg>

                        {/* Count */}
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "1.4rem",
                          fontWeight: "700", color: textColor, lineHeight: 1,
                        }}>
                          {count}x
                        </span>

                        {/* Label */}
                        <span style={{
                          fontSize: "0.62rem", fontWeight: "600",
                          textTransform: "uppercase", letterSpacing: "0.08em",
                          color: textColor, opacity: 0.8,
                        }}>
                          {heat.label}
                        </span>

                        {/* Progress bar */}
                        <div style={{
                          width: "100%", height: "4px",
                          background: "rgba(0,0,0,0.08)", borderRadius: "2px",
                          overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%", borderRadius: "2px",
                            background: textColor,
                            width: `${pct}%`,
                            transition: "width 0.5s ease",
                          }}/>
                        </div>

                        {/* Percentage */}
                        <span style={{
                          fontSize: "0.65rem", color: textColor,
                          fontWeight: "500", opacity: 0.7,
                        }}>
                          {pct}% of max
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* No data info */}
          {totalUsage === 0 && (
            <div style={{
              marginTop: "1.5rem", padding: "1rem 1.25rem",
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: "12px", fontSize: "0.82rem", color: "#d97706",
            }}>
              ⚠ No parking history yet — heatmap will update automatically when vehicles are parked.
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}