import { useState, useRef, useEffect } from "react";
import { saveUserProfile, subscribeUserProfile } from "@/lib/historyService";

interface UserProfile {
  username: string;
  fullName: string;
  birthDate: string;
  phone: string;
  address: string;
  role: string;
  photo: string | null;
}

interface Props {
  username: string;
  role: string;
}

export default function ProfileView({ username, role }: Props) {
  const [profile, setProfile] = useState<UserProfile>({
    username,
    fullName: "",
    birthDate: "",
    phone: "",
    address: "",
    role,
    photo: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile>(profile);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
  const unsubscribe = subscribeUserProfile(username, (data) => {
    if (data) {
      setProfile(prev => ({ ...prev, ...data }));
      setEditData(prev => ({ ...prev, ...data }));
    }
  });
  return () => unsubscribe();
}, [username]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditData(prev => ({ ...prev, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    await saveUserProfile(username, {
        fullName: editData.fullName,
        birthDate: editData.birthDate,
        phone: editData.phone,
        address: editData.address,
        photo: editData.photo ?? "",
    });
    setProfile(editData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    }

  function handleCancel() {
    setEditData(profile);
    setIsEditing(false);
  }

  function handleChangePassword() {
    setPasswordError("");
    setPasswordSuccess("");

    // Dummy validasi password lama
    if (oldPassword !== "user123" && oldPassword !== "admin123") {
      setPasswordError("Old password is incorrect");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordSuccess("Password changed successfully!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setPasswordSuccess("");
      setShowPasswordForm(false);
    }, 2000);
  }

  const inputStyle = {
    width: "100%",
    padding: "0.7rem 1rem",
    border: "1.5px solid var(--border)",
    borderRadius: "8px",
    fontSize: "0.88rem",
    color: "var(--text-primary)",
    background: "var(--bg-surface)",
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

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", maxWidth: "700px" }}>

      {/* Page header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
          My Profile
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
          Manage your personal information
        </p>
      </div>

      {/* Success alert */}
      {saveSuccess && (
        <div style={{
          padding: "0.75rem 1rem", background: "#f0fdf4",
          border: "1px solid #86efac", borderRadius: "8px",
          color: "#16a34a", fontSize: "0.82rem", fontWeight: "600",
          marginBottom: "1.25rem",
        }}>
          ✓ Profile updated successfully!
        </div>
      )}

      {/* Profile card */}
      <div style={{
        background: "white", border: "1px solid var(--border)",
        borderRadius: "16px", boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}>

        {/* Header dengan foto */}
        <div style={{
          background: "linear-gradient(135deg, #2563eb, #3b82f6)",
          padding: "2rem", display: "flex", alignItems: "center", gap: "1.5rem",
        }}>
          {/* Foto profil */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: "90px", height: "90px", borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              border: "3px solid rgba(255,255,255,0.5)",
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {(isEditing ? editData.photo : profile.photo) ? (
                <img
                  src={(isEditing ? editData.photo : profile.photo)!}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: "26px", height: "26px",
                  background: "white", border: "2px solid #2563eb",
                  borderRadius: "50%", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
          </div>

          {/* Info singkat */}
          <div>
            <h2 style={{ color: "white", fontWeight: "700", fontSize: "1.2rem", marginBottom: "0.25rem" }}>
              {profile.fullName || profile.username}
            </h2>
            <span style={{
              padding: "0.2rem 0.65rem",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "99px", fontSize: "0.72rem",
              color: "white", fontWeight: "600",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {profile.role}
            </span>
          </div>
        </div>

        {/* Form detail */}
        <div style={{ padding: "1.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

            {/* Username */}
            <div>
              <label style={labelStyle}>Username</label>
              <input
                style={{ ...inputStyle, background: "#f8fafc", color: "var(--text-muted)", cursor: "not-allowed" }}
                value={profile.username}
                disabled
              />
            </div>

            {/* Role */}
            <div>
              <label style={labelStyle}>Role</label>
              <input
                style={{ ...inputStyle, background: "#f8fafc", color: "var(--text-muted)", cursor: "not-allowed" }}
                value={profile.role}
                disabled
              />
            </div>

            {/* Full Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Full Name</label>
              <input
                style={inputStyle}
                value={isEditing ? editData.fullName : profile.fullName}
                onChange={e => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter your full name"
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
                value={isEditing ? editData.birthDate : profile.birthDate}
                onChange={e => setEditData(prev => ({ ...prev, birthDate: e.target.value }))}
                disabled={!isEditing}
                onFocus={e => e.target.style.borderColor = "#2563eb"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                style={inputStyle}
                value={isEditing ? editData.phone : profile.phone}
                onChange={e => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter your phone number"
                onFocus={e => e.target.style.borderColor = "#2563eb"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {/* Address */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Address</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                value={isEditing ? editData.address : profile.address}
                onChange={e => setEditData(prev => ({ ...prev, address: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter your address"
                onFocus={e => e.target.style.borderColor = "#2563eb"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: "0.7rem 1.25rem",
                    background: "white", border: "1.5px solid var(--border)",
                    borderRadius: "8px", fontSize: "0.85rem",
                    fontWeight: "600", color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: "0.7rem 1.25rem",
                    background: "#2563eb", border: "none",
                    borderRadius: "8px", fontSize: "0.85rem",
                    fontWeight: "600", color: "white",
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => { setIsEditing(true); setEditData(profile); }}
                style={{
                  padding: "0.7rem 1.25rem",
                  background: "#2563eb", border: "none",
                  borderRadius: "8px", fontSize: "0.85rem",
                  fontWeight: "600", color: "white",
                  cursor: "pointer", display: "flex",
                  alignItems: "center", gap: "0.4rem",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Profile
              </button>
            )}

            <button
              onClick={() => setShowPasswordForm(prev => !prev)}
              style={{
                padding: "0.7rem 1.25rem",
                background: "white", border: "1.5px solid var(--border)",
                borderRadius: "8px", fontSize: "0.85rem",
                fontWeight: "600", color: "var(--text-secondary)",
                cursor: "pointer", display: "flex",
                alignItems: "center", gap: "0.4rem",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Change Password
            </button>
          </div>

          {/* Password form */}
          {showPasswordForm && (
            <div style={{
              marginTop: "1.5rem", padding: "1.25rem",
              background: "#f8fafc", border: "1px solid var(--border)",
              borderRadius: "12px",
            }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: "700", marginBottom: "1rem", color: "var(--text-primary)" }}>
                Change Password
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <label style={labelStyle}>Old Password</label>
                  <input
                    type="password"
                    style={inputStyle}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Enter old password"
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                </div>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <input
                    type="password"
                    style={inputStyle}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input
                    type="password"
                    style={inputStyle}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                </div>

                {passwordError && (
                  <p style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: "500" }}>
                    ⚠ {passwordError}
                  </p>
                )}
                {passwordSuccess && (
                  <p style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: "500" }}>
                    ✓ {passwordSuccess}
                  </p>
                )}

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => { setShowPasswordForm(false); setPasswordError(""); }}
                    style={{
                      padding: "0.65rem 1rem",
                      background: "white", border: "1.5px solid var(--border)",
                      borderRadius: "8px", fontSize: "0.82rem",
                      fontWeight: "600", color: "var(--text-secondary)", cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    style={{
                      padding: "0.65rem 1rem",
                      background: "#2563eb", border: "none",
                      borderRadius: "8px", fontSize: "0.82rem",
                      fontWeight: "600", color: "white", cursor: "pointer",
                    }}
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}