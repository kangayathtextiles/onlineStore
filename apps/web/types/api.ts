export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type OverrideMode = "AUTO" | "FORCE_OPEN" | "FORCE_CLOSED";

export type LifecycleState = "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";

export interface OperatingSchedule {
  day_of_week: DayOfWeek;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

export interface OperatingScheduleUpdate {
  day_of_week: DayOfWeek;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

export interface StoreProfile {
  id: string;
  name: string;
  tagline: string | null;
  phone_primary: string;
  primary_phone?: string;
  phone_secondary: string | null;
  whatsapp_number: string | null;
  email: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  locality?: string;
  panchayat?: string;
  district?: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  schedules: OperatingSchedule[];
  created_at: string;
  updated_at: string;
}

export interface StoreProfileUpdate {
  name?: string;
  tagline?: string | null;
  phone_primary?: string;
  primary_phone?: string;
  phone_secondary?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  locality?: string;
  panchayat?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  google_maps_url?: string | null;
}

export interface StoreStatusResponse {
  is_open: boolean;
  effective_mode: OverrideMode;
  banner_message: string | null;
  today_schedule: OperatingSchedule | null;
  current_time_ist: string;
  next_transition_time_ist: string | null;
}

export interface StoreOverrideRequest {
  override_mode: OverrideMode;
  override_banner?: string | null;
}

export interface SubcategorySummary {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories: SubcategorySummary[];
}

export interface CategoryCreate {
  name: string;
  slug?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface CategoryUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface SubcategoryCreate {
  category_id: string;
  name: string;
  slug?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface SubcategoryUpdate {
  name?: string;
  slug?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface SizeOption {
  id: string;
  name: string;
  display_order: number;
}

export interface SizeOptionCreate {
  name: string;
  display_order?: number;
}

export interface SizeOptionUpdate {
  name?: string;
  display_order?: number;
}

export interface ColorOption {
  id: string;
  name: string;
  hex_code: string;
  display_order: number;
}

export interface ColorOptionCreate {
  name: string;
  hex_code: string;
  display_order?: number;
}

export interface ColorOptionUpdate {
  name?: string;
  hex_code?: string;
  display_order?: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface ProductImageCreate {
  url: string;
  alt_text?: string | null;
  is_primary?: boolean;
  display_order?: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_id: string | null;
  color_id: string | null;
  sku: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  size?: SizeOption | null;
  color?: ColorOption | null;
}

export interface ProductVariantCreate {
  size_id?: string | null;
  color_id?: string | null;
  sku?: string | null;
  is_available?: boolean;
}

export type VariantCreateRequest = ProductVariantCreate;

export interface VariantAvailabilityUpdate {
  is_available: boolean;
}

export interface AdminProduct {
  id: string;
  category_id: string;
  subcategory_id: string;
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  style_code: string | null;
  lifecycle_state: LifecycleState;
  manual_sold_out: boolean;
  featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  is_available: boolean;
  subcategory?: SubcategorySummary | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ProductCreateRequest {
  category_id: string;
  subcategory_id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  material?: string | null;
  style_code?: string | null;
  lifecycle_state?: LifecycleState;
  manual_sold_out?: boolean;
  featured?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface ProductUpdateRequest {
  category_id?: string;
  subcategory_id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  material?: string | null;
  style_code?: string | null;
  lifecycle_state?: LifecycleState;
  manual_sold_out?: boolean;
  featured?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface VariantMatrixGenerateRequest {
  size_ids: string[];
  color_ids: string[];
  default_available?: boolean;
}

export interface CustomSectionItem {
  id: string;
  section_id: string;
  product_id: string;
  sort_order: number;
  created_at: string;
  product_name: string | null;
  product_slug: string | null;
  product_image_url: string | null;
  is_available: boolean;
}

export interface AdminSection {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  banner_image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  items: CustomSectionItem[];
}

export interface SectionCreateRequest {
  title: string;
  slug?: string | null;
  subtitle?: string | null;
  banner_image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
  product_ids?: string[];
}

export interface SectionUpdateRequest {
  title?: string;
  slug?: string;
  subtitle?: string | null;
  banner_image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
}

export interface SectionItemOrder {
  product_id: string;
  sort_order: number;
}

export interface SectionItemReorderRequest {
  items: SectionItemOrder[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

export interface ErrorResponse {
  error: ErrorDetail;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

// --- Customer Public DTOs (Zero Price Exposure) ---
export interface PublicProductSummary {
  id: string;
  name: string;
  slug: string;
  material: string | null;
  style_code: string | null;
  featured: boolean;
  is_available: boolean;
  primary_image_url: string | null;
  category_name: string | null;
  category_slug: string | null;
  subcategory_name: string | null;
  subcategory_slug: string | null;
  available_sizes: string[];
  available_colors: string[];
}

export interface PublicProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  style_code: string | null;
  featured: boolean;
  is_available: boolean;
  meta_title: string | null;
  meta_description: string | null;
  category_name: string | null;
  category_slug: string | null;
  subcategory_name: string | null;
  subcategory_slug: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface PublicCategoryTree {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  display_order: number;
  subcategories: SubcategorySummary[];
}

export interface PublicSection {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  banner_image_url: string | null;
  display_order: number;
  products: PublicProductSummary[];
}

export interface SavedItemAvailability {
  product_id: string;
  product_name: string;
  product_slug: string;
  is_available: boolean;
  primary_image_url: string | null;
  saved_at: string | null;
}

export interface SavedItemSyncResponse {
  session_token: string;
  items: PublicProductSummary[];
  total_saved: number;
}
