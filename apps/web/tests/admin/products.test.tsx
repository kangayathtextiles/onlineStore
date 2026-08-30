import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminProductsPage from "@/app/admin/products/page";
import { ToastProvider } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  adminApi: {
    products: {
      list: vi.fn(),
      updateSoldOut: vi.fn(),
      delete: vi.fn(),
    },
    categories: {
      list: vi.fn(),
    },
  },
}));

describe("Admin Products Catalog Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(adminApi.categories.list).mockResolvedValue([
      {
        id: "cat-1",
        name: "Men",
        slug: "men",
        description: null,
        thumbnail_url: null,
        display_order: 0,
        is_active: true,
        show_prices: true,
        created_at: "2026-08-21T00:00:00Z",
        updated_at: "2026-08-21T00:00:00Z",
        subcategories: [],
      },
    ]);

    vi.mocked(adminApi.products.list).mockResolvedValue({
      items: [
        {
          id: "prod-1",
          category_id: "cat-1",
          subcategory_id: "sub-1",
          name: "Linen Shirt",
          slug: "linen-shirt",
          description: "100% linen",
          material: "Pure Linen",
          style_code: "SHIRT-01",
          qr_code: "KGY-QR-01020304",
          qr_status: "ACTIVE",
          operational_status: "AVAILABLE",
          is_damaged: false,
          is_retired: false,
          lifecycle_state: "PUBLISHED",
          manual_sold_out: false,
          featured: false,
          price: null,
          show_price: true,
          meta_title: null,
          meta_description: null,
          created_at: "2026-08-21T00:00:00Z",
          updated_at: "2026-08-21T00:00:00Z",
          is_available: true,
          subcategory: {
            id: "sub-1",
            category_id: "cat-1",
            name: "Shirts",
            slug: "shirts",
            display_order: 0,
            is_active: true,
          },
          images: [],
          variants: [
            {
              id: "var-1",
              product_id: "prod-1",
              size_id: "s-1",
              color_id: "c-1",
              sku: "SHIRT-L-WHITE",
              is_available: true,
              created_at: "2026-08-21T00:00:00Z",
              updated_at: "2026-08-21T00:00:00Z",
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      page_size: 15,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });
  });

  it("renders catalog products and category filter dropdown", async () => {
    render(
      <ToastProvider>
        <AdminProductsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Product Catalog")).toBeInTheDocument();
      expect(screen.getByText("Linen Shirt")).toBeInTheDocument();
      expect(screen.getByText("SHIRT-01")).toBeInTheDocument();
    });
  });

  it("toggles product sold-out override", async () => {
    vi.mocked(adminApi.products.updateSoldOut).mockResolvedValue({
      id: "prod-1",
      category_id: "cat-1",
      subcategory_id: "sub-1",
      name: "Linen Shirt",
      slug: "linen-shirt",
      description: "100% linen",
      material: "Pure Linen",
      style_code: "SHIRT-01",
      qr_code: "KGY-QR-01020304",
      qr_status: "ACTIVE",
      operational_status: "SOLD_OUT",
      is_damaged: false,
      is_retired: false,
      lifecycle_state: "PUBLISHED",
      manual_sold_out: true,
      featured: false,
      price: null,
      show_price: true,
      meta_title: null,
      meta_description: null,
      created_at: "2026-08-21T00:00:00Z",
      updated_at: "2026-08-21T00:00:00Z",
      is_available: false,
      subcategory: null,
      images: [],
      variants: [],
    });

    render(
      <ToastProvider>
        <AdminProductsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("In Stock")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByTitle("Click to toggle master sold-out override");
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(adminApi.products.updateSoldOut).toHaveBeenCalledWith("prod-1", true);
    });
  });
});
