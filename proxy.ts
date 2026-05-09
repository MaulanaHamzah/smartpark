import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Path yang bisa diakses tanpa login
const PUBLIC_PATHS = [
  "/",
  "/dashboard",
  "/login",
  "/api/login",
  "/_next",
  "/favicon.ico",
  "/parking-bg.jpeg",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Cek session cookie
  const cookie = request.cookies.get("smartpark_session");
  if (!cookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};