import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { subscribeNotifications } from "@/lib/historyService";

interface Props {
  isOpen: boolean;
  username: string;
}

const menuItems = [
  {
    label: "Data User",
    href: "/admin/data-user",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: "Data History",
    href: "/admin/history",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    label: "Heatmap",
    href: "/admin/heatmap",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
      </svg>
    ),
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    hasBadge: true,
  },
];

export default function SidebarAdmin({ isOpen, username }: Props) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeNotifications(username, notifs => {
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    });
    return () => unsubscribe();
  }, [username]);

  async function handleLogout() {
    setShowLogoutModal(true);
  }

  async function confirmLogout() {
    await fetch("/api/logout", { method: "POST" });
    await router.push("/login");
  }

  return (
    <>
      {isOpen && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.2)", zIndex: 89,
        }}/>
      )}

      <aside style={{
        position: "fixed", top: "60px", left: 0, bottom: 0,
        width: isOpen ? "230px" : "0px",
        background: "white", borderRight: "1px solid var(--border)",
        boxShadow: isOpen ? "var(--shadow-md)" : "none",
        overflow: "hidden", transition: "width 0.25s ease",
        zIndex: 90, display: "flex", flexDirection: "column",
        justifyContent: "space-between",
      }}>

        {/* Menu items */}
        <div style={{ padding: isOpen ? "1.25rem 0.75rem" : "0", whiteSpace: "nowrap" }}>
          <p style={{
            fontSize: "0.65rem", fontWeight: "700", color: "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: "0.1em",
            padding: "0 0.75rem", marginBottom: "0.5rem",
          }}>
            Admin Menu
          </p>

          {menuItems.map(item => {
            const isActive = router.pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  gap: "0.75rem", padding: "0.7rem 0.75rem",
                  borderRadius: "10px", border: "none",
                  background: isActive ? "#fef3c7" : "transparent",
                  color: isActive ? "#d97706" : "var(--text-secondary)",
                  fontWeight: isActive ? "600" : "500",
                  fontSize: "0.88rem", cursor: "pointer",
                  transition: "all 0.15s", textAlign: "left",
                  marginBottom: "0.25rem", position: "relative",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                  }
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <span style={{
                    position: "absolute", left: 0,
                    width: "3px", height: "20px",
                    background: "#d97706", borderRadius: "0 2px 2px 0",
                  }}/>
                )}

                {/* Icon + badge */}
                <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  {item.icon}
                  {item.hasBadge && unreadCount > 0 && (
                    <span style={{
                      position: "absolute", top: "-6px", right: "-8px",
                      minWidth: "16px", height: "16px",
                      background: "#dc2626", borderRadius: "99px",
                      border: "1.5px solid white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 3px",
                      fontSize: "0.6rem", fontWeight: "700",
                      color: "white", lineHeight: 1,
                    }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>

                {item.label}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div style={{
          padding: isOpen ? "0.75rem" : "0",
          borderTop: "1px solid var(--border)", whiteSpace: "nowrap",
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              gap: "0.75rem", padding: "0.7rem 0.75rem",
              borderRadius: "10px", border: "none",
              background: "transparent", color: "var(--text-secondary)",
              fontWeight: "500", fontSize: "0.88rem",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
              (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>
      {/* Logout Modal */}
      {showLogoutModal && (
        <div style={{
          position: "fixed", inset: 0,
          width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, animation: "fadeIn 0.2s ease",
        }}>
          <div style={{
            background: "white", borderRadius: "20px",
            padding: "2rem", width: "360px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            animation: "fadeUp 0.25s ease",
            textAlign: "center",
          }}>
            {/* Icon */}
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: "#fef2f2", border: "2px solid #fca5a5",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: "1.1rem", fontWeight: "700",
              color: "var(--text-primary)", marginBottom: "0.5rem",
            }}>
              Logout
            </h3>

            <p style={{
              fontSize: "0.85rem", color: "var(--text-secondary)",
              lineHeight: 1.6, marginBottom: "1.75rem",
            }}>
              Are you sure you want to logout from SmartPark admin panel?
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: "0.75rem",
                  background: "white",
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px", fontSize: "0.88rem",
                  fontWeight: "600", color: "var(--text-secondary)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#94a3b8";
                  (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.background = "white";
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1, padding: "0.75rem",
                  background: "#dc2626", border: "none",
                  borderRadius: "10px", fontSize: "0.88rem",
                  fontWeight: "600", color: "white",
                  cursor: "pointer", transition: "opacity 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}