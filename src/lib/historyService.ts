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

// ─── Slots (Real-time dari Firebase) ─────────────
export interface SlotData {
  id_sensor: string;
  terisi: boolean;
  timestamp: string;
}

export function subscribeSlots(
  callback: (slots: Record<string, SlotData>) => void
) {
  const slotsRef = ref(db, "slots");
  onValue(slotsRef, snapshot => {
    const data = snapshot.val();
    callback(data ?? {});
  });
  return () => off(ref(db, "slots"));
}

// ─── Logs (dari Azure Function / IoT) ────────────
export interface LogRecord {
  deviceId: string;
  slotA1: boolean;
  slotA2: boolean;
  slotB1: boolean;
  slotB2: boolean;
  gateA: string;
  gateB: string;
  totalIsi: number;
  jam: number;
  menit: number;
  operasional: boolean;
  processedAt: string;
}

export function subscribeLogs(
  callback: (logs: (LogRecord & { firebaseKey: string })[]) => void
) {
  const logsRef = ref(db, "logs");
  onValue(logsRef, snapshot => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    const logs = Object.entries(data).map(([key, val]) => ({
      ...(val as LogRecord),
      firebaseKey: key,
    }));
    // Urutkan terbaru di atas
    logs.sort((a, b) =>
      new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
    );
    callback(logs);
  });
  return () => off(ref(db, "logs"));
}

// ─── Parking Records dari logs IoT ───────────────
// Fungsi ini listen logs/ dan otomatis simpan ke
// parkingRecords/ saat ada perubahan status slot
export function syncLogsToParking(
  callback?: (msg: string) => void
) {
  const prevSlots: Record<string, boolean> = {
    A1: false, A2: false, B1: false, B2: false,
  };
  const activeKeys: Record<string, string> = {};

  const logsRef = ref(db, "slots");
  onValue(logsRef, async snapshot => {
    const data = snapshot.val() as Record<string, SlotData> | null;
    if (!data) return;

    const slotMap: Record<string, boolean> = {
      A1: data.A1?.terisi ?? false,
      A2: data.A2?.terisi ?? false,
      B1: data.B1?.terisi ?? false,
      B2: data.B2?.terisi ?? false,
    };

    const gateSnapshot = await new Promise<{ gateA: string; gateB: string }>(resolve => {
      const gRef = ref(db, "gates");
      onValue(gRef, s => {
        const g = s.val();
        resolve({
          gateA: g?.gateA?.status ?? "open",
          gateB: g?.gateB?.status ?? "closed",
        });
      }, { onlyOnce: true });
    });

    for (const slotId of ["A1", "A2", "B1", "B2"]) {
      const wasOccupied = prevSlots[slotId];
      const isOccupied  = slotMap[slotId];

      // Slot baru terisi — simpan record masuk
      if (!wasOccupied && isOccupied) {
        const gate = slotId.startsWith("A") ? "Gate A" : "Gate B";
        const result = await saveParkingRecord({
          slotId,
          gate: gate as "Gate A" | "Gate B",
          entryTime: new Date().toISOString(),
          status: "parked",
        });
        if (result?.key) {
          activeKeys[slotId] = result.key;
        }
        callback?.(`${slotId} occupied via ${gate}`);
      }

      // Slot yang tadinya terisi, sekarang kosong — update record keluar
      if (wasOccupied && !isOccupied) {
        const key = activeKeys[slotId];
        if (key) {
          await updateParkingRecord(key, {
            exitTime: new Date().toISOString(),
            status: "exited",
          });
          delete activeKeys[slotId];
        }
        callback?.(`${slotId} now available`);
      }

      prevSlots[slotId] = isOccupied;
    }
  });

  return () => off(logsRef);
}

// ─── Push Notifikasi ke Firebase ─────────────────
async function pushNotification(
  username: string,
  message: string,
  type: NotificationRecord["type"],
  slotId?: string
) {
  const notifRef = ref(db, `notifications/${username}`);
  return push(notifRef, {
    message,
    type,
    slotId: slotId ?? null,
    timestamp: new Date().toISOString(),
    isRead: false,
  });
}

// ─── Ambil semua username user (bukan admin) ──────
async function getAllUsernames(): Promise<string[]> {
  const usersRef = ref(db, "users");
  return new Promise(resolve => {
    onValue(usersRef, snapshot => {
      const data = snapshot.val();
      if (!data) { resolve([]); return; }
      const usernames = Object.entries(data)
        .filter(([, val]) => {
          const v = val as Record<string, Record<string, string>>;
          return v.account?.role === "user";
        })
        .map(([key]) => key);
      resolve(usernames);
    }, { onlyOnce: true });
  });
}

// ─── Sync Slots + Auto Notifikasi ────────────────
export function syncSlotsAndNotify() {
  const prevSlots: Record<string, boolean> = {
    A1: false, A2: false, B1: false, B2: false,
  };
  const activeKeys: Record<string, string> = {};
  let prevFull = false;

  const slotsRef = ref(db, "slots");
  onValue(slotsRef, async snapshot => {
    const data = snapshot.val() as Record<string, SlotData> | null;
    if (!data) return;

    const slotMap: Record<string, boolean> = {
      A1: data.A1?.terisi ?? false,
      A2: data.A2?.terisi ?? false,
      B1: data.B1?.terisi ?? false,
      B2: data.B2?.terisi ?? false,
    };

    // Ambil gate status
    const gateSnapshot = await new Promise<{ gateA: string; gateB: string }>(resolve => {
      onValue(ref(db, "gates"), s => {
        const g = s.val();
        resolve({
          gateA: g?.gateA?.status ?? "open",
          gateB: g?.gateB?.status ?? "closed",
        });
      }, { onlyOnce: true });
    });

    // Ambil semua username user
    const usernames = await getAllUsernames();

    // Cek status penuh
    const totalOccupied = Object.values(slotMap).filter(Boolean).length;
    const isFull        = totalOccupied === 4;

    for (const slotId of ["A1", "A2", "B1", "B2"]) {
      const wasOccupied = prevSlots[slotId];
      const isOccupied  = slotMap[slotId];

      // Slot baru terisi
      if (!wasOccupied && isOccupied) {
        const gate = slotId.startsWith("A") ? "Gate A" : "Gate B";

        // Simpan ke parkingRecords
        const result = await saveParkingRecord({
          slotId,
          gate: gate as "Gate A" | "Gate B",
          entryTime: new Date().toISOString(),
          status: "parked",
        });
        if (result?.key) activeKeys[slotId] = result.key;

        // Kirim notifikasi ke semua user
        for (const username of usernames) {
          await pushNotification(
            username,
            `Slot ${slotId} is now occupied (${gate})`,
            "occupied",
            slotId
          );
        }
      }

      // Slot yang tadinya terisi, sekarang kosong
      if (wasOccupied && !isOccupied) {
        // Update parkingRecords
        const key = activeKeys[slotId];
        if (key) {
          await updateParkingRecord(key, {
            exitTime: new Date().toISOString(),
            status: "exited",
          });
          delete activeKeys[slotId];
        }

        // Kirim notifikasi ke semua user
        for (const username of usernames) {
          await pushNotification(
            username,
            `Slot ${slotId} is now available`,
            "available",
            slotId
          );
        }
      }

      prevSlots[slotId] = isOccupied;
    }

    // Notifikasi parkir penuh
    if (isFull && !prevFull) {
      for (const username of usernames) {
        await pushNotification(
          username,
          "Parking lot is FULL — All slots occupied!",
          "full"
        );
      }
    }

    // Notifikasi parkir tersedia kembali
    if (!isFull && prevFull) {
      for (const username of usernames) {
        await pushNotification(
          username,
          "Parking lot has available slots again",
          "available_again"
        );
      }
    }

    prevFull = isFull;
  });

  return () => off(slotsRef);
}