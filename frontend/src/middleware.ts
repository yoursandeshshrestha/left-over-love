// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const url = request.nextUrl.clone();

  // Public paths that don't require authentication
  const publicPaths = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/register-vendor",
    "/auth/register-ngo",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];

  const isPublicPath = publicPaths.some(
    (path) => url.pathname === path || url.pathname.startsWith("/api/")
  );

  // Check if the path starts with /admin, /vendor, or /ngo
  const isProtectedPath =
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/vendor") ||
    url.pathname.startsWith("/ngo");

  // If it's a protected path and there's no token, redirect to login
  if (isProtectedPath && !token) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If it's a public path like login/register and there is a token, redirect to dashboard
  if (
    isPublicPath &&
    token &&
    (url.pathname.includes("/auth/") || url.pathname === "/")
  ) {
    // We would need to check the user role here to redirect to the correct dashboard
    // For now, let's assume a default role
    url.pathname = "/vendor/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// src/middleware.ts (continued)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. robots.txt)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
