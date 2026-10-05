import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { request, inFlightRequests, clearApiCache, ApiError } from "@/lib/api";

describe("Safe HTTP Retries and In-Flight Request Deduplication", () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    clearApiCache();
    inFlightRequests.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // 1. POST/PUT/DELETE/PATCH returning 500 -> fetch called once, error surfaced
  it("never retries write methods (POST, PUT, DELETE, PATCH) on 500 errors", async () => {
    const writeMethods = ["POST", "PUT", "DELETE", "PATCH", "post", "put", "delete", "patch"];

    for (const method of writeMethods) {
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: "INTERNAL_ERROR", message: `${method} failed on server` },
          }),
          { status: 500, statusText: "Internal Server Error", headers: { "Content-Type": "application/json" } }
        )
      );

      const promise = request("/admin/resource", {
        method,
        body: JSON.stringify({ key: "val" }),
      });

      await expect(promise).rejects.toThrow(ApiError);
      await expect(promise).rejects.toMatchObject({
        status: 500,
        code: "INTERNAL_ERROR",
        message: `${method} failed on server`,
      });

      // Exactly ONE network call must have been made
      expect(mockFetch).toHaveBeenCalledTimes(1);
      // Map should have no leftover entries
      expect(inFlightRequests.size).toBe(0);
    }
  });

  // 2. GET returning 500 twice then 200 -> fetch called three times, final result returned
  it("retries GET on transient 500 errors and returns the final successful response", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: "SERVER_ERROR", message: "Temporary failure 1" } }),
          { status: 500, statusText: "Server Error", headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: "SERVER_ERROR", message: "Temporary failure 2" } }),
          { status: 500, statusText: "Server Error", headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: "prod-1", name: "Silk Sari" }),
          { status: 200, statusText: "OK", headers: { "Content-Type": "application/json" } }
        )
      );

    const result = await request<{ id: string; name: string }>(
      "/public/products/silk-sari",
      { method: "GET", retryDelayMs: 5 } as RequestInit,
      3
    );

    expect(result).toEqual({ id: "prod-1", name: "Silk Sari" });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(inFlightRequests.size).toBe(0);
  });

  // 3. GET retry does not add a second dedup entry; map size is 1 during operation and 0 afterward
  it("ensures GET retry does not add a second dedup entry (map size is 1 during operation, 0 afterward)", async () => {
    let capturedSizeDuringRetry = 0;

    mockFetch
      .mockImplementationOnce(async () => {
        // First attempt: check map size while in-flight
        expect(inFlightRequests.size).toBe(1);
        return new Response(
          JSON.stringify({ error: { code: "ERR_500", message: "First attempt drop" } }),
          { status: 500, statusText: "Internal Error", headers: { "Content-Type": "application/json" } }
        );
      })
      .mockImplementationOnce(async () => {
        // Retry attempt: map size must STILL be exactly 1, not 2, not 0
        capturedSizeDuringRetry = inFlightRequests.size;
        return new Response(
          JSON.stringify({ status: "recovered" }),
          { status: 200, statusText: "OK", headers: { "Content-Type": "application/json" } }
        );
      });

    const promise = request<{ status: string }>(
      "/public/store/status",
      { method: "GET", retryDelayMs: 10 } as RequestInit,
      2
    );

    // Initial check right after invocation
    expect(inFlightRequests.size).toBe(1);

    const result = await promise;
    expect(result).toEqual({ status: "recovered" });

    // The retry attempt must not have added a second entry or cleared prematurely
    expect(capturedSizeDuringRetry).toBe(1);
    // Cleanup must be complete once settled
    expect(inFlightRequests.size).toBe(0);
  });

  // 4. Two concurrent identical GETs -> one initial fetch shared; both receive same final result even if a retry occurs
  it("shares a single in-flight request between concurrent identical GETs across retries", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: "TIMEOUT", message: "Gateway Timeout" } }),
          { status: 504, statusText: "Gateway Timeout", headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ items: ["item1", "item2"] }),
          { status: 200, statusText: "OK", headers: { "Content-Type": "application/json" } }
        )
      );

    // Trigger two identical concurrent GET requests simultaneously
    const p1 = request<{ items: string[] }>(
      "/public/categories",
      { method: "GET", retryDelayMs: 10 } as RequestInit,
      2
    );
    const p2 = request<{ items: string[] }>(
      "/public/categories",
      { method: "GET", retryDelayMs: 10 } as RequestInit,
      2
    );

    // Both must collapse into the same in-flight map entry
    expect(inFlightRequests.size).toBe(1);

    const [res1, res2] = await Promise.all([p1, p2]);

    expect(res1).toEqual({ items: ["item1", "item2"] });
    expect(res2).toEqual({ items: ["item1", "item2"] });
    // Total fetch calls across both callers must be 2 (1 initial failed attempt + 1 successful retry)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(inFlightRequests.size).toBe(0);
  });

  // 5. GET that fails all retries -> error thrown, map cleaned up
  it("exhausts retries on persistent failures, surfaces the final error, and cleans up the dedup map", async () => {
    mockFetch.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ error: { code: "SERVICE_UNAVAILABLE", message: "Backend offline" } }),
          { status: 503, statusText: "Service Unavailable", headers: { "Content-Type": "application/json" } }
        )
    );

    const retries = 2;
    const promise = request<{ data: string }>(
      "/public/store",
      { method: "GET", retryDelayMs: 5 } as RequestInit,
      retries
    );

    expect(inFlightRequests.size).toBe(1);

    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      message: "Backend offline",
    });

    // 1 initial attempt + 2 retries = 3 calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
    // In-flight map must be completely cleaned up
    expect(inFlightRequests.size).toBe(0);
  });

  // 6. Abort during a retry -> no retry continues, map cleaned up
  it("stops retrying immediately when AbortSignal triggers mid-retry, cleans up map, and propagates error", async () => {
    const controller = new AbortController();

    mockFetch.mockImplementation(async () => {
      return new Response(
        JSON.stringify({ error: { code: "ERR_500", message: "Server error" } }),
        { status: 500, statusText: "Server Error", headers: { "Content-Type": "application/json" } }
      );
    });

    const promise = request(
      "/public/sections",
      {
        method: "GET",
        signal: controller.signal,
        retryDelayMs: 50,
      } as RequestInit,
      5
    );

    // Initial attempt started, in-flight map registered
    expect(inFlightRequests.size).toBe(1);

    // Abort shortly after attempt 0 completes and while backoff delay is sleeping
    setTimeout(() => {
      controller.abort();
    }, 15);

    await expect(promise).rejects.toThrow();

    // No further retries should have taken place after abort
    expect(mockFetch).toHaveBeenCalledTimes(1);
    // In-flight map must have been cleaned up in finally block
    expect(inFlightRequests.size).toBe(0);
  });

  // Edge case: defaults to GET when no method is specified, retries on 500
  it("defaults to GET when method is omitted and retries appropriately", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: "SERVER_ERROR", message: "500" } }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    const result = await request<{ success: boolean }>(
      "/public/categories",
      { retryDelayMs: 5 } as RequestInit,
      2
    );

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(inFlightRequests.size).toBe(0);
  });

  // Edge case: 4xx non-retryable client error on GET fails immediately with 1 call
  it("does not retry client errors (404 Not Found) on GET requests", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { code: "NOT_FOUND", message: "Item not found" } }),
        { status: 404, statusText: "Not Found", headers: { "Content-Type": "application/json" } }
      )
    );

    const promise = request("/public/products/non-existent", { method: "GET" }, 3);

    await expect(promise).rejects.toThrow(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
      message: "Item not found",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(inFlightRequests.size).toBe(0);
  });

  // Edge case: Network failure (fetch throws) retries for GET, but not for POST
  it("retries GET on network errors (TypeError) but never retries POST on network errors", async () => {
    // 1. POST on network failure
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const postPromise = request("/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Silk" }),
    });

    await expect(postPromise).rejects.toThrow(ApiError);
    await expect(postPromise).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // 2. GET on network failure followed by success
    mockFetch.mockReset();
    mockFetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: "ok" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    const getResult = await request<{ data: string }>(
      "/public/store",
      { method: "GET", retryDelayMs: 5 } as RequestInit,
      2
    );

    expect(getResult).toEqual({ data: "ok" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(inFlightRequests.size).toBe(0);
  });
});
