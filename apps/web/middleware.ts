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

  // 1. Authenticated Admin: Cannot browse the customer storefront or login page without logging out first
  if (sessionCookie) {
    if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
      const redirectResponse = NextResponse.redirect(new URL("/admin", request.url));
      for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
        redirectResponse.headers.set(key, value);
      }
      return redirectResponse;
    }
  }

  // 2. Unauthenticated Visitor: Cannot access protected /admin routes (except /admin/login)
  if (!sessionCookie) {
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     * - media/ (media uploads)
     * - brand/ (brand assets)
     * - robots.txt / sitemap.xml
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|media/|brand/|robots.txt|sitemap.xml).*)",
  ],
};
