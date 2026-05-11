import { useEffect, useState } from "react";
import {
  subscribeParkingRecords,
  subscribeGateRecords,
  type ParkingRecord,
  type GateRecord,
} from "@/lib/historyService";
import { db } from "@/lib/firebase";
import { ref, remove } from "firebase/database";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Format waktu WIB ────────────────────────────
function formatWIB(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }) + " WIB";
}

// ─── Status badge ─────────────────────────────────
function StatusBadge({ status }: { status: ParkingRecord["status"] }) {
  const s = status === "parked"
    ? { bg: "#eff6ff", color: "#2563eb", label: "Parked" }
    : { bg: "#f0fdf4", color: "#16a34a", label: "Exited" };
  return (
    <span style={{
      padding: "0.2rem 0.65rem", background: s.bg, color: s.color,
      borderRadius: "99px", fontSize: "0.72rem", fontWeight: "700",
      textTransform: "uppercase", letterSpacing: "0.06em",
      border: `1px solid ${s.color}33`,
    }}>{s.label}</span>
  );
}

// ─── Gate badge ───────────────────────────────────
function GateBadge({ gate }: { gate: string }) {
  const isEntry = gate === "Gate Masuk" || gate === "Gate A";
  return (
    <span style={{
      padding: "0.2rem 0.65rem",
      background: isEntry ? "#fffbeb" : "#f5f3ff",
      color: isEntry ? "#d97706" : "#7c3aed",
      borderRadius: "99px", fontSize: "0.72rem", fontWeight: "700",
      letterSpacing: "0.06em",
      border: `1px solid ${isEntry ? "#fde68a" : "#ddd6fe"}`,
    }}>{gate}</span>
  );
}

