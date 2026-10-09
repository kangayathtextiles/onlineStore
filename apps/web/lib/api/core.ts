export function getApiBaseUrl(): string {
  // In the browser, route through same-origin Next.js rewrites.
  // This scopes the HttpOnly admin session cookie directly to the web domain,
  // enabling Next.js server-side route guards (middleware) to authenticate requests
  // and eliminating cross-site cookie blocking (Safari ITP / Brave / Chrome).
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// In-flight request deduplication map (prevents duplicate simultaneous network calls)
export const inFlightRequests = new Map<string, Promise<unknown>>();

// Lightweight in-memory TTL cache for public metadata (15 seconds TTL)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 15000; // 15s

export function clearApiCache(): void {
  memoryCache.clear();
}

// Fast non-blocking background warmup probe
let warmupTriggered = false;
export function warmupApiBackend(): void {
  if (typeof window === "undefined" || warmupTriggered) return;
  warmupTriggered = true;
  const healthUrl = `${getApiBaseUrl()}/health`;
  fetch(healthUrl, { method: "GET", cache: "no-store" }).catch(() => {
    // Non-blocking warmup probe
  });
}

export function getAdminAuthHeaders(): Record<string, string> {
  // Authentication is handled via server-managed HttpOnly cookies with credentials: "include".
  // Tokens are never stored or accessed in page JavaScript to prevent XSS exfiltration.
  return {};
}

export function clearAdminSession(): void {
  // Session termination is handled server-side via /auth/logout (clears HttpOnly cookie).
  // Clean up any residual client-side keys if present.
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("admin_session_token");
  localStorage.removeItem("ADMIN_API_KEY");
}

export function setAdminSession(): void {
  // Server sets the HttpOnly session cookie directly in the HTTP response.
  // No tokens are stored in sessionStorage or document.cookie.
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("admin_session_token");
  localStorage.removeItem("ADMIN_API_KEY");
}

// Write / non-idempotent HTTP methods that must NEVER be retried to prevent duplicate side effects
const WRITE_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

/**
 * Checks whether an error was caused by caller cancellation via AbortSignal.
 */
function isAbortError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }
  if (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return true;
  }
  return false;
}

/**
 * Checks whether an error is transient and safe to retry for read operations.
 * Transient conditions:
 * - Network errors (status 0 / NETWORK_ERROR or fetch network exceptions)
 * - Server errors (HTTP 5xx status codes)
 * Note: HTTP 429 (Too Many Requests / rate-limited) is intentionally NOT retried
 * automatically to avoid aggravating edge gateway rate-limit throttles.
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status === 0) return true;
    if (error.status >= 500 && error.status <= 599) return true;
    return false;
  }
  return true;
}

/**
 * Determines whether a failed attempt should be retried.
 */
function shouldRetry(
  method: string,
  error: unknown,
  attempt: number,
  maxRetries: number,
  signal?: AbortSignal | null
): boolean {
  if (WRITE_METHODS.has(method)) {
    return false;
  }
  if (signal?.aborted || isAbortError(error)) {
    return false;
  }
  if (attempt >= maxRetries) {
    return false;
  }
  return isRetryableError(error);
}

/**
 * Abort-aware delay helper that rejects immediately if the caller's AbortSignal fires during backoff.
 */
function delay(ms: number, signal?: AbortSignal | null): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(signal.reason || new Error("The operation was aborted"));
  }

  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
      reject(signal?.reason || new Error("The operation was aborted"));
    };

    const timer = setTimeout(() => {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
      resolve();
    }, ms);

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

/**
 * Executes a single HTTP attempt for the request.
 */
