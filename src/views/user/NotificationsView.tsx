import { useEffect, useState } from "react";
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRecord,
} from "@/lib/historyService";

interface Props {
  username: string;
}

function NotifIcon({ type }: { type: NotificationRecord["type"] }) {
  if (type === "occupied") return (
    <div style={{
      width: "38px", height: "38px", borderRadius: "50%",
      background: "#fef2f2", display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
        <rect x="2" y="8" width="20" height="12" rx="2"/>
        <path d="M5 8l2-4h10l2 4"/>
        <circle cx="7" cy="17" r="1.5"/>
        <circle cx="17" cy="17" r="1.5"/>
      </svg>
    </div>
  );

  if (type === "available") return (
    <div style={{
      width: "38px", height: "38px", borderRadius: "50%",
      background: "#f0fdf4", display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 3"/>
        <path d="M9 12h6M12 9v6" strokeLinecap="round"/>
      </svg>
    </div>
  );

  if (type === "full") return (
    <div style={{
      width: "38px", height: "38px", borderRadius: "50%",
      background: "#fff7ed", display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
  );

  return (
    <div style={{
      width: "38px", height: "38px", borderRadius: "50%",
      background: "#eff6ff", display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
      </svg>
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function NotificationsView({ username }: Props) {
  const [notifs, setNotifs] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeNotifications(username, data => {
      setNotifs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [username]);

  const unreadCount = notifs.filter(n => !n.isRead).length;

  async function handleMarkRead(id: string) {
    await markNotificationRead(username, id);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(username);
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", maxWidth: "700px" }}>

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
            Real-time parking slot updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              padding: "0.55rem 1rem",
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
            Mark all as read
          </button>
        )}
      </div>

      {/* Unread count badge */}
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
          You have {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
        </div>
      )}

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
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ margin: "0 auto 1rem", display: "block" }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>No notifications yet</p>
            <p style={{ fontSize: "0.82rem" }}>Notifications will appear when IoT is connected</p>
          </div>
        ) : (
          notifs.map((notif, index) => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
              style={{
                display: "flex", alignItems: "flex-start", gap: "1rem",
                padding: "1.1rem 1.25rem",
                borderBottom: index < notifs.length - 1 ? "1px solid var(--border)" : "none",
                background: notif.isRead ? "white" : "#f8faff",
                cursor: notif.isRead ? "default" : "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => {
                if (!notif.isRead)
                  (e.currentTarget as HTMLDivElement).style.background = "#eff6ff";
              }}
              onMouseLeave={e => {
                if (!notif.isRead)
                  (e.currentTarget as HTMLDivElement).style.background = "#f8faff";
              }}
            >
              <NotifIcon type={notif.type} />

              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: "0.88rem", color: "var(--text-primary)",
                  fontWeight: notif.isRead ? "400" : "600",
                  marginBottom: "0.2rem",
                }}>
                  {notif.message}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {formatTime(notif.timestamp)}
                </p>
              </div>

              {/* Unread dot */}
              {!notif.isRead && (
                <span style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: "#2563eb", flexShrink: 0, marginTop: "4px",
                }}/>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}