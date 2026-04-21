import serviceAccount from "../../../serviceAccount.json";
import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/types";
import { initializeApp, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { credential } from "firebase-admin";

// Init Firebase Admin (server-side)
if (!getApps().length) {
  initializeApp({
    credential: credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
    databaseURL: "https://smartpark-bb399-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  try {
    const db = getDatabase();
    const snapshot = await db.ref(`users/${username}/account`).get();

    if (!snapshot.exists()) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    const account = snapshot.val() as { password: string; role: string };

    if (account.password !== password) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    session.isLoggedIn = true;
    session.user = { username, role: account.role as "admin" | "user" };
    await session.save();

    return res.status(200).json({ message: "Login berhasil", role: account.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}