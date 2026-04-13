import type { ParkingData } from "@/types";

export function getDummyParkingData(): ParkingData {
  return {
    systemStatus: "online",
    lastUpdated: new Date().toISOString(),
    areas: [
      {
        id: "A",
        name: "Area A",
        slots: [
          { id: "A1", status: "available" },
          { id: "A2", status: "available" },
          { id: "A3", status: "available" },
          { id: "A4", status: "available" },
        ],
      },
      {
        id: "B",
        name: "Area B",
        slots: [
          { id: "B1", status: "available" },
          { id: "B2", status: "available" },
          { id: "B3", status: "available" },
          { id: "B4", status: "available" },
        ],
      },
    ],
  };
}