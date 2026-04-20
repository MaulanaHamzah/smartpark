import { useEffect, useState } from "react";
import { subscribeHistory, type NotificationRecord } from "@/lib/historyService";
import type { CarRecord } from "@/pages/dashboard";

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function StatusBadge({ status }: { status: CarRecord["status"] }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    entering: { bg: "#fffbeb", color: "#d97706", label: "Waiting" },
    parked:   { bg: "#eff6ff", color: "#2563eb", label: "Parked"  },
    exited:   { bg: "#f0fdf4", color: "#16a34a", label: "Exited"  },
  };
  const s = styles[status];
  return (
    <span style={{
      padding: "0.2rem 0.65rem",
      background: s.bg, color: s.color,
      borderRadius: "99px", fontSize: "0.72rem",
      fontWeight: "700", textTransform: "uppercase",
      letterSpacing: "0.06em",
      border: `1px solid ${s.color}33`,
    }}>
      {s.label}
    </span>
  );
}

export default function HistoryView() {
  const [records, setRecords] = useState<(CarRecord & { firebaseKey: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "entering" | "parked" | "exited">("all");

  useEffect(() => {
    const unsubscribe = subscribeHistory(data => {
      const sorted = [...data].sort((a, b) =>
        new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
      );
      setRecords(sorted);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = records.filter(r => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.colorName.toLowerCase().includes(search.toLowerCase()) ||
      (r.slotId ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalEntered = records.length;
  const totalParked  = records.filter(r => r.status === "parked").length;
  const totalExited  = records.filter(r => r.status === "exited").length;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>

      {/* Page header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Data History
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
          All vehicle entry and exit records
        </p>
      </div>

      {/* Summary stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem", marginBottom: "1.75rem",
      }}>
        {[
          { label: "Total Entered",     value: totalEntered, color: "#0f172a" },
          { label: "Currently Parked",  value: totalParked,  color: "#2563eb" },
          { label: "Total Exited",      value: totalExited,  color: "#16a34a" },
        ].map(stat => (
          <div key={stat.label} style={{
            background: "white", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "1.1rem 1.25rem",
            boxShadow: "var(--shadow-sm)",
          }}>
            <p style={{
              fontSize: "0.7rem", fontWeight: "600", color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.08em",
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

      {/* Filter & Search */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1 }}>
          <svg style={{
            position: "absolute", left: "0.85rem", top: "50%",
            transform: "translateY(-50%)", color: "var(--text-muted)",
          }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by car ID, color, or slot..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "0.65rem 1rem 0.65rem 2.4rem",
              border: "1.5px solid var(--border)", borderRadius: "8px",
              fontSize: "0.85rem", color: "var(--text-primary)",
              background: "white", transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "#2563eb"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {/* Filter status */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["all", "entering", "parked", "exited"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "0.65rem 1rem", borderRadius: "8px",
                fontSize: "0.78rem", fontWeight: "600",
                textTransform: "capitalize", cursor: "pointer",
                border: `1.5px solid ${filterStatus === s ? "#2563eb" : "var(--border)"}`,
                background: filterStatus === s ? "#eff6ff" : "white",
                color: filterStatus === s ? "#2563eb" : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              {s === "all" ? "All" : s === "entering" ? "Waiting" : s === "parked" ? "Parked" : "Exited"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: "white", border: "1px solid var(--border)",
        borderRadius: "16px", boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}>
        {loading ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "4rem", color: "var(--text-muted)", gap: "0.75rem",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading records...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ margin: "0 auto 1rem", display: "block" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>No records found</p>
            <p style={{ fontSize: "0.82rem" }}>Try adjusting your search or filter</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                {["No", "Car ID", "Color", "Slot", "Entry Time", "Exit Time", "Status"].map(h => (
                  <th key={h} style={{
                    padding: "0.85rem 1.25rem", textAlign: "left",
                    fontSize: "0.72rem", fontWeight: "700",
                    color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.08em", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, index) => (
                <tr
                  key={record.firebaseKey}
                  style={{
                    borderBottom: index < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "white"}
                >
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                      {record.id}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        width: "14px", height: "14px", borderRadius: "50%",
                        background: record.color, flexShrink: 0,
                        boxShadow: `0 0 0 2px white, 0 0 0 3px ${record.color}55`,
                      }}/>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-primary)", textTransform: "capitalize" }}>
                        {record.colorName}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.82rem",
                      fontWeight: "700", color: record.slotId ? "#2563eb" : "var(--text-muted)",
                    }}>
                      {record.slotId ?? "—"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {formatTime(record.entryTime)}
                  </td>
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {formatTime(record.exitTime)}
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <StatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "right" }}>
          Showing {filtered.length} of {records.length} records
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}