import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { getDummyParkingData } from "@/lib/data";
import type { SessionData, ParkingData } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParkingData | { message: string }>
) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // TODO: Ganti dengan Firebase realtime fetch
  const data = getDummyParkingData();

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(data);
}