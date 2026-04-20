import { useState } from "react";
import Navbar from "./Navbar";
import SidebarAdmin from "./SidebarAdmin";

interface Props {
  children: React.ReactNode;
  username: string;
  role: string;
}

export default function AdminLayout({ children, username, role }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Navbar */}
      <Navbar
        username={username}
        role={role}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />

      {/* Sidebar */}
      <SidebarAdmin isOpen={isSidebarOpen} username={username} />

      {/* Main content */}
      <main style={{
        marginLeft: isSidebarOpen ? "230px" : "0px",
        marginTop: "60px",
        padding: "2rem",
        transition: "margin-left 0.25s ease",
        minHeight: "calc(100vh - 60px)",
      }}>
        {children}
      </main>
    </div>
  );
}