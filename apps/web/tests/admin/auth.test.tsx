import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAdminAuthHeaders,
  setAdminSession,
  clearAdminSession,
} from "@/lib/api";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("Admin Authentication & Session Security", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.cookie = "admin_session=; Path=/; Max-Age=0";
  });

  describe("Session Storage & Token Utilities", () => {
    it("returns empty auth headers because credentials: 'include' handles cookie transmission", () => {
      const headers = getAdminAuthHeaders();
      expect(headers).toEqual({});
    });

    it("setAdminSession cleans up any legacy storage and never writes to sessionStorage or document.cookie", () => {
      localStorage.setItem("ADMIN_API_KEY", "plaintext_secret");
      sessionStorage.setItem("admin_session_token", "old_token");

      setAdminSession();

      // JS must NOT have access to tokens
      expect(sessionStorage.getItem("admin_session_token")).toBeNull();
      expect(localStorage.getItem("ADMIN_API_KEY")).toBeNull();
      expect(document.cookie).not.toContain("admin_session=");

      const headers = getAdminAuthHeaders();
      expect(headers).toEqual({});
    });

    it("clearAdminSession removes legacy storage artifacts", () => {
      localStorage.setItem("ADMIN_API_KEY", "legacy_key");
      sessionStorage.setItem("admin_session_token", "legacy_token");

      clearAdminSession();

      expect(sessionStorage.getItem("admin_session_token")).toBeNull();
      expect(localStorage.getItem("ADMIN_API_KEY")).toBeNull();
      expect(getAdminAuthHeaders()).toEqual({});
    });
  });

  describe("Next.js Server-Side Middleware Route Guard", () => {
    it("allows public access to /admin/login without session cookie", () => {
      const request = new NextRequest("http://localhost:3000/admin/login");
      const response = middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("redirects unauthenticated requests from /admin to /admin/login with no-store anti-cache headers", () => {
      const request = new NextRequest("http://localhost:3000/admin");
      const response = middleware(request);

      expect(response.status).toBe(307);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/admin/login");
      expect(redirectUrl.searchParams.get("from")).toBe("/admin");

      // Verify anti-caching headers on redirect
      expect(response.headers.get("Cache-Control")).toContain("no-store");
      expect(response.headers.get("Pragma")).toBe("no-cache");
      expect(response.headers.get("Expires")).toBe("0");
    });

    it("redirects unauthenticated requests from /admin/products to /admin/login with from param and anti-cache headers", () => {
      const request = new NextRequest("http://localhost:3000/admin/products");
      const response = middleware(request);

      expect(response.status).toBe(307);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/admin/login");
      expect(redirectUrl.searchParams.get("from")).toBe("/admin/products");
      expect(response.headers.get("Cache-Control")).toContain("no-store");
    });

    it("allows access to /admin/* when valid admin_session cookie is present and enforces no-store headers", () => {
      const request = new NextRequest("http://localhost:3000/admin/products", {
        headers: {
          cookie: "admin_session=valid_signed_session_token",
        },
      });
      const response = middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();

      // Verify anti-caching headers to prevent Back/Forward browser cache restoration
      expect(response.headers.get("Cache-Control")).toBe(
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0"
      );
      expect(response.headers.get("Pragma")).toBe("no-cache");
      expect(response.headers.get("Expires")).toBe("0");
      expect(response.headers.get("Surrogate-Control")).toBe("no-store");
    });

    it("redirects authenticated admins away from customer routes (/, /products, /visit) to /admin", () => {
      const customerRoutes = [
        "http://localhost:3000/",
        "http://localhost:3000/products",
        "http://localhost:3000/visit",
      ];
      for (const url of customerRoutes) {
        const request = new NextRequest(url, {
          headers: {
            cookie: "admin_session=valid_signed_session_token",
          },
        });
        const response = middleware(request);

        expect(response.status).toBe(307);
        const redirectUrl = new URL(response.headers.get("location")!);
        expect(redirectUrl.pathname).toBe("/admin");
        expect(response.headers.get("Cache-Control")).toContain("no-store");
      }
    });

    it("redirects authenticated admins away from /admin/login to /admin", () => {
      const request = new NextRequest("http://localhost:3000/admin/login", {
        headers: {
          cookie: "admin_session=valid_signed_session_token",
        },
      });
      const response = middleware(request);

      expect(response.status).toBe(307);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/admin");
      expect(response.headers.get("Cache-Control")).toContain("no-store");
    });
  });
});