// ─── Tab button ───────────────────────────────────
function TabButton({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.6rem 1.25rem",
        border: `1.5px solid ${active ? "#2563eb" : "var(--border)"}`,
        borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600",
        background: active ? "#2563eb" : "white",
        color: active ? "white" : "var(--text-secondary)",
        cursor: "pointer", transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Pagination ───────────────────────────────────
function Pagination({
  current, total, onChange,
}: {
  current: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <button
        onClick={() => onChange(Math.max(current - 1, 1))}
        disabled={current === 1}
        style={{
          padding: "0.5rem 1rem",
          border: "1.5px solid var(--border)", borderRadius: "8px",
          background: current === 1 ? "#f8fafc" : "white",
          color: current === 1 ? "var(--text-muted)" : "var(--text-primary)",
          fontSize: "0.82rem", fontWeight: "600",
          cursor: current === 1 ? "not-allowed" : "pointer",
        }}
      >← Prev</button>

      {Array.from({ length: total }, (_, i) => i + 1)
        .filter(p => p === 1 || p === total || Math.abs(p - current) <= 1)
        .reduce((acc: (number | string)[], p, i, arr) => {
          if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) => p === "..." ? (
          <span key={`d${i}`} style={{ padding: "0 0.25rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>...</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            style={{
              width: "34px", height: "34px",
              border: `1.5px solid ${current === p ? "#2563eb" : "var(--border)"}`,
              borderRadius: "8px",
              background: current === p ? "#2563eb" : "white",
              color: current === p ? "white" : "var(--text-primary)",
              fontSize: "0.82rem", fontWeight: "600", cursor: "pointer",
            }}
          >{p}</button>
        ))
      }

      <button
        onClick={() => onChange(Math.min(current + 1, total))}
        disabled={current === total}
        style={{
          padding: "0.5rem 1rem",
          border: "1.5px solid var(--border)", borderRadius: "8px",
          background: current === total ? "#f8fafc" : "white",
          color: current === total ? "var(--text-muted)" : "var(--text-primary)",
          fontSize: "0.82rem", fontWeight: "600",
          cursor: current === total ? "not-allowed" : "pointer",
        }}
      >Next →</button>
    </div>
  );
}

// ─── Tab 1: Parking Records ───────────────────────
function ParkingRecordsTab() {
  const [records, setRecords] = useState<(ParkingRecord & { firebaseKey: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "parked" | "exited">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCount, setDeleteCount] = useState<number | "all">(5);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsub = subscribeParkingRecords(data => {
      setRecords(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search, filterStatus, rowsPerPage]);

  const filtered = records.filter(r => {
    const matchSearch =
      r.slotId.toLowerCase().includes(search.toLowerCase()) ||
      r.gate.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
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
      const toDelete = deleteCount === "all" ? sortedOldest : sortedOldest.slice(0, deleteCount as number);
      for (const r of toDelete) {
        await remove(ref(db, `parkingRecords/${r.firebaseKey}`));
      }
      setShowDeleteModal(false);
      setCurrentPage(1);
      showSuccessMsg(deleteCount === "all" ? "All records deleted!" : `${toDelete.length} oldest records deleted!`);
    } catch { console.error("Delete failed"); }
    finally { setDeleting(false); }
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Records",    value: records.length, color: "#0f172a" },
          { label: "Currently Parked", value: totalParked,    color: "#2563eb" },
          { label: "Total Exited",     value: totalExited,    color: "#16a34a" },
        ].map(s => (
          <div key={s.label} style={{
            background: "white", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "1rem 1.25rem", boxShadow: "var(--shadow-sm)",
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: "700", color: s.color, lineHeight: 1.2, marginTop: "0.3rem" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {success && (
        <div style={{ padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", color: "#16a34a", fontSize: "0.82rem", fontWeight: "600", marginBottom: "1rem" }}>
          ✓ {success}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text" placeholder="Search by slot or gate..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "0.65rem 1rem 0.65rem 2.4rem",
              border: "1.5px solid var(--border)", borderRadius: "8px",
              fontSize: "0.85rem", background: "white",
            }}
            onFocus={e => e.target.style.borderColor = "#2563eb"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {(["all", "parked", "exited"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "0.65rem 0.85rem", borderRadius: "8px",
            fontSize: "0.78rem", fontWeight: "600", cursor: "pointer",
            border: `1.5px solid ${filterStatus === s ? "#2563eb" : "var(--border)"}`,
            background: filterStatus === s ? "#eff6ff" : "white",
            color: filterStatus === s ? "#2563eb" : "var(--text-secondary)",
          }}>
            {s === "all" ? "All" : s === "parked" ? "Parked" : "Exited"}
          </button>
        ))}

        <select
          value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}
          style={{ padding: "0.65rem 0.85rem", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "0.82rem", background: "white", cursor: "pointer" }}
        >
          {[5, 10, 20, 50].map(n => <option key={n} value={n}>Show {n} rows</option>)}
        </select>

        <button
          onClick={() => setShowDeleteModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.65rem 1rem", background: "#fef2f2", color: "#dc2626",
            border: "1.5px solid #fca5a5", borderRadius: "8px",
            fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#dc2626"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2"; (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
          Delete Old Data
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", color: "var(--text-muted)", gap: "0.75rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading records...
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>No records found</p>
            <p style={{ fontSize: "0.82rem" }}>Records will appear when IoT is connected</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                {["No", "Slot", "Gate", "Entry Time (WIB)", "Exit Time (WIB)", "Status"].map(h => (
                  <th key={h} style={{ padding: "0.85rem 1.25rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, i) => (
                <tr key={r.firebaseKey}
                  style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "white"}
                >
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{(currentPage - 1) * rowsPerPage + i + 1}</td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", fontSize: "0.88rem", color: "#2563eb" }}>{r.slotId}</span>
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}><GateBadge gate={r.gate} /></td>
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatWIB(r.entryTime)}</td>
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatWIB(r.exitTime)}</td>
                  <td style={{ padding: "1rem 1.25rem" }}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} records
          </p>
          <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "1.75rem", width: "400px", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </div>
            <h3 style={{ fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem", textAlign: "center" }}>Delete Old Records</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textAlign: "center", marginBottom: "1.5rem" }}>Select how many oldest records to delete</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
              {([5, 10, 20, 50, 100, "all"] as const).map(n => (
                <button key={n} onClick={() => setDeleteCount(n)} style={{
                  padding: "0.6rem",
                  border: `1.5px solid ${deleteCount === n ? "#dc2626" : "var(--border)"}`,
                  borderRadius: "8px", fontSize: "0.82rem", fontWeight: "600",
                  background: deleteCount === n ? "#fef2f2" : "white",
                  color: deleteCount === n ? "#dc2626" : "var(--text-secondary)",
                  cursor: "pointer",
                }}>
                  {n === "all" ? "All" : `${n} oldest`}
                </button>
              ))}
            </div>
            <div style={{ padding: "0.65rem 1rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "0.78rem", color: "#d97706", marginBottom: "1.5rem" }}>
              ⚠ This will permanently delete {deleteCount === "all" ? "ALL" : `the ${deleteCount} oldest`} records.
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: "0.7rem", background: "white", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "0.7rem", background: deleting ? "#fca5a5" : "#dc2626", border: "none", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", color: "white", cursor: deleting ? "not-allowed" : "pointer" }}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Gate Records ──────────────────────────
function GateRecordsTab() {
  const [records, setRecords] = useState<(GateRecord & { firebaseKey: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGate, setFilterGate] = useState<"all" | "Gate Masuk" | "Gate Keluar">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCount, setDeleteCount] = useState<number | "all">(5);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsub = subscribeGateRecords(data => {
      setRecords(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search, filterGate, rowsPerPage]);

  const filtered = records.filter(r => {
    const matchSearch = r.gate.toLowerCase().includes(search.toLowerCase());
    const matchGate   = filterGate === "all" || r.gate === filterGate;
    return matchSearch && matchGate;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  function showSuccessMsg(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const sortedOldest = [...records].sort((a, b) =>
        new Date(a.gateOpen).getTime() - new Date(b.gateOpen).getTime()
      );
      const toDelete = deleteCount === "all" ? sortedOldest : sortedOldest.slice(0, deleteCount as number);
      for (const r of toDelete) {
        await remove(ref(db, `gateRecords/${r.firebaseKey}`));
      }
      setShowDeleteModal(false);
      setCurrentPage(1);
      showSuccessMsg(deleteCount === "all" ? "All gate records deleted!" : `${toDelete.length} oldest gate records deleted!`);
    } catch { console.error("Delete failed"); }
    finally { setDeleting(false); }
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Records",  value: records.length,                                    color: "#0f172a" },
          { label: "Entry Gate",     value: records.filter(r => r.gate === "Gate Masuk").length, color: "#d97706" },
          { label: "Exit Gate",    value: records.filter(r => r.gate === "Gate Keluar").length, color: "#7c3aed" },
        ].map(s => (
          <div key={s.label} style={{
            background: "white", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "1rem 1.25rem", boxShadow: "var(--shadow-sm)",
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: "700", color: s.color, lineHeight: 1.2, marginTop: "0.3rem" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {success && (
        <div style={{ padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", color: "#16a34a", fontSize: "0.82rem", fontWeight: "600", marginBottom: "1rem" }}>
          ✓ {success}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text" placeholder="Search by gate..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.65rem 1rem 0.65rem 2.4rem", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "0.85rem", background: "white" }}
            onFocus={e => e.target.style.borderColor = "#2563eb"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {(["all", "Gate Masuk", "Gate Keluar"] as const).map(g => (
          <button key={g} onClick={() => setFilterGate(g)} style={{
            padding: "0.65rem 0.85rem", borderRadius: "8px",
            fontSize: "0.78rem", fontWeight: "600", cursor: "pointer",
            border: `1.5px solid ${filterGate === g ? "#d97706" : "var(--border)"}`,
            background: filterGate === g ? "#fffbeb" : "white",
            color: filterGate === g ? "#d97706" : "var(--text-secondary)",
          }}>
            {g === "all" ? "All Gates" : g}
          </button>
        ))}

        <select
          value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}
          style={{ padding: "0.65rem 0.85rem", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "0.82rem", background: "white", cursor: "pointer" }}
        >
          {[5, 10, 20, 50].map(n => <option key={n} value={n}>Show {n} rows</option>)}
        </select>

        <button
          onClick={() => setShowDeleteModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.65rem 1rem", background: "#fef2f2", color: "#dc2626",
            border: "1.5px solid #fca5a5", borderRadius: "8px",
            fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#dc2626"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2"; (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
          Delete Old Data
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", color: "var(--text-muted)", gap: "0.75rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading gate records...
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>No gate records found</p>
            <p style={{ fontSize: "0.82rem" }}>Gate records will appear when IoT is connected</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                {["No", "Gate", "Gate Open (WIB)", "Gate Close (WIB)", "Duration"].map(h => (
                  <th key={h} style={{ padding: "0.85rem 1.25rem", textAlign: "left", fontSize: "0.72rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, i) => {
                const duration = r.gateOpen && r.gateClose
                  ? Math.round((new Date(r.gateClose).getTime() - new Date(r.gateOpen).getTime()) / 1000)
                  : null;
                return (
                  <tr key={r.firebaseKey}
                    style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "white"}
                  >
                    <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{(currentPage - 1) * rowsPerPage + i + 1}</td>
                    <td style={{ padding: "1rem 1.25rem" }}><GateBadge gate={r.gate} /></td>
                    <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatWIB(r.gateOpen)}</td>
                    <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatWIB(r.gateClose)}</td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      {duration !== null ? (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#2563eb", fontWeight: "600" }}>
                          {duration}s
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} records
          </p>
          <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "1.75rem", width: "400px", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </div>
            <h3 style={{ fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem", textAlign: "center" }}>Delete Old Gate Records</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textAlign: "center", marginBottom: "1.5rem" }}>Select how many oldest records to delete</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
              {([5, 10, 20, 50, 100, "all"] as const).map(n => (
                <button key={n} onClick={() => setDeleteCount(n)} style={{
                  padding: "0.6rem",
                  border: `1.5px solid ${deleteCount === n ? "#dc2626" : "var(--border)"}`,
                  borderRadius: "8px", fontSize: "0.82rem", fontWeight: "600",
                  background: deleteCount === n ? "#fef2f2" : "white",
                  color: deleteCount === n ? "#dc2626" : "var(--text-secondary)",
                  cursor: "pointer",
                }}>
                  {n === "all" ? "All" : `${n} oldest`}
                </button>
              ))}
            </div>
            <div style={{ padding: "0.65rem 1rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "0.78rem", color: "#d97706", marginBottom: "1.5rem" }}>
              ⚠ This will permanently delete {deleteCount === "all" ? "ALL" : `the ${deleteCount} oldest`} gate records.
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: "0.7rem", background: "white", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "0.7rem", background: deleting ? "#fca5a5" : "#dc2626", border: "none", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", color: "white", cursor: deleting ? "not-allowed" : "pointer" }}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: Analytics ─────────────────────────────
function AnalyticsTab() {
  const [records, setRecords] = useState<(ParkingRecord & { firebaseKey: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeParkingRecords(data => {
      setRecords(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Hitung jumlah kendaraan per jam (0-23)
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const count = records.filter(r => {
      const entryHour = new Date(r.entryTime).getHours();
      return entryHour === hour;
    }).length;
    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      count,
    };
  });

  const peakHour    = hourlyData.reduce((max, d) => d.count > max.count ? d : max, hourlyData[0]);
  const totalToday = records.filter(r => {
    const todayWIB = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" });
    const entryWIB = new Date(r.entryTime).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" });
    return entryWIB === todayWIB;
  }).length;
  const totalAll    = records.length;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total All Time",  value: totalAll,           color: "#0f172a" },
          { label: "Today",           value: totalToday,         color: "#2563eb" },
          { label: "Peak Hour",       value: peakHour.hour,      color: "#dc2626", sub: `${peakHour.count} vehicles` },
        ].map(s => (
          <div key={s.label} style={{
            background: "white", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "1rem 1.25rem", boxShadow: "var(--shadow-sm)",
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: "700", color: s.color, lineHeight: 1.2, marginTop: "0.3rem" }}>{s.value}</p>
            {s.sub && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div style={{
        background: "white", border: "1px solid var(--border)",
        borderRadius: "16px", padding: "1.5rem", boxShadow: "var(--shadow-sm)",
      }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "0.3rem", color: "var(--text-primary)" }}>
          Vehicle Entry by Hour
        </h3>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Number of vehicles that entered per hour (all time data)
        </p>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", color: "var(--text-muted)", gap: "0.75rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading analytics...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={hourlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                interval={1}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "white", border: "1px solid #e2e8f0",
                  borderRadius: "8px", fontSize: "0.82rem",
                }}
                formatter={(value) => [`${value ?? 0} vehicles`, "Entries"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="Vehicles Entered"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ fill: "#2563eb", r: 4 }}
                activeDot={{ r: 6, fill: "#2563eb" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─── Main HistoryView ─────────────────────────────
export default function HistoryView() {
  const [activeTab, setActiveTab] = useState<"parking" | "gate" | "analytics">("parking");

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>

      {/* Page header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
          Data History
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
          Parking records, gate activity, and analytics
        </p>
      </div>

      {/* Tab buttons */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem" }}>
        <TabButton active={activeTab === "parking"} onClick={() => setActiveTab("parking")}>
          🅿 Parking Records
        </TabButton>
        <TabButton active={activeTab === "gate"} onClick={() => setActiveTab("gate")}>
          🚧 Gate Records
        </TabButton>
        <TabButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}>
          📊 Analytics
        </TabButton>
      </div>

      {/* Tab content */}
      {activeTab === "parking"   && <ParkingRecordsTab />}
      {activeTab === "gate"      && <GateRecordsTab />}
      {activeTab === "analytics" && <AnalyticsTab />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}