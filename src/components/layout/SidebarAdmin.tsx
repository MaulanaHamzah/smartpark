import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { subscribeNotifications } from "@/lib/historyService";

interface Props {
  isOpen: boolean;
  username: string;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
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

  useEffect(() => {
    const unsubscribe = subscribeNotifications(username, notifs => {
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    });
    return () => unsubscribe();
  }, [username]);

  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;
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
                      position: "absolute", top: "-5px", right: "-6px",
                      width: "8px", height: "8px",
                      background: "#dc2626", borderRadius: "50%",
                      border: "1.5px solid white",
                    }}/>
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
    </>
  );
}