import { useEffect, useState } from "react";
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRecord,
} from "@/lib/historyService";
import { db } from "@/lib/firebase";
import { ref, remove } from "firebase/database";

interface Props {
  username: string;
}

function NotifIcon({ type }: { type: NotificationRecord["type"] }) {
  const icons: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    occupied: {
      bg: "#fef2f2", color: "#dc2626",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
          <rect x="2" y="8" width="20" height="12" rx="2"/>
          <path d="M5 8l2-4h10l2 4"/>
          <circle cx="7" cy="17" r="1.5"/>
          <circle cx="17" cy="17" r="1.5"/>
        </svg>
      ),
    },
    available: {
      bg: "#f0fdf4", color: "#16a34a",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 3"/>
          <path d="M9 12h6M12 9v6" strokeLinecap="round"/>
        </svg>
      ),
    },
    full: {
      bg: "#fff7ed", color: "#ea580c",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
    },
    available_again: {
      bg: "#eff6ff", color: "#2563eb",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      ),
    },
  };

  const s = icons[type] ?? icons.available_again;
  return (
    <div style={{
      width: "38px", height: "38px", borderRadius: "50%",
      background: s.bg, display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {s.icon}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function NotificationsView({ username }: Props) {
  const [notifs, setNotifs] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "occupied" | "available" | "full" | "available_again">("all");

  useEffect(() => {
    const unsubscribe = subscribeNotifications(username, data => {
      setNotifs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [username]);

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const filtered = notifs.filter(n =>
    filterType === "all" ? true : n.type === filterType
  );

  async function handleMarkRead(id: string) {
    await markNotificationRead(username, id);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(username);
  }

  async function handleDelete(id: string) {
    await remove(ref(db, `notifications/${username}/${id}`));
  }

  async function handleDeleteAll() {
    const confirmed = window.confirm("Hapus semua notifikasi? Tindakan ini tidak bisa dibatalkan.");
    if (!confirmed) return;
    await remove(ref(db, `notifications/${username}`));
  }

  async function handleDeleteRead() {
    const readNotifs = notifs.filter(n => n.isRead);
    for (const n of readNotifs) {
      await remove(ref(db, `notifications/${username}/${n.id}`));
    }
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", maxWidth: "750px" }}>

      {/* Page header */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "1.75rem",
      }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
            Notifications
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Real-time parking activity updates
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                padding: "0.5rem 0.9rem",
                background: "white", border: "1.5px solid var(--border)",
                borderRadius: "8px", fontSize: "0.78rem",
                fontWeight: "600", color: "var(--text-secondary)",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb";
                (e.currentTarget as HTMLButtonElement).style.color = "#2563eb";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
              }}
            >
              Mark all read
            </button>
          )}

          {notifs.filter(n => n.isRead).length > 0 && (
            <button
              onClick={handleDeleteRead}
              style={{
                padding: "0.5rem 0.9rem",
                background: "white", border: "1.5px solid #fca5a5",
                borderRadius: "8px", fontSize: "0.78rem",
                fontWeight: "600", color: "#dc2626",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "white";
              }}
            >
              Delete read
            </button>
          )}

          {notifs.length > 0 && (
            <button
              onClick={handleDeleteAll}
              style={{
                padding: "0.5rem 0.9rem",
                background: "#fef2f2", border: "1.5px solid #fca5a5",
                borderRadius: "8px", fontSize: "0.78rem",
                fontWeight: "600", color: "#dc2626",
                cursor: "pointer", transition: "all 0.2s",
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
              Delete all
            </button>
          )}
        </div>
      </div>

      {/* Unread count */}
      {unreadCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.65rem 1rem", background: "#eff6ff",
          border: "1px solid #bfdbfe", borderRadius: "8px",
          marginBottom: "1.25rem", fontSize: "0.82rem",
          color: "#2563eb", fontWeight: "600",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {([
          { value: "all",            label: "All" },
          { value: "occupied",       label: "🚗 Vehicle Entered" },
          { value: "available",      label: "✅ Slot Available" },
          { value: "full",           label: "⚠ Parking Full" },
          { value: "available_again",label: "ℹ Available Again" },
        ] as const).map(f => (
          <button
            key={f.value}
            onClick={() => setFilterType(f.value)}
            style={{
              padding: "0.45rem 0.85rem",
              border: `1.5px solid ${filterType === f.value ? "#2563eb" : "var(--border)"}`,
              borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600",
              background: filterType === f.value ? "#eff6ff" : "white",
              color: filterType === f.value ? "#2563eb" : "var(--text-secondary)",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notif list */}
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
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ margin: "0 auto 1rem", display: "block" }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>No notifications</p>
            <p style={{ fontSize: "0.82rem" }}>Notifications will appear when IoT is connected</p>
          </div>
        ) : (
          filtered.map((notif, index) => (
            <div
              key={notif.id}
              style={{
                display: "flex", alignItems: "flex-start", gap: "1rem",
                padding: "1rem 1.25rem",
                borderBottom: index < filtered.length - 1 ? "1px solid var(--border)" : "none",
                background: notif.isRead ? "white" : "#f8faff",
                transition: "background 0.15s",
              }}
            >
              <NotifIcon type={notif.type} />

              {/* Konten */}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: "0.88rem", color: "var(--text-primary)",
                  fontWeight: notif.isRead ? "400" : "600",
                  marginBottom: "0.2rem",
                }}>
                  {notif.message}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  🕐 {formatTime(notif.timestamp)}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                {/* Unread dot */}
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    title="Mark as read"
                    style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: "#2563eb", border: "none",
                      cursor: "pointer", flexShrink: 0,
                      padding: 0,
                    }}
                  />
                )}

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(notif.id)}
                  title="Delete notification"
                  style={{
                    width: "28px", height: "28px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "transparent", border: "1px solid var(--border)",
                    borderRadius: "6px", cursor: "pointer",
                    color: "var(--text-muted)", transition: "all 0.15s",
                    padding: 0,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#fca5a5";
                    (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "right" }}>
          {filtered.length} notifications shown
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}