async function executeAttempt<T>(
  url: string,
  endpoint: string,
  isGet: boolean,
  cacheKey: string,
  options: RequestInit
): Promise<T> {
  const authHeaders =
    url.includes("/admin/") || url.includes("/auth/") ? getAdminAuthHeaders() : {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders,
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      let errPayload;
      try {
        errPayload = await res.json();
      } catch {
        errPayload = {
          error: { code: `HTTP_${res.status}`, message: res.statusText, details: {} },
        };
      }

      const code = errPayload?.error?.code || `HTTP_${res.status}`;
      const message =
        errPayload?.error?.message || `Request failed with status ${res.status}`;
      const details = errPayload?.error?.details || {};

      if (
        res.status === 401 &&
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/admin") &&
        window.location.pathname !== "/admin/login"
      ) {
        clearAdminSession();
        window.location.href = "/admin/login";
      }

      throw new ApiError(res.status, code, message, details);
    }

    // For 204 or empty response
    if (res.status === 204) {
      return {} as T;
    }

    const data = (await res.json()) as T;

    // Cache successful public GET responses
    if (isGet && endpoint.startsWith("/public/")) {
      memoryCache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError || isAbortError(error)) {
      throw error;
    }

    throw new ApiError(
      0,
      "NETWORK_ERROR",
      (error as Error).message || "Network request failed"
    );
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const isGet = method === "GET";
  const url = `${getApiBaseUrl()}/api/v1${endpoint}`;
  const cacheKey = `${method}:${url}`;

  // 1. Check in-memory TTL cache for GET requests
  if (isGet && memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey)!;
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data as T;
    }
    memoryCache.delete(cacheKey);
  }

  // 2. Invalidate cache on write operations (POST, PUT, DELETE, PATCH)
  if (!isGet) {
    memoryCache.clear();
  }

  // 3. Deduplicate concurrent identical in-flight GET requests
  if (isGet && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  let resolvePromise!: (val: T) => void;
  let rejectPromise!: (err: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  if (isGet) {
    inFlightRequests.set(cacheKey, promise);
  }

  (async () => {
    try {
      let attempt = 0;
      while (true) {
        if (options.signal?.aborted) {
          throw options.signal.reason || new Error("The operation was aborted");
        }

        try {
          const result = await executeAttempt<T>(
            url,
            endpoint,
            isGet,
            cacheKey,
            options
          );
          resolvePromise(result);
          return;
        } catch (error) {
          if (!shouldRetry(method, error, attempt, retries, options.signal)) {
            rejectPromise(error);
            return;
          }

          attempt++;
          const customDelay = (options as { retryDelayMs?: number })?.retryDelayMs;
          const retryDelayMs =
            customDelay ?? Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          await delay(retryDelayMs, options.signal);
        }
      }
    } catch (unhandledError) {
      rejectPromise(unhandledError);
    } finally {
      if (isGet) {
        inFlightRequests.delete(cacheKey);
      }
    }
  })();

  return promise;
}

export async function upload<T>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {},
  retries = 1
): Promise<T> {
  const url = `${getApiBaseUrl()}/api/v1${endpoint}`;
  const authHeaders = url.includes("/admin/") ? getAdminAuthHeaders() : {};
  const headers: Record<string, string> = {
    ...authHeaders,
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(url, {
      ...options,
      method: "POST",
      credentials: "include",
      body: formData,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      let errPayload;
      try {
        errPayload = await res.json();
      } catch {
        errPayload = {
          error: { code: `HTTP_${res.status}`, message: res.statusText, details: {} },
        };
      }
      const code = errPayload?.error?.code || `HTTP_${res.status}`;
      const message =
        errPayload?.error?.message || `Upload failed with status ${res.status}`;

      if (
        res.status === 401 &&
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/admin") &&
        window.location.pathname !== "/admin/login"
      ) {
        clearAdminSession();
        window.location.href = "/admin/login";
      }

      throw new ApiError(res.status, code, message, errPayload?.error?.details || {});
    }

    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return upload<T>(endpoint, formData, options, retries - 1);
    }

    throw new ApiError(0, "NETWORK_ERROR", (error as Error).message || "Upload request failed");
  }
}
