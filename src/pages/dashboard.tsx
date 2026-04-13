import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { getDummyParkingData } from "@/lib/data";
import type { SessionData, ParkingData, SlotStatus } from "@/types";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isLoggedIn || !session.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const initialData = getDummyParkingData();
  return { props: { user: session.user, initialData } };
};

// SVG Mobil tampak atas
function CarSVG({ color = "#2563eb", size = 40 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="12" y="16" width="40" height="32" rx="6" fill={color} />
      <rect x="16" y="20" width="32" height="18" rx="4" fill="white" opacity="0.2" />
      <rect x="14" y="14" width="36" height="8" rx="3" fill={color} />
      <circle cx="18" cy="48" r="5" fill="#1e293b" />
      <circle cx="18" cy="48" r="2.5" fill="#475569" />
      <circle cx="46" cy="48" r="5" fill="#1e293b" />
      <circle cx="46" cy="48" r="2.5" fill="#475569" />
      <circle cx="18" cy="16" r="5" fill="#1e293b" />
      <circle cx="18" cy="16" r="2.5" fill="#475569" />
      <circle cx="46" cy="16" r="5" fill="#1e293b" />
      <circle cx="46" cy="16" r="2.5" fill="#475569" />
      <rect x="10" y="28" width="6" height="8" rx="2" fill="#fbbf24" opacity="0.9" />
      <rect x="48" y="28" width="6" height="8" rx="2" fill="#fbbf24" opacity="0.9" />
    </svg>
  );
}

const CAR_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];

interface Car {
  id: string;
  color: string;
}

interface Props {
  user: { username: string; role: string };
  initialData: ParkingData;
}

