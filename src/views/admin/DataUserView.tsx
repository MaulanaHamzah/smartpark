import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, off, set, update, remove } from "firebase/database";

interface UserData {
  username: string;
  password: string;
  role: "admin" | "user";
  fullName: string;
  phone: string;
  address: string;
  birthDate: string;
}

const emptyForm: UserData = {
  username: "",
  password: "",
  role: "user",
  fullName: "",
  phone: "",
  address: "",
  birthDate: "",
};

const inputStyle = {
  width: "100%",
  padding: "0.7rem 1rem",
  border: "1.5px solid var(--border)",
  borderRadius: "8px",
  fontSize: "0.88rem",
  color: "var(--text-primary)",
  background: "white",
  fontFamily: "var(--font-body)",
  transition: "border-color 0.2s",
};

const labelStyle = {
  fontSize: "0.72rem",
  fontWeight: "600" as const,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: "0.4rem",
  display: "block" as const,
};

export default function DataUserView() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserData>(emptyForm);
  const [originalUsername, setOriginalUsername] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Load users dari Firebase
  useEffect(() => {
    const usersRef = ref(db, "users");
    onValue(usersRef, snapshot => {
      const data = snapshot.val();
      if (!data) { setUsers([]); setLoading(false); return; }
      const list = Object.entries(data).map(([key, val]) => {
        const v = val as Record<string, Record<string, string>>;
        return {
            username: key,
            password: v.account?.password ?? "",
            role: (v.account?.role ?? "user") as "admin" | "user",
            fullName: v.profile?.fullName ?? "",
            phone: v.profile?.phone ?? "",
            address: v.profile?.address ?? "",
            birthDate: v.profile?.birthDate ?? "",
        };
        }) as UserData[];
      setUsers(list);
      setLoading(false);
    });
    return () => off(ref(db, "users"));
  }, []);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  }

  function openAddModal() {
    setFormData(emptyForm);
    setIsEditing(false);
    setShowModal(true);
  }

  function openEditModal(user: UserData) {
    setFormData(user);
    setOriginalUsername(user.username);
    setIsEditing(true);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formData.username || !formData.password) {
      showError("Username and password are required");
      return;
    }

    try {
      const userRef = ref(db, `users/${formData.username}/account`);
        await set(userRef, {
        password: formData.password,
        role: formData.role,
        });
        const profileRef = ref(db, `users/${formData.username}/profile`);
        await set(profileRef, {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        birthDate: formData.birthDate,
        });

      // Kalau edit dan username berubah, hapus yang lama
      if (isEditing && originalUsername !== formData.username) {
        await remove(ref(db, `users/${originalUsername}`));
      }

      setShowModal(false);
      showSuccess(isEditing ? "User updated successfully!" : "User added successfully!");
    } catch {
      showError("Failed to save user. Please try again.");
    }
  }

  async function handleDelete(username: string) {
    try {
      await remove(ref(db, `users/${username}`));
      setDeleteConfirm(null);
      showSuccess("User deleted successfully!");
    } catch {
      showError("Failed to delete user.");
    }
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>

      {/* Page header */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "1.75rem",
      }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
            Data User
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Manage parking staff accounts
          </p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.6rem 1.1rem", background: "#2563eb",
            color: "white", border: "none", borderRadius: "8px",
            fontSize: "0.85rem", fontWeight: "600", cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add User
        </button>
      </div>

      {/* Alert */}
      {success && (
        <div style={{
          padding: "0.75rem 1rem", background: "#f0fdf4",
          border: "1px solid #86efac", borderRadius: "8px",
          color: "#16a34a", fontSize: "0.82rem", fontWeight: "600",
          marginBottom: "1.25rem",
        }}>✓ {success}</div>
      )}
      {error && (
        <div style={{
          padding: "0.75rem 1rem", background: "#fef2f2",
          border: "1px solid #fca5a5", borderRadius: "8px",
          color: "#dc2626", fontSize: "0.82rem", fontWeight: "600",
          marginBottom: "1.25rem",
        }}>⚠ {error}</div>
      )}

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
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ margin: "0 auto 1rem", display: "block" }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>No users found</p>
            <p style={{ fontSize: "0.82rem" }}>Click Add User to create a new account</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                {["No", "Username", "Full Name", "Role", "Phone", "Actions"].map(h => (
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
              {users.map((user, index) => (
                <tr
                  key={user.username}
                  style={{
                    borderBottom: index < users.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "white"}
                >
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", fontSize: "0.85rem" }}>
                      {user.username}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {user.fullName || "—"}
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <span style={{
                      padding: "0.2rem 0.65rem",
                      background: user.role === "admin" ? "#fef3c7" : "#eff6ff",
                      color: user.role === "admin" ? "#d97706" : "#2563eb",
                      border: `1px solid ${user.role === "admin" ? "#fde68a" : "#bfdbfe"}`,
                      borderRadius: "99px", fontSize: "0.72rem",
                      fontWeight: "700", textTransform: "uppercase",
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {user.phone || "—"}
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(user)}
                        style={{
                          padding: "0.4rem 0.75rem",
                          background: "#eff6ff", color: "#2563eb",
                          border: "1px solid #bfdbfe", borderRadius: "6px",
                          fontSize: "0.75rem", fontWeight: "600", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "0.3rem",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirm(user.username)}
                        style={{
                          padding: "0.4rem 0.75rem",
                          background: "#fef2f2", color: "#dc2626",
                          border: "1px solid #fca5a5", borderRadius: "6px",
                          fontSize: "0.75rem", fontWeight: "600", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "0.3rem",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, animation: "fadeIn 0.2s ease",
            top: 0, left: 0, right: 0, bottom: 0,
            width: "100vw", height: "100vh",
        }}>
          <div style={{
            background: "white", borderRadius: "16px",
            padding: "1.75rem", width: "520px", maxHeight: "85vh",
            overflowY: "auto", boxShadow: "var(--shadow-lg)",
            animation: "fadeUp 0.25s ease",
            margin: "auto",
            position: "relative",
          }}>
            <h3 style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "1.5rem" }}>
              {isEditing ? "Edit User" : "Add New User"}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* Username */}
              <div>
                <label style={labelStyle}>Username *</label>
                <input
                  style={inputStyle}
                  value={formData.username}
                  onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  disabled={false}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>Password *</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              {/* Role */}
              <div>
                <label style={labelStyle}>Role *</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={formData.role}
                  onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as "admin" | "user" }))}
                >
                  <option value="user">User (Petugas)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Full Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  style={inputStyle}
                  value={formData.fullName}
                  onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  style={inputStyle}
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              {/* Birth Date */}
              <div>
                <label style={labelStyle}>Birth Date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={formData.birthDate}
                  onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              {/* Address */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Address</label>
                <textarea
                  style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }}
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address"
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: "0.7rem",
                  background: "white", border: "1.5px solid var(--border)",
                  borderRadius: "8px", fontSize: "0.85rem",
                  fontWeight: "600", color: "var(--text-secondary)", cursor: "pointer",
                }}
              >Cancel</button>
              <button
                onClick={handleSave}
                style={{
                  flex: 1, padding: "0.7rem",
                  background: "#2563eb", border: "none",
                  borderRadius: "8px", fontSize: "0.85rem",
                  fontWeight: "600", color: "white", cursor: "pointer",
                }}
              >{isEditing ? "Save Changes" : "Add User"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, animation: "fadeIn 0.2s ease",
            top: 0, left: 0, right: 0, bottom: 0,
            width: "100vw", height: "100vh",
        }}>
          <div style={{
            background: "white", borderRadius: "16px",
            padding: "1.75rem", width: "520px", maxHeight: "85vh",
            overflowY: "auto", boxShadow: "var(--shadow-lg)",
            animation: "fadeUp 0.25s ease",
            margin: "auto",
            position: "relative",
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
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3 style={{ fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem" }}>
              Delete User
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Are you sure you want to delete <strong>{deleteConfirm}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: "0.7rem",
                  background: "white", border: "1.5px solid var(--border)",
                  borderRadius: "8px", fontSize: "0.85rem",
                  fontWeight: "600", color: "var(--text-secondary)", cursor: "pointer",
                }}
              >Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1, padding: "0.7rem",
                  background: "#dc2626", border: "none",
                  borderRadius: "8px", fontSize: "0.85rem",
                  fontWeight: "600", color: "white", cursor: "pointer",
                }}
              >Delete</button>
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