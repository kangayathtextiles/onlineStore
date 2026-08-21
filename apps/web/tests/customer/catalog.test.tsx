import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ProductsPage from "@/app/(customer)/products/page";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";
import { publicApi } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  publicApi: {
    categories: {
      list: vi.fn(),
    },
    attributes: {
      listSizes: vi.fn(),
      listColors: vi.fn(),
    },
    products: {
      list: vi.fn(),
    },
  },
}));

describe("Customer Product Catalog Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(publicApi.categories.list).mockResolvedValue([
      {
        id: "cat-1",
        name: "Men",
        slug: "men",
        description: "Men collection",
        thumbnail_url: null,
        display_order: 0,
        subcategories: [
          {
            id: "sub-1",
            category_id: "cat-1",
            name: "Shirts",
            slug: "shirts",
            display_order: 0,
            is_active: true,
          },
        ],
      },
    ]);

    vi.mocked(publicApi.attributes.listSizes).mockResolvedValue([
      { id: "s-1", name: "M", display_order: 0 },
      { id: "s-2", name: "L", display_order: 1 },
    ]);

    vi.mocked(publicApi.attributes.listColors).mockResolvedValue([
      { id: "c-1", name: "Maroon", hex_code: "#651714", display_order: 0 },
    ]);

    vi.mocked(publicApi.products.list).mockResolvedValue({
      items: [
        {
          id: "prod-1",
          name: "Classic Silk Shirt",
          slug: "classic-silk-shirt",
          material: "Pure Mulberry Silk",
          style_code: "SHIRT-SILK-01",
          featured: true,
          is_available: true,
          primary_image_url: null,
          category_name: "Men",
          category_slug: "men",
          subcategory_name: "Shirts",
          subcategory_slug: "shirts",
          available_sizes: ["M", "L"],
          available_colors: ["Maroon"],
        },
      ],
      total: 1,
      page: 1,
      page_size: 16,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });
  });

  it("renders catalog garments and filter controls", async () => {
    render(
      <ToastProvider>
        <SavedItemsProvider>
          <ProductsPage />
        </SavedItemsProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("All Garments")).toBeInTheDocument();
      expect(screen.getByText("Classic Silk Shirt")).toBeInTheDocument();
      expect(screen.getByText("Pure Mulberry Silk")).toBeInTheDocument();
    });
  });
});