export default function DashboardPage({ user, initialData }: Props) {
  const router = useRouter();

  // State parkir
  const [areas, setAreas] = useState(initialData.areas);

  // Pool mobil (stok mobil yang bisa di-drag)
  const [carPool, setCarPool] = useState<Car[]>([
    { id: "car-1", color: CAR_COLORS[0] },
    { id: "car-2", color: CAR_COLORS[1] },
    { id: "car-3", color: CAR_COLORS[2] },
    { id: "car-4", color: CAR_COLORS[3] },
    { id: "car-5", color: CAR_COLORS[4] },
    { id: "car-6", color: CAR_COLORS[5] },
    { id: "car-7", color: "#0f172a" },
    { id: "car-8", color: "#be185d" },
  ]);

  // Mobil yang ada di slot
  const [slotCars, setSlotCars] = useState<Record<string, Car>>({});

  // Drag state
  const [draggingCar, setDraggingCar] = useState<Car | null>(null);
  const [draggingFrom, setDraggingFrom] = useState<"pool" | string>("pool");
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Stats
  const totalSlots = areas.reduce((s, a) => s + a.slots.length, 0);
  const occupied = areas.reduce((s, a) => s + a.slots.filter(sl => sl.status === "occupied").length, 0);
  const available = totalSlots - occupied;
  const isFull = available === 0;

  async function handleLogout() {
    const confirm = window.confirm("Are you sure you want to logout?");
    if (!confirm) return;
    await fetch("/api/logout", { method: "POST" });
    await router.push("/login");
  }

  // Update status slot
  function setSlotStatus(areaId: string, slotId: string, status: SlotStatus) {
    setAreas(prev => prev.map(area => {
      if (area.id !== areaId) return area;
      return {
        ...area,
        slots: area.slots.map(slot =>
          slot.id === slotId ? { ...slot, status } : slot
        ),
      };
    }));
  }

  // Drag dari pool
  function onDragStartPool(car: Car) {
    setDraggingCar(car);
    setDraggingFrom("pool");
  }

  // Drag dari slot
  function onDragStartSlot(car: Car, slotId: string) {
    setDraggingCar(car);
    setDraggingFrom(slotId);
  }

  // Drop ke slot
  function onDropSlot(areaId: string, slotId: string) {
    if (!draggingCar) return;
    const slot = areas.find(a => a.id === areaId)?.slots.find(s => s.id === slotId);
    if (!slot || slot.status === "occupied") return;

    // Taruh mobil di slot
    setSlotCars(prev => ({ ...prev, [slotId]: draggingCar! }));
    setSlotStatus(areaId, slotId, "occupied");

    // Kalau dari pool, hapus dari pool
    if (draggingFrom === "pool") {
      setCarPool(prev => prev.filter(c => c.id !== draggingCar!.id));
    } else {
      // Kalau dari slot lain, kosongkan slot asal
      const fromSlotId = draggingFrom;
      const fromArea = areas.find(a => a.slots.some(s => s.id === fromSlotId));
      if (fromArea) {
        setSlotStatus(fromArea.id, fromSlotId, "available");
        setSlotCars(prev => {
          const next = { ...prev };
          delete next[fromSlotId];
          return next;
        });
      }
    }

    setDraggingCar(null);
    setDragOverSlot(null);
  }

  // Drop ke pool (kembalikan mobil)
  function onDropPool() {
    if (!draggingCar || draggingFrom === "pool") return;

    const fromSlotId = draggingFrom;
    const fromArea = areas.find(a => a.slots.some(s => s.id === fromSlotId));
    if (fromArea) {
      setSlotStatus(fromArea.id, fromSlotId, "available");
      setSlotCars(prev => {
        const next = { ...prev };
        delete next[fromSlotId];
        return next;
      });
    }

    setCarPool(prev => [...prev, draggingCar!]);
    setDraggingCar(null);
    setDragOverSlot(null);
  }

  return (
    <>
      <Head><title>SmartPark — Dashboard</title></Head>

      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

        {/* Navbar */}
        <nav style={{
          background: "white",
          borderBottom: "1px solid var(--border)",
          padding: "0 2rem",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--shadow-sm)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
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
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", fontSize: "1rem" }}>SmartPark</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {user.username}
              <span style={{
                padding: "0.1rem 0.5rem",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "99px",
                fontSize: "0.65rem",
                color: "#2563eb",
                fontWeight: "600",
                textTransform: "uppercase",
              }}>{user.role}</span>
            </div>

            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                padding: "0.4rem 0.9rem",
                background: "transparent",
                border: "1.5px solid var(--border)",
                borderRadius: "8px",
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#dc2626";
                (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, padding: "2rem", maxWidth: "1100px", width: "100%", margin: "0 auto" }}>

          {/* Page title */}
          <div style={{ marginBottom: "1.5rem", animation: "fadeUp 0.4s ease both" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Parking Monitor
            </h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Drag a car from the pool into a parking slot
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1rem",
            marginBottom: "2rem",
            animation: "fadeUp 0.45s ease 0.05s both",
          }}>
            {[
              { label: "Total Slots", value: totalSlots, color: "#0f172a" },
              { label: "Available", value: available, color: "#16a34a" },
              { label: "Occupied", value: occupied, color: "#dc2626" },
              { label: "Status", value: isFull ? "FULL" : "OK", color: isFull ? "#dc2626" : "#16a34a" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "white",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.1rem 1.25rem",
                boxShadow: "var(--shadow-sm)",
              }}>
                <p style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {stat.label}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: "700", color: stat.color, lineHeight: 1.2, marginTop: "0.3rem" }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* FULL banner */}
          {isFull && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.85rem 1.25rem",
              background: "#fef2f2",
              border: "1.5px solid #fca5a5",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              color: "#dc2626",
              fontWeight: "600",
              fontSize: "0.88rem",
            }}>
              ⚠ Parking lot is FULL — All slots occupied!
            </div>
          )}

          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>

            {/* Car Pool */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={onDropPool}
              style={{
                width: "160px",
                flexShrink: 0,
                background: "white",
                border: "1.5px dashed var(--border-strong)",
                borderRadius: "16px",
                padding: "1rem",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <p style={{
                fontSize: "0.7rem", fontWeight: "700",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.75rem",
                textAlign: "center",
              }}>
                Car Pool
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", alignItems: "center" }}>
                {carPool.length === 0 ? (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
                    All cars parked
                  </p>
                ) : (
                  carPool.map(car => (
                    <div
                      key={car.id}
                      draggable
                      onDragStart={() => onDragStartPool(car)}
                      style={{
                        cursor: "grab",
                        padding: "0.5rem",
                        borderRadius: "10px",
                        background: "#f8fafc",
                        border: "1px solid var(--border)",
                        transition: "transform 0.15s, box-shadow 0.15s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                      }}
                    >
                      <CarSVG color={car.color} size={44} />
                    </div>
                  ))
                )}
              </div>
              <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.75rem" }}>
                Drop here to remove
              </p>
            </div>

            {/* Parking Areas */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {areas.map((area, aIdx) => (
                <div key={area.id} style={{
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  boxShadow: "var(--shadow-sm)",
                  animation: `fadeUp 0.5s ease ${0.1 + aIdx * 0.08}s both`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: "700" }}>
                      {area.name}
                    </h2>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      <span style={{ color: "#16a34a", fontWeight: "600" }}>
                        {area.slots.filter(s => s.status === "available").length}
                      </span> / {area.slots.length} available
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.85rem" }}>
                    {area.slots.map(slot => {
                      const isOccupied = slot.status === "occupied";
                      const car = slotCars[slot.id];
                      const isDragOver = dragOverSlot === slot.id;

                      return (
                        <div
                          key={slot.id}
                          draggable={isOccupied}
                          onDragStart={() => car && onDragStartSlot(car, slot.id)}
                          onDragOver={e => {
                            e.preventDefault();
                            if (!isOccupied) setDragOverSlot(slot.id);
                          }}
                          onDragLeave={() => setDragOverSlot(null)}
                          onDrop={() => onDropSlot(area.id, slot.id)}
                          style={{
                            aspectRatio: "1 / 1.15",
                            borderRadius: "12px",
                            border: `2px solid ${
                              isDragOver ? "#2563eb" :
                              isOccupied ? "#fca5a5" : "#86efac"
                            }`,
                            background: isDragOver ? "#eff6ff" :
                              isOccupied ? "#fef2f2" : "#f0fdf4",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.4rem",
                            cursor: isOccupied ? "grab" : "default",
                            transition: "all 0.2s ease",
                            transform: isDragOver ? "scale(1.03)" : "scale(1)",
                            boxShadow: isDragOver ? "0 0 0 3px rgba(37,99,235,0.15)" : "none",
                            position: "relative",
                          }}
                        >
                          {/* Slot ID */}
                          <span style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            color: isOccupied ? "#dc2626" : "#16a34a",
                          }}>
                            {slot.id}
                          </span>

                          {/* Car or empty icon */}
                          {isOccupied && car ? (
                            <CarSVG color={car.color} size={38} />
                          ) : (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 3"/>
                              <path d="M9 12h6M12 9v6" strokeLinecap="round"/>
                            </svg>
                          )}

                          {/* Status label */}
                          <span style={{
                            fontSize: "0.58rem",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: isOccupied ? "#dc2626" : "#16a34a",
                          }}>
                            {isOccupied ? "Occupied" : "Available"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}