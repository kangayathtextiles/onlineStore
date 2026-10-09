import type {
  ColorOption,
  PaginatedResponse,
  PublicCategoryTree,
  PublicProductDetail,
  PublicProductSummary,
  PublicSection,
  SavedItemAvailability,
  SavedItemSyncResponse,
  SizeOption,
  StoreProfile,
  StoreStatusResponse,
} from "@/types/api";
import { request } from "./core";

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
