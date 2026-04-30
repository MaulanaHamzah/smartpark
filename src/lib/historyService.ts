import { db } from "./firebase";
import { ref, push, update, onValue, off } from "firebase/database";
import type { CarRecord } from "@/pages/dashboard";

export interface ParkingRecord {
  slotId: string;
  gate: "Gate A" | "Gate B";
  entryTime: string;
  exitTime?: string;
  status: "parked" | "exited";
}

export function saveCarEntry(car: CarRecord) {
  const historyRef = ref(db, "history");
  return push(historyRef, {
    id: car.id,
    colorName: car.colorName,
    color: car.color,
    entryTime: car.entryTime,
    slotId: car.slotId ?? null,
    exitTime: car.exitTime ?? null,
    status: car.status,
  });
}

export async function updateCarRecord(firebaseKey: string, data: Partial<CarRecord>) {
  const recordRef = ref(db, `history/${firebaseKey}`);
  return update(recordRef, data);
}

export function subscribeHistory(callback: (records: (CarRecord & { firebaseKey: string })[]) => void) {
  const historyRef = ref(db, "history");
  onValue(historyRef, snapshot => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    const records = Object.entries(data).map(([key, val]) => ({
      ...(val as CarRecord),
      firebaseKey: key,
    }));
    callback(records);
  });
  return () => off(historyRef);
}

export async function saveUserProfile(username: string, data: object) {
  const profileRef = ref(db, `users/${username}/profile`);
  return update(profileRef, data);
}

export function subscribeUserProfile(username: string, callback: (data: Record<string, string> | null) => void) {
  const profileRef = ref(db, `users/${username}/profile`);
  onValue(profileRef, snapshot => {
    callback(snapshot.val());
  });
  return () => off(profileRef);
}

// ─── Notifications ───────────────────────────────
export interface NotificationRecord {
  id: string;
  message: string;
  type: "occupied" | "available" | "full" | "available_again";
  slotId?: string;
  timestamp: string;
  isRead: boolean;
}

export function subscribeNotifications(
  username: string,
  callback: (notifs: NotificationRecord[]) => void
) {
  const notifRef = ref(db, `notifications/${username}`);
  onValue(notifRef, snapshot => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    const notifs = Object.entries(data).map(([key, val]) => ({
      ...(val as NotificationRecord),
      id: key,
    }));
    // Urutkan terbaru di atas
    notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(notifs);
  });
  return () => off(notifRef);
}

export async function markNotificationRead(username: string, notifId: string) {
  const notifRef = ref(db, `notifications/${username}/${notifId}`);
  return update(notifRef, { isRead: true });
}

export async function markAllNotificationsRead(username: string) {
  const notifRef = ref(db, `notifications/${username}`);
  const snapshot = await new Promise<Record<string, NotificationRecord>>((resolve) => {
    onValue(notifRef, s => resolve(s.val() ?? {}), { onlyOnce: true });
  });
  const updates: Record<string, boolean> = {};
  Object.keys(snapshot).forEach(key => {
    updates[`${key}/isRead`] = true;
  });
  return update(notifRef, updates);
}

// ─── Parking Records (baru) ───────────────────────
export function saveParkingRecord(data: Omit<ParkingRecord, "exitTime">) {
  const recordsRef = ref(db, "parkingRecords");
  return push(recordsRef, {
    ...data,
    exitTime: null,
  });
}

export async function updateParkingRecord(firebaseKey: string, data: Partial<ParkingRecord>) {
  const recordRef = ref(db, `parkingRecords/${firebaseKey}`);
  return update(recordRef, data);
}

export function subscribeParkingRecords(
  callback: (records: (ParkingRecord & { firebaseKey: string })[]) => void
) {
  const recordsRef = ref(db, "parkingRecords");
  onValue(recordsRef, snapshot => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    const records = Object.entries(data).map(([key, val]) => ({
      ...(val as ParkingRecord),
      firebaseKey: key,
    }));
    records.sort((a, b) =>
      new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
    );
    callback(records);
  });
  return () => off(recordsRef);
}

// ─── Gates ───────────────────────────────────────
export function subscribeGates(
  callback: (gates: { gateA: string; gateB: string }) => void
) {
  const gatesRef = ref(db, "gates");
  onValue(gatesRef, snapshot => {
    const data = snapshot.val();
    callback({
      gateA: data?.gateA?.status ?? "open",
      gateB: data?.gateB?.status ?? "closed",
    });
  });
  return () => off(ref(db, "gates"));
}