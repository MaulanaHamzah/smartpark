import { useEffect, useState } from "react";
import { subscribeParkingRecords, type ParkingRecord } from "@/lib/historyService";
import { db } from "@/lib/firebase";
import { ref, remove } from "firebase/database";

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function StatusBadge({ status }: { status: ParkingRecord["status"] }) {
  const styles = {
    parked: { bg: "#eff6ff", color: "#2563eb", label: "Parked" },
    exited: { bg: "#f0fdf4", color: "#16a34a", label: "Exited" },
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

function GateBadge({ gate }: { gate: string }) {
  const isA = gate === "Gate A";
  return (
    <span style={{
      padding: "0.2rem 0.65rem",
      background: isA ? "#fffbeb" : "#f5f3ff",
      color: isA ? "#d97706" : "#7c3aed",
      borderRadius: "99px", fontSize: "0.72rem",
      fontWeight: "700", letterSpacing: "0.06em",
      border: `1px solid ${isA ? "#fde68a" : "#ddd6fe"}`,
    }}>
      {gate}
    </span>
  );
}

export default function HistoryView() {
  const [records, setRecords] = useState<(ParkingRecord & { firebaseKey: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "parked" | "exited">("all");
  const [filterGate, setFilterGate] = useState<"all" | "Gate A" | "Gate B">("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCount, setDeleteCount] = useState<number | "all">(5);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeParkingRecords(data => {
      setRecords(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterGate, rowsPerPage]);

  const filtered = records.filter(r => {
    const matchSearch = r.slotId.toLowerCase().includes(search.toLowerCase()) ||
      r.gate.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchGate   = filterGate === "all" || r.gate === filterGate;
    return matchSearch && matchStatus && matchGate;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const totalParked = records.filter(r => r.status === "parked").length;
  const totalExited = records.filter(r => r.status === "exited").length;

  function showSuccessMsg(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const sortedOldest = [...records].sort((a, b) =>
        new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
      );
      const toDelete = deleteCount === "all"
        ? sortedOldest
        : sortedOldest.slice(0, deleteCount as number);

      for (const record of toDelete) {
        await remove(ref(db, `parkingRecords/${record.firebaseKey}`));
      }

      setShowDeleteModal(false);
      setCurrentPage(1);
      showSuccessMsg(
        deleteCount === "all"
          ? "All records deleted successfully!"
          : `${toDelete.length} oldest records deleted successfully!`
      );
    } catch {
      console.error("Failed to delete records");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>

      {/* Page header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Data History
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
          All vehicle parking records
        </p>
      </div>

      {/* Success alert */}
      {success && (
        <div style={{
          padding: "0.75rem 1rem", background: "#f0fdf4",
          border: "1px solid #86efac", borderRadius: "8px",
          color: "#16a34a", fontSize: "0.82rem", fontWeight: "600",
          marginBottom: "1.25rem",
        }}>✓ {success}</div>
      )}

      {/* Summary stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem", marginBottom: "1.75rem",
      }}>
        {[
          { label: "Total Records",    value: records.length, color: "#0f172a" },
          { label: "Currently Parked", value: totalParked,    color: "#2563eb" },
          { label: "Total Exited",     value: totalExited,    color: "#16a34a" },
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

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg style={{
            position: "absolute", left: "0.85rem", top: "50%",
            transform: "translateY(-50%)", color: "var(--text-muted)",
          }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by slot or gate..."
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
          {(["all", "parked", "exited"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "0.65rem 0.85rem", borderRadius: "8px",
                fontSize: "0.78rem", fontWeight: "600",
                textTransform: "capitalize", cursor: "pointer",
                border: `1.5px solid ${filterStatus === s ? "#2563eb" : "var(--border)"}`,
                background: filterStatus === s ? "#eff6ff" : "white",
                color: filterStatus === s ? "#2563eb" : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              {s === "all" ? "All" : s === "parked" ? "Parked" : "Exited"}
            </button>
          ))}
        </div>

        {/* Filter gate */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["all", "Gate A", "Gate B"] as const).map(g => (
            <button
              key={g}
              onClick={() => setFilterGate(g)}
              style={{
                padding: "0.65rem 0.85rem", borderRadius: "8px",
                fontSize: "0.78rem", fontWeight: "600",
                cursor: "pointer",
                border: `1.5px solid ${filterGate === g ? "#d97706" : "var(--border)"}`,
                background: filterGate === g ? "#fffbeb" : "white",
                color: filterGate === g ? "#d97706" : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              {g === "all" ? "All Gates" : g}
            </button>
          ))}
        </div>

        {/* Rows per page */}
        <select
          value={rowsPerPage}
          onChange={e => setRowsPerPage(Number(e.target.value))}
          style={{
            padding: "0.65rem 0.85rem",
            border: "1.5px solid var(--border)", borderRadius: "8px",
            fontSize: "0.82rem", color: "var(--text-primary)",
            background: "white", cursor: "pointer",
          }}
        >
          {[5, 10, 20, 50].map(n => (
            <option key={n} value={n}>Show {n} rows</option>
          ))}
        </select>

        {/* Delete button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.65rem 1rem",
            background: "#fef2f2", color: "#dc2626",
            border: "1.5px solid #fca5a5", borderRadius: "8px",
            fontSize: "0.82rem", fontWeight: "600", cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#dc2626";
            (e.currentTarget as HTMLButtonElement).style.color = "white";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
            (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
          Delete Old Data
        </button>
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
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ margin: "0 auto 1rem", display: "block" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>No records found</p>
            <p style={{ fontSize: "0.82rem" }}>Records will appear when IoT is connected</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                {["No", "Slot", "Gate", "Entry Time", "Exit Time", "Status"].map(h => (
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
              {paginated.map((record, index) => (
                <tr
                  key={record.firebaseKey}
                  style={{
                    borderBottom: index < paginated.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "white"}
                >
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontWeight: "700",
                      fontSize: "0.88rem", color: "#2563eb",
                    }}>
                      {record.slotId}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <GateBadge gate={record.gate} />
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

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "1rem",
        }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} records
          </p>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: "0.5rem 1rem",
                border: "1.5px solid var(--border)", borderRadius: "8px",
                background: currentPage === 1 ? "#f8fafc" : "white",
                color: currentPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
                fontSize: "0.82rem", fontWeight: "600",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >← Prev</button>

            <div style={{ display: "flex", gap: "0.25rem" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc: (number | string)[], p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => (
                  p === "..." ? (
                    <span key={`dots-${i}`} style={{ padding: "0.5rem 0.25rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      style={{
                        width: "34px", height: "34px",
                        border: `1.5px solid ${currentPage === p ? "#2563eb" : "var(--border)"}`,
                        borderRadius: "8px",
                        background: currentPage === p ? "#2563eb" : "white",
                        color: currentPage === p ? "white" : "var(--text-primary)",
                        fontSize: "0.82rem", fontWeight: "600",
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >{p}</button>
                  )
                ))
              }
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{
                padding: "0.5rem 1rem",
                border: "1.5px solid var(--border)", borderRadius: "8px",
                background: currentPage === totalPages ? "#f8fafc" : "white",
                color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
                fontSize: "0.82rem", fontWeight: "600",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >Next →</button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{
          position: "fixed", inset: 0, top: 0, left: 0,
          width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, animation: "fadeIn 0.2s ease",
        }}>
          <div style={{
            background: "white", borderRadius: "16px",
            padding: "1.75rem", width: "400px",
            boxShadow: "var(--shadow-lg)", animation: "fadeUp 0.25s ease",
          }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "#fef2f2", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 1rem",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </div>

            <h3 style={{ fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem", textAlign: "center" }}>
              Delete Old Records
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textAlign: "center", marginBottom: "1.5rem" }}>
              Select how many oldest records to delete
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
              {([5, 10, 20, 50, 100, "all"] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setDeleteCount(n)}
                  style={{
                    padding: "0.6rem",
                    border: `1.5px solid ${deleteCount === n ? "#dc2626" : "var(--border)"}`,
                    borderRadius: "8px", fontSize: "0.82rem", fontWeight: "600",
                    background: deleteCount === n ? "#fef2f2" : "white",
                    color: deleteCount === n ? "#dc2626" : "var(--text-secondary)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {n === "all" ? "All" : `${n} oldest`}
                </button>
              ))}
            </div>

            <div style={{
              padding: "0.65rem 1rem", background: "#fffbeb",
              border: "1px solid #fde68a", borderRadius: "8px",
              fontSize: "0.78rem", color: "#d97706", marginBottom: "1.5rem",
            }}>
              ⚠ This will permanently delete {deleteCount === "all" ? "ALL" : `the ${deleteCount} oldest`} records. This cannot be undone.
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1, padding: "0.7rem",
                  background: "white", border: "1.5px solid var(--border)",
                  borderRadius: "8px", fontSize: "0.85rem",
                  fontWeight: "600", color: "var(--text-secondary)", cursor: "pointer",
                }}
              >Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: "0.7rem",
                  background: deleting ? "#fca5a5" : "#dc2626",
                  border: "none", borderRadius: "8px",
                  fontSize: "0.85rem", fontWeight: "600",
                  color: "white", cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}