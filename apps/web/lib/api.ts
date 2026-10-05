import type {
  AdminProduct,
  AdminSection,
  Category,
  CategoryCreate,
  CategoryUpdate,
  ColorOption,
  ColorOptionCreate,
  ColorOptionUpdate,
  LifecycleState,
  OperatingSchedule,
  OperatingScheduleUpdate,
  PaginatedResponse,
  ProductCreateRequest,
  ProductImageCreate,
  ProductUpdateRequest,
  SectionCreateRequest,
  SectionItemReorderRequest,
  SectionUpdateRequest,
  SizeOption,
  SizeOptionCreate,
  SizeOptionUpdate,
  StoreOverrideRequest,
  StoreProfile,
  StoreProfileUpdate,
  StoreStatusResponse,
  Subcategory,
  SubcategoryCreate,
  SubcategoryUpdate,
  SuccessResponse,
  PublicCategoryTree,
  PublicProductDetail,
  PublicProductSummary,
  PublicSection,
  QRActionRequest,
  QRCleanupResponse,
  QRPrintItem,
  QRScanResponse,
  SavedItemAvailability,
  SavedItemSyncResponse,
  VariantCreateRequest,
  VariantMatrixGenerateRequest,
} from "@/types/api";

export function getApiBaseUrl(): string {
  // If running in browser, determine correct environment dynamically
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "kangayath-web-staging.onrender.com") {
      return "https://kangayath-api-staging.onrender.com";
    }
    if (host.endsWith(".onrender.com")) {
      return "https://kangayath-api.onrender.com";
    }
    if (host.includes("kangayath.site")) {
      return "https://api.kangayath.site";
    }
    if (host.includes("kangayath.in")) {
      return "https://api.kangayath.in";
    }
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
 * - Rate limiting (HTTP 429 Too Many Requests)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status === 0) return true;
    if (error.status === 429) return true;
    if (error.status >= 500 && error.status <= 599) return true;
    return false;
  }
  return true;
}

/**
 * Determines whether a failed attempt should be retried.
 * Retries are disabled for:
 * 1. Write methods (POST, PUT, DELETE, PATCH) to avoid duplicate side effects (e.g. double orders, charges, or deletions).
 * 2. Abort signals (caller cancelled).
 * 3. Exhausted retry attempts.
 * 4. Non-transient client errors (e.g. 400, 401, 403, 404).
 */
function shouldRetry(
  method: string,
  error: unknown,
  attempt: number,
  maxRetries: number,
  signal?: AbortSignal | null
): boolean {
  // Writes must never retry to prevent duplicate side effects
  if (WRITE_METHODS.has(method)) {
    return false;
  }

  // Caller cancelled the request; stop immediately
  if (signal?.aborted || isAbortError(error)) {
    return false;
  }

  // Check attempt limit
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
  retries = 6
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

  // Single-owner promise lifecycle:
  // The original GET call registers its promise in inFlightRequests exactly once.
  // Any retry attempts run strictly INSIDE this same promise chain and bypass the dedup
  // map entirely. This prevents overwriting or leaking map entries and ensures all concurrent
  // callers awaiting the in-flight request receive the final result (or error).
  // The map entry is deleted exactly once in the finally block when the operation settles.
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
          const retryDelayMs =
            (options as { retryDelayMs?: number })?.retryDelayMs ?? 2000;
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


async function upload<T>(
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
        errPayload = { error: { code: `HTTP_${res.status}`, message: res.statusText, details: {} } };
      }
      const code = errPayload?.error?.code || `HTTP_${res.status}`;
      const message = errPayload?.error?.message || `Upload failed with status ${res.status}`;

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

export const adminApi = {
  // --- Admin Authentication ---
  auth: {
    login: (apiKey: string) =>
      request<{ status: string; expires_in: number }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ api_key: apiKey }),
        }
      ),
    logout: () =>
      request<{ status: string; message: string }>("/auth/logout", {
        method: "POST",
      }),
    getMe: () =>
      request<{ status: string; role: string; mode: string }>("/auth/me"),
  },
  // --- Media Uploads ---
  media: {
    upload: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return upload<{ url: string; filename: string; content_type?: string; size_bytes: number }>(
        "/admin/media/upload",
        formData
      );
    },
  },

  // --- Store & Hours ---
  store: {
    get: () => request<StoreProfile>("/admin/store"),
    update: (data: StoreProfileUpdate) =>
      request<StoreProfile>("/admin/store", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    updateSchedule: (schedules: OperatingScheduleUpdate[]) =>
      request<OperatingSchedule[]>("/admin/store/schedule", {
        method: "PUT",
        body: JSON.stringify(schedules),
      }),
    getStatus: () => request<StoreStatusResponse>("/public/store/status"),
    setOverride: (data: StoreOverrideRequest) =>
      request<StoreStatusResponse>("/admin/store/override", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // --- Categories & Subcategories ---
  categories: {
    list: () => request<Category[]>("/admin/categories"),
    create: (data: CategoryCreate) =>
      request<Category>("/admin/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: CategoryUpdate) =>
      request<Category>(`/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<SuccessResponse>(`/admin/categories/${id}`, {
        method: "DELETE",
      }),
    createSubcategory: (data: SubcategoryCreate) =>
      request<Subcategory>("/admin/categories/subcategories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateSubcategory: (id: string, data: SubcategoryUpdate) =>
      request<Subcategory>(`/admin/categories/subcategories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteSubcategory: (id: string) =>
      request<SuccessResponse>(`/admin/categories/subcategories/${id}`, {
        method: "DELETE",
      }),
  },

  // --- Sizes & Colors ---
  attributes: {
    listSizes: () => request<SizeOption[]>("/admin/attributes/sizes"),
    createSize: (data: SizeOptionCreate) =>
      request<SizeOption>("/admin/attributes/sizes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateSize: (id: string, data: SizeOptionUpdate) =>
      request<SizeOption>(`/admin/attributes/sizes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteSize: (id: string) =>
      request<SuccessResponse>(`/admin/attributes/sizes/${id}`, {
        method: "DELETE",
      }),

    listColors: () => request<ColorOption[]>("/admin/attributes/colors"),
    createColor: (data: ColorOptionCreate) =>
      request<ColorOption>("/admin/attributes/colors", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateColor: (id: string, data: ColorOptionUpdate) =>
      request<ColorOption>(`/admin/attributes/colors/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteColor: (id: string) =>
      request<SuccessResponse>(`/admin/attributes/colors/${id}`, {
        method: "DELETE",
      }),
  },

  // --- Products & Variations ---
  products: {
    list: (params?: {
      lifecycle_state?: LifecycleState;
      category_id?: string;
      subcategory_id?: string;
      search?: string;
      page?: number;
      page_size?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.lifecycle_state) query.set("lifecycle_state", params.lifecycle_state);
      if (params?.category_id) query.set("category_id", params.category_id);
      if (params?.subcategory_id) query.set("subcategory_id", params.subcategory_id);
      if (params?.search) query.set("search", params.search);
      if (params?.page) query.set("page", params.page.toString());
      if (params?.page_size) query.set("page_size", params.page_size.toString());

      const qs = query.toString();
      return request<PaginatedResponse<AdminProduct>>(`/admin/products${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<AdminProduct>(`/admin/products/${id}`),
    create: (data: ProductCreateRequest) =>
      request<AdminProduct>("/admin/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: ProductUpdateRequest) =>
      request<AdminProduct>(`/admin/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<SuccessResponse>(`/admin/products/${id}`, {
        method: "DELETE",
      }),
    updateLifecycle: (id: string, lifecycle_state: LifecycleState) =>
      request<AdminProduct>(`/admin/products/${id}/lifecycle`, {
        method: "PUT",
        body: JSON.stringify({ lifecycle_state }),
      }),
    updateSoldOut: (id: string, manual_sold_out: boolean) =>
      request<AdminProduct>(`/admin/products/${id}/sold-out`, {
        method: "PUT",
        body: JSON.stringify({ manual_sold_out }),
      }),

    // Images
    addImage: (productId: string, data: ProductImageCreate) =>
      request<AdminProduct>(`/admin/products/${productId}/images`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    uploadImage: (productId: string, file: File, isPrimary = false, altText?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("is_primary", String(isPrimary));
      if (altText) formData.append("alt_text", altText);
      return upload<AdminProduct>(`/admin/products/${productId}/images/upload`, formData);
    },
    deleteImage: (productId: string, imageId: string) =>
      request<AdminProduct>(`/admin/products/${productId}/images/${imageId}`, {
        method: "DELETE",
      }),
    reorderImages: (
      productId: string,
      images: { image_id: string; display_order: number; is_primary: boolean }[]
    ) =>
      request<AdminProduct>(`/admin/products/${productId}/images/reorder`, {
        method: "PUT",
        body: JSON.stringify({ images }),
      }),

    // Variants
    generateVariantMatrix: (productId: string, data: VariantMatrixGenerateRequest) =>
      request<AdminProduct>(`/admin/products/${productId}/variants/matrix`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    addVariant: (productId: string, data: VariantCreateRequest) =>
      request<AdminProduct>(`/admin/products/${productId}/variants`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateVariantAvailability: (
      productId: string,
      variantId: string,
      data: { is_available: boolean }
    ) =>
      request<AdminProduct>(`/admin/products/${productId}/variants/${variantId}/availability`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteVariant: (productId: string, variantId: string) =>
      request<AdminProduct>(`/admin/products/${productId}/variants/${variantId}`, {
        method: "DELETE",
      }),
  },

  // --- Custom Promotional Sections ---
  sections: {
    list: () => request<AdminSection[]>("/admin/sections"),
    get: (id: string) => request<AdminSection>(`/admin/sections/${id}`),
    create: (data: SectionCreateRequest) =>
      request<AdminSection>("/admin/sections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: SectionUpdateRequest) =>
      request<AdminSection>(`/admin/sections/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    reorderItems: (id: string, data: SectionItemReorderRequest) =>
      request<AdminSection>(`/admin/sections/${id}/reorder`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<SuccessResponse>(`/admin/sections/${id}`, {
        method: "DELETE",
      }),
  },

  // --- QR Management & Lifecycle ---
  qr: {
    lookup: (code: string) =>
      request<QRScanResponse>(`/admin/qr/lookup?code=${encodeURIComponent(code)}`),
    executeAction: (data: QRActionRequest) =>
      request<QRScanResponse>("/admin/qr/action", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getPrintData: (params?: {
      category_id?: string;
      subcategory_id?: string;
      operational_status?: string;
      search?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.category_id) query.set("category_id", params.category_id);
      if (params?.subcategory_id) query.set("subcategory_id", params.subcategory_id);
      if (params?.operational_status) query.set("operational_status", params.operational_status);
      if (params?.search) query.set("search", params.search);

      const qs = query.toString();
      return request<QRPrintItem[]>(`/admin/qr/print-data${qs ? `?${qs}` : ""}`);
    },
    runCleanup: (retentionYears = 2) =>
      request<QRCleanupResponse>(`/admin/qr/cleanup?retention_years=${retentionYears}`, {
        method: "POST",
      }),
  },
};

export const publicApi = {
  // --- Store & Operating Status ---
  store: {
    getProfile: () => request<StoreProfile>("/public/store"),
    getStatus: () => request<StoreStatusResponse>("/public/store/status"),
  },

  // --- Categories Hierarchy ---
  categories: {
    list: () => request<PublicCategoryTree[]>("/public/categories"),
  },

  // --- Attributes (Sizes & Colors) ---
  attributes: {
    listSizes: () => request<SizeOption[]>("/public/attributes/sizes"),
    listColors: () => request<ColorOption[]>("/public/attributes/colors"),
  },

  // --- Products Discovery ---
  products: {
    list: (params?: {
      category?: string;
      subcategory?: string;
      size_id?: string;
      color_id?: string;
      available_only?: boolean;
      search?: string;
      page?: number;
      page_size?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.category) query.set("category", params.category);
      if (params?.subcategory) query.set("subcategory", params.subcategory);
      if (params?.size_id) query.set("size_id", params.size_id);
      if (params?.color_id) query.set("color_id", params.color_id);
      if (params?.available_only !== undefined)
        query.set("available_only", params.available_only.toString());
      if (params?.search) query.set("search", params.search);
      if (params?.page) query.set("page", params.page.toString());
      if (params?.page_size) query.set("page_size", params.page_size.toString());

      const qs = query.toString();
      return request<PaginatedResponse<PublicProductSummary>>(
        `/public/products${qs ? `?${qs}` : ""}`
      );
    },
    getBySlug: (slug: string) =>
      request<PublicProductDetail>(`/public/products/${encodeURIComponent(slug)}`),
  },

  // --- Promotional Sections ---
  sections: {
    list: () => request<PublicSection[]>("/public/sections"),
    getBySlug: (slug: string) =>
      request<PublicSection>(`/public/sections/${encodeURIComponent(slug)}`),
  },

  // --- Saved Products (Wishlist) ---
  savedItems: {
    checkAvailability: (productIds: string[]) =>
      request<SavedItemAvailability[]>("/public/saved-items/availability", {
        method: "POST",
        body: JSON.stringify({ product_ids: productIds }),
      }),
    sync: (sessionToken: string, productIds: string[]) =>
      request<SavedItemSyncResponse>("/public/saved-items/sync", {
        method: "POST",
        body: JSON.stringify({ session_token: sessionToken, product_ids: productIds }),
      }),
  },
};
