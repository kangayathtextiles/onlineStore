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
    it("returns empty auth headers when no session exists", () => {
      const headers = getAdminAuthHeaders();
      expect(headers).toEqual({});
    });

    it("setAdminSession sets sessionStorage and clears plaintext localStorage API key", () => {
      localStorage.setItem("ADMIN_API_KEY", "plaintext_secret");
      setAdminSession("mock_session_token_123", 3600);

      expect(sessionStorage.getItem("admin_session_token")).toBe("mock_session_token_123");
      expect(localStorage.getItem("ADMIN_API_KEY")).toBeNull();
      expect(document.cookie).toContain("admin_session=mock_session_token_123");

      const headers = getAdminAuthHeaders();
      expect(headers["Authorization"]).toBe("Bearer mock_session_token_123");
    });

    it("clearAdminSession removes session token, legacy key, and expires cookie", () => {
      setAdminSession("mock_session_token_123", 3600);
      clearAdminSession();

      expect(sessionStorage.getItem("admin_session_token")).toBeNull();
      expect(localStorage.getItem("ADMIN_API_KEY")).toBeNull();
      expect(getAdminAuthHeaders()).toEqual({});
    });

    it("falls back to legacy localStorage key if present for backward compatibility", () => {
      localStorage.setItem("ADMIN_API_KEY", "legacy_key_xyz");
      const headers = getAdminAuthHeaders();
      expect(headers["X-Admin-Api-Key"]).toBe("legacy_key_xyz");
    });
  });

  describe("Next.js Server-Side Middleware Route Guard", () => {
    it("allows public access to /admin/login without session cookie", () => {
      const request = new NextRequest("http://localhost:3000/admin/login");
      const response = middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("redirects unauthenticated requests from /admin to /admin/login", () => {
      const request = new NextRequest("http://localhost:3000/admin");
      const response = middleware(request);

      expect(response.status).toBe(307);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/admin/login");
      expect(redirectUrl.searchParams.get("from")).toBe("/admin");
    });

    it("redirects unauthenticated requests from /admin/products to /admin/login with from param", () => {
      const request = new NextRequest("http://localhost:3000/admin/products");
      const response = middleware(request);

      expect(response.status).toBe(307);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/admin/login");
      expect(redirectUrl.searchParams.get("from")).toBe("/admin/products");
    });

    it("allows access to /admin/* when valid admin_session cookie is present", () => {
      const request = new NextRequest("http://localhost:3000/admin/products", {
        headers: {
          cookie: "admin_session=valid_signed_session_token",
        },
      });
      const response = middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  });
});
