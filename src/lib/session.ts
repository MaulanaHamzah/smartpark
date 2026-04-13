import { SessionOptions } from "iron-session";
import type { SessionData } from "@/types";

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "smartpark-secret-key-min-32-chars!!",
  cookieName: "smartpark_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  },
};

export type { SessionData };