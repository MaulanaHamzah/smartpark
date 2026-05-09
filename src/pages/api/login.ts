import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/types";
import { initializeApp, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { credential } from "firebase-admin";

// Init Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: "https://smartpark-bb399-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}

// Rate limiting — simpan di memory server
// Key: IP address, Value: { attempts, blockedUntil }
const loginAttempts = new Map<string, { attempts: number; blockedUntil: number }>();

const MAX_ATTEMPTS  = 5;
const BLOCK_MS      = 15 * 60 * 1000; // 15 menit

function getClientIp(req: NextApiRequest): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const ip = getClientIp(req);
  const now = Date.now();

  // Cek rate limit
  const record = loginAttempts.get(ip);
  if (record) {
    // Kalau masih diblokir
    if (record.blockedUntil > now) {
      const remaining = Math.ceil((record.blockedUntil - now) / 1000 / 60);
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${remaining} minute(s).`,
      });
    }
    // Kalau blokir sudah lewat, reset
    if (record.blockedUntil > 0 && record.blockedUntil <= now) {
      loginAttempts.delete(ip);
    }
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
      // Tambah attempt
      const curr = loginAttempts.get(ip) ?? { attempts: 0, blockedUntil: 0 };
      curr.attempts += 1;
      if (curr.attempts >= MAX_ATTEMPTS) {
        curr.blockedUntil = now + BLOCK_MS;
        curr.attempts = 0;
      }
      loginAttempts.set(ip, curr);
      return res.status(401).json({ message: "Username atau password salah" });
    }

    const account = snapshot.val() as { password: string; role: string };

    if (account.password !== password) {
      // Tambah attempt
      const curr = loginAttempts.get(ip) ?? { attempts: 0, blockedUntil: 0 };
      curr.attempts += 1;
      if (curr.attempts >= MAX_ATTEMPTS) {
        curr.blockedUntil = now + BLOCK_MS;
        curr.attempts = 0;
      }
      loginAttempts.set(ip, curr);
      return res.status(401).json({ message: "Username atau password salah" });
    }

    // Login berhasil — reset attempts
    loginAttempts.delete(ip);

    // Cek role harus admin
    if (account.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
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