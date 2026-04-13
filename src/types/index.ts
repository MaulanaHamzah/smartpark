export type SlotStatus = "available" | "occupied";

export interface ParkingSlot {
  id: string;
  status: SlotStatus;
}

export interface ParkingArea {
  id: string;
  name: string;
  slots: ParkingSlot[];
}

export interface ParkingData {
  areas: ParkingArea[];
  lastUpdated: string;
  systemStatus: "online" | "offline";
}

export interface User {
  username: string;
  role: "admin" | "user";
}

export interface SessionData {
  user?: User;
  isLoggedIn: boolean;
}