import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const NO_CACHE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("admin_session")?.value;

  // If already authenticated and visiting /admin/login, redirect to destination server-side
  if (pathname === "/admin/login") {
    if (sessionCookie) {
      const from = request.nextUrl.searchParams.get("from") || "/admin";
      return NextResponse.redirect(new URL(from, request.url));
    }
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
        redirectResponse.headers.set(key, value);
      }
      return redirectResponse;
    }
  }

  const response = NextResponse.next();

  // Enforce zero-cache headers on all admin pages
  if (pathname.startsWith("/admin")) {
    for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
