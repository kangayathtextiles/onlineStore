import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminDashboardPage from "@/app/admin/page";
import { ToastProvider } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

// Mock API
vi.mock("@/lib/api", () => ({
  adminApi: {
    products: {
      list: vi.fn(),
      updateSoldOut: vi.fn(),
    },
    categories: {
      list: vi.fn(),
    },
    sections: {
      list: vi.fn(),
    },
    store: {
      getStatus: vi.fn(),
    },
  },
}));

describe("Admin Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(adminApi.products.list).mockResolvedValue({
      items: [
        {
          id: "prod-1",
          category_id: "cat-1",
          subcategory_id: "sub-1",
          name: "Kasavu Wedding Saree",
          slug: "kasavu-wedding-saree",
          description: "Pure gold zari border",
          material: "Handloom Silk",
          style_code: "KASAVU-01",
          lifecycle_state: "PUBLISHED",
          manual_sold_out: false,
          featured: true,
          meta_title: null,
          meta_description: null,
          created_at: "2026-08-21T00:00:00Z",
          updated_at: "2026-08-21T00:00:00Z",
          is_available: true,
          subcategory: {
            id: "sub-1",
            category_id: "cat-1",
            name: "Silk Sarees",
            slug: "silk-sarees",
            display_order: 0,
            is_active: true,
          },
          images: [
            {
              id: "img-1",
              product_id: "prod-1",
              url: "https://images.kangayath.in/kasavu.webp",
              alt_text: "Kasavu Saree",
              is_primary: true,
              display_order: 0,
              created_at: "2026-08-21T00:00:00Z",
            },
          ],
          variants: [],
        },
      ],
      total: 1,
      page: 1,
      page_size: 6,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });

    vi.mocked(adminApi.categories.list).mockResolvedValue([
      {
        id: "cat-1",
        name: "Women",
        slug: "women",
        description: "Women collection",
        thumbnail_url: null,
        display_order: 0,
        is_active: true,
        created_at: "2026-08-21T00:00:00Z",
        updated_at: "2026-08-21T00:00:00Z",
        subcategories: [
          {
            id: "sub-1",
            category_id: "cat-1",
            name: "Silk Sarees",
            slug: "silk-sarees",
            display_order: 0,
            is_active: true,
          },
        ],
      },
    ]);

    vi.mocked(adminApi.sections.list).mockResolvedValue([
      {
        id: "sec-1",
        title: "Onam Special Offers",
        slug: "onam-special-offers",
        subtitle: "Festive discounts",
        banner_image_url: null,
        is_active: true,
        display_order: 0,
        created_at: "2026-08-21T00:00:00Z",
        updated_at: "2026-08-21T00:00:00Z",
        items: [],
      },
    ]);

    vi.mocked(adminApi.store.getStatus).mockResolvedValue({
      is_open: true,
      effective_mode: "AUTO",
      banner_message: null,
      today_schedule: {
        day_of_week: "FRIDAY",
        is_closed: false,
        open_time: "09:30",
        close_time: "21:00",
      },
      current_time_ist: "2026-08-21T10:00:00+05:30",
      next_transition_time_ist: "2026-08-21T21:00:00+05:30",
    });
  });

  it("renders dashboard operational status and metrics", async () => {
    render(
      <ToastProvider>
        <AdminDashboardPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Store Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Physical Store is OPEN NOW/i)).toBeInTheDocument();
      expect(screen.getByText("Kasavu Wedding Saree")).toBeInTheDocument();
    });
  });
});
