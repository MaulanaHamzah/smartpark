import { useRouter } from "next/router";

interface Props {
  username: string;
  role: string;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function Navbar({ username, role, onToggleSidebar, isSidebarOpen }: Props) {
  return (
    <nav style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "60px",
      background: "white",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      boxShadow: "var(--shadow-sm)",
      zIndex: 100,
    }}>
      {/* Kiri: toggle + brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Toggle button */}
        <button
          onClick={onToggleSidebar}
          style={{
            width: "36px", height: "36px",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "5px", background: "transparent",
            border: "1.5px solid var(--border)",
            borderRadius: "8px", cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb";
            (e.currentTarget as HTMLButtonElement).style.background = "#eff6ff";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <span style={{ width: "16px", height: "2px", background: isSidebarOpen ? "#2563eb" : "var(--text-secondary)", borderRadius: "2px", transition: "all 0.2s" }}/>
          <span style={{ width: "16px", height: "2px", background: isSidebarOpen ? "#2563eb" : "var(--text-secondary)", borderRadius: "2px", transition: "all 0.2s" }}/>
          <span style={{ width: "16px", height: "2px", background: isSidebarOpen ? "#2563eb" : "var(--text-secondary)", borderRadius: "2px", transition: "all 0.2s" }}/>
        </button>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: "34px", height: "34px",
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="8" width="20" height="12" rx="2" fill="white" opacity="0.9"/>
              <path d="M5 8l2-4h10l2 4" fill="white"/>
              <circle cx="7" cy="17" r="1.5" fill="#2563eb"/>
              <circle cx="17" cy="17" r="1.5" fill="#2563eb"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", fontSize: "1rem", color: "var(--text-primary)" }}>
            SmartPark
          </span>
        </div>
      </div>

      {/* Kanan: user info */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "500" }}>
          {username}
        </span>
        <span style={{
          padding: "0.15rem 0.55rem",
          background: role === "admin" ? "#fef3c7" : "#eff6ff",
          border: `1px solid ${role === "admin" ? "#fde68a" : "#bfdbfe"}`,
          borderRadius: "99px", fontSize: "0.65rem",
          color: role === "admin" ? "#d97706" : "#2563eb",
          fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {role}
        </span>
      </div>
    </nav>
  );
}