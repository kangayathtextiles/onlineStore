import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CustomerHomePage from "@/app/(customer)/page";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";

vi.mock("@/lib/api", () => ({
  publicApi: {
    store: {
      getStatus: vi.fn().mockResolvedValue({
        is_open: true,
        effective_mode: "AUTO",
        banner_message: "Special Onam festive arrivals now in stock",
        today_schedule: {
          day_of_week: "FRIDAY",
          is_closed: false,
          open_time: "09:30",
          close_time: "21:00",
        },
        current_time_ist: "2026-08-21T11:00:00+05:30",
        next_transition_time_ist: "2026-08-21T21:00:00+05:30",
      }),
      getProfile: vi.fn().mockResolvedValue(null),
    },
    categories: {
      list: vi.fn().mockResolvedValue([
        {
          id: "cat-1",
          name: "Women Ethnic",
          slug: "women-ethnic",
          description: "Sarees and Festive sets",
          thumbnail_url: null,
          display_order: 0,
          subcategories: [],
        },
      ]),
    },
    sections: {
      list: vi.fn().mockResolvedValue([
        {
          id: "sec-1",
          title: "Onam Festival Edit",
          slug: "onam-festival-edit",
          subtitle: "Handcrafted kasavu sets",
          banner_image_url: null,
          display_order: 0,
          products: [
            {
              id: "prod-1",
              name: "Kasavu Golden Saree",
              slug: "kasavu-golden-saree",
              material: "Pure Handloom",
              style_code: "KAS-01",
              featured: true,
              is_available: true,
              primary_image_url: null,
              category_name: "Women Ethnic",
              category_slug: "women-ethnic",
              subcategory_name: null,
              subcategory_slug: null,
              available_sizes: ["Free Size"],
              available_colors: ["Gold"],
            },
          ],
        },
      ]),
    },
    products: {
      list: vi.fn().mockResolvedValue({
        items: [
          {
            id: "prod-2",
            name: "Linen Kurta",
            slug: "linen-kurta",
            material: "100% Linen",
            style_code: "KURTA-01",
            featured: true,
            is_available: true,
            primary_image_url: null,
            category_name: "Men",
            category_slug: "men",
            subcategory_name: "Kurtas",
            subcategory_slug: "kurtas",
            available_sizes: ["M", "L", "XL"],
            available_colors: ["White"],
          },
        ],
        total: 1,
        page: 1,
        page_size: 8,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      }),
    },
  },
}));

describe("Customer Home Page", () => {
  it("renders hero headline, store open status, categories, and promotional sections", async () => {
    render(
      <ToastProvider>
        <SavedItemsProvider>
          <CustomerHomePage />
        </SavedItemsProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Traditional Craft/i)).toBeInTheDocument();
      expect(screen.getByText(/Physical Store is OPEN NOW/i)).toBeInTheDocument();
      expect(screen.getAllByText("Women Ethnic").length).toBeGreaterThan(0);
      expect(screen.getByText("Onam Festival Edit")).toBeInTheDocument();
      expect(screen.getByText("Kasavu Golden Saree")).toBeInTheDocument();
      expect(screen.getByText("Linen Kurta")).toBeInTheDocument();
    });
  });
});
