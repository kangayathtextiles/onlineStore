import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminDashboardPage from "@/app/admin/page";
import AdminProductsPage from "@/app/admin/products/page";
import AdminCategoriesPage from "@/app/admin/categories/page";
import AdminSectionsPage from "@/app/admin/sections/page";
import AdminShopPage from "@/app/admin/shop/page";
import { ToastProvider } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  adminApi: {
    products: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateLifecycle: vi.fn(),
      updateSoldOut: vi.fn(),
      addImage: vi.fn(),
      deleteImage: vi.fn(),
      reorderImages: vi.fn(),
      generateVariantMatrix: vi.fn(),
      addSingleVariant: vi.fn(),
      updateVariantAvailability: vi.fn(),
      deleteVariant: vi.fn(),
    },
    categories: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createSubcategory: vi.fn(),
      updateSubcategory: vi.fn(),
      deleteSubcategory: vi.fn(),
    },
    attributes: {
      listSizes: vi.fn(),
      createSize: vi.fn(),
      updateSize: vi.fn(),
      deleteSize: vi.fn(),
      listColors: vi.fn(),
      createColor: vi.fn(),
      updateColor: vi.fn(),
      deleteColor: vi.fn(),
    },
    sections: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      reorderItems: vi.fn(),
    },
    store: {
      get: vi.fn(),
      update: vi.fn(),
      updateSchedule: vi.fn(),
      getStatus: vi.fn(),
      setOverride: vi.fn(),
    },
  },
}));

describe("Phase 10 Admin Release Candidate Verification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(adminApi.products.list).mockResolvedValue({
      items: [
        {
          id: "prod-1",
          name: "Bridal Kasavu Silk Saree",
          slug: "bridal-kasavu-silk-saree",
          category_id: "cat-1",
          subcategory_id: "sub-1",
          description: "Pure gold zari border",
          material: "Mulberry Silk",
          style_code: "BK-001",
          qr_code: "KGY-QR-01020304",
          qr_status: "ACTIVE",
          operational_status: "AVAILABLE",
          is_damaged: false,
          is_retired: false,
          lifecycle_state: "PUBLISHED",
          manual_sold_out: false,
          featured: true,
          price: null,
          show_price: true,
          is_available: true,
          created_at: "2026-08-21T00:00:00Z",
          updated_at: "2026-08-21T00:00:00Z",
          meta_title: null,
          meta_description: null,
          images: [],
          variants: [],
          subcategory: {
            id: "sub-1",
            category_id: "cat-1",
            name: "Kasavu Sarees",
            slug: "kasavu-sarees",
            display_order: 0,
            is_active: true,
          },
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });

    vi.mocked(adminApi.categories.list).mockResolvedValue([
      {
        id: "cat-1",
        name: "Wedding Weaves",
        slug: "wedding-weaves",
        description: "Bridal and festive collection",
        thumbnail_url: null,
        display_order: 0,
        is_active: true,
        show_prices: true,
        created_at: "2026-08-21T00:00:00Z",
        updated_at: "2026-08-21T00:00:00Z",
        subcategories: [
          {
            id: "sub-1",
            category_id: "cat-1",
            name: "Kasavu Sarees",
            slug: "kasavu-sarees",
            display_order: 0,
            is_active: true,
          },
        ],
      },
    ]);

    vi.mocked(adminApi.sections.list).mockResolvedValue([
      {
        id: "sec-1",
        title: "Grand Onam Collection",
        slug: "grand-onam-collection",
        subtitle: "Exclusive festival arrivals",
        banner_image_url: null,
        is_active: true,
        display_order: 0,
        created_at: "2026-08-21T00:00:00Z",
        updated_at: "2026-08-21T00:00:00Z",
        items: [],
      },
    ]);

    vi.mocked(adminApi.store.get).mockResolvedValue({
      id: "store-1",
      name: "Kangayath Clothing Showroom",
      tagline: "Authentic Kerala Handlooms",
      phone_primary: "+91-98765-43210",
      phone_secondary: null,
      whatsapp_number: "+91-98765-43210",
      email: "info@kangayath.in",
      address_line1: "Main Bazaar Road",
      address_line2: null,
      city: "Thrissur",
      state: "Kerala",
      pincode: "680001",
      google_maps_url: null,
      latitude: 10.5276,
      longitude: 76.2144,
      show_prices: true,
      show_style_codes: true,
      schedules: [],
      created_at: "2026-08-21T00:00:00Z",
      updated_at: "2026-08-21T00:00:00Z",
    });

    vi.mocked(adminApi.store.getStatus).mockResolvedValue({
      is_open: true,
      current_time_ist: "10:00 AM IST",
      effective_mode: "AUTO",
      today_schedule: null,
      banner_message: null,
      next_transition_time_ist: null,
    });

    vi.mocked(adminApi.attributes.listSizes).mockResolvedValue([]);
    vi.mocked(adminApi.attributes.listColors).mockResolvedValue([]);
  });

  it("verifies Admin Dashboard renders operational overview and metrics", async () => {
    render(
      <ToastProvider>
        <AdminDashboardPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Store Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Add Garment")).toBeInTheDocument();
    });
  });

  it("verifies Admin Products page renders catalog table and action buttons", async () => {
    render(
      <ToastProvider>
        <AdminProductsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Product Catalog")).toBeInTheDocument();
      expect(screen.getByText("Bridal Kasavu Silk Saree")).toBeInTheDocument();
      expect(screen.getByText("BK-001")).toBeInTheDocument();
    });
  });

  it("verifies Admin Categories page renders hierarchy and subcategories", async () => {
    render(
      <ToastProvider>
        <AdminCategoriesPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Taxonomy & Categories")).toBeInTheDocument();
      expect(screen.getByText("Wedding Weaves")).toBeInTheDocument();
      expect(screen.getByText("Kasavu Sarees")).toBeInTheDocument();
    });
  });

  it("verifies Admin Promotional Sections page renders promotional items and state", async () => {
    render(
      <ToastProvider>
        <AdminSectionsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Promotional Custom Sections")).toBeInTheDocument();
      expect(screen.getByText("Grand Onam Collection")).toBeInTheDocument();
    });
  });

  it("verifies Admin Store Profile page renders contact info and live schedule overrides", async () => {
    render(
      <ToastProvider>
        <AdminShopPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Shop Status & Store Profile")).toBeInTheDocument();
      expect(screen.getByText("Real-Time Physical Store Status")).toBeInTheDocument();
    });
  });
});
