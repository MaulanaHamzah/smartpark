import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/types";

const USERS = [
  { username: "admin", password: "admin123", role: "admin" as const },
  { username: "user",  password: "user123",  role: "user"  as const },
];

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

  const found = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!found) {
    return res.status(401).json({ message: "Username atau password salah" });
  }

  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.isLoggedIn = true;
  session.user = { username: found.username, role: found.role };
  await session.save();

  return res.status(200).json({ message: "Login berhasil", role: found.role });
}