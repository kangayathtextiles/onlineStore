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
  QRActionRequest,
  QRCleanupResponse,
  QRPrintItem,
  QRScanResponse,
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
  VariantCreateRequest,
  VariantMatrixGenerateRequest,
} from "@/types/api";
import { request, upload } from "./core";

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
