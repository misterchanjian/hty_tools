import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes — no auth required
const PUBLIC_ROUTES = [
  "/",
  "/login",
];

const STATIC_EXTENSIONS = [
  ".ico", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp",
  ".webmanifest", ".css", ".js", ".map", ".woff", ".woff2", ".ttf",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // All app routes are protected — we do client-side session check in the layout.
  // Middleware just passes through; the client layout will redirect to /login if needed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
