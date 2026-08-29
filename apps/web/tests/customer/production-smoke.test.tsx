import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CustomerHomePage from "@/app/(customer)/page";
import CustomerCatalogPage from "@/app/(customer)/products/page";
import CustomerVisitPage from "@/app/(customer)/visit/page";
import SavedItemsPage from "@/app/(customer)/saved/page";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";
import { publicApi } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/lib/api", () => ({
  publicApi: {
    store: {
      getProfile: vi.fn(),
      getStatus: vi.fn(),
    },
    categories: {
      list: vi.fn(),
    },
    sections: {
      list: vi.fn(),
    },
    products: {
      list: vi.fn(),
      getBySlug: vi.fn(),
    },
    savedItems: {
      sync: vi.fn(),
      checkAvailability: vi.fn(),
    },
    attributes: {
      listSizes: vi.fn(),
      listColors: vi.fn(),
    },
  },
}));

describe("Phase 11 Customer Production Smoke Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(publicApi.store.getProfile).mockResolvedValue({
      id: "store-1",
      name: "Kangayath Clothing Showroom",
      tagline: "Authentic Kerala Handlooms & Silk Weaves",
      phone_primary: "+91-98765-43210",
      phone_secondary: null,
      whatsapp_number: "+91-98765-43210",
      email: "info@kangayath.in",
      address_line1: "Main Bazaar Road",
      address_line2: "Opposite Town Hall",
      city: "Thrissur",
      state: "Kerala",
      pincode: "680001",
      google_maps_url: "https://maps.google.com/?q=Kangayath",
      latitude: 10.5276,
      longitude: 76.2144,
      show_prices: true,
      schedules: [
        {
          day_of_week: "MONDAY",
          is_closed: false,
          open_time: "09:30:00",
          close_time: "20:30:00",
        },
      ],
      created_at: "2026-08-21T00:00:00Z",
      updated_at: "2026-08-21T00:00:00Z",
    });

    vi.mocked(publicApi.store.getStatus).mockResolvedValue({
      is_open: true,
      current_time_ist: "10:30 AM IST",
      effective_mode: "AUTO",
      today_schedule: {
        day_of_week: "MONDAY",
        is_closed: false,
        open_time: "09:30:00",
        close_time: "20:30:00",
      },
      banner_message: null,
      next_transition_time_ist: null,
    });

    const mockCategories = [
      {
        id: "cat-1",
        name: "Festive Handlooms",
        slug: "festive-handlooms",
        description: "Traditional Kerala sarees and dhotis",
        thumbnail_url: null,
        display_order: 0,
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
    ];

    vi.mocked(publicApi.categories.list).mockResolvedValue(mockCategories);

    vi.mocked(publicApi.sections.list).mockResolvedValue([
      {
        id: "sec-1",
        title: "Onam Festival Specials",
        slug: "onam-specials",
        subtitle: "Traditional gold zari collections",
        banner_image_url: null,
        display_order: 0,
        products: [],
      },
    ]);

    vi.mocked(publicApi.products.list).mockResolvedValue({
      items: [
        {
          id: "prod-1",
          name: "Handloom Kasavu Saree",
          slug: "handloom-kasavu-saree",
          material: "Pure Cotton",
          style_code: "KS-001",
          featured: true,
          is_available: true,
          primary_image_url: null,
          category_name: "Festive Handlooms",
          category_slug: "festive-handlooms",
          subcategory_name: "Kasavu Sarees",
          subcategory_slug: "kasavu-sarees",
          available_sizes: ["Free Size"],
          available_colors: ["Gold"],
        },
      ],
      total: 1,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });

    vi.mocked(publicApi.attributes.listSizes).mockResolvedValue([]);
    vi.mocked(publicApi.attributes.listColors).mockResolvedValue([]);
    vi.mocked(publicApi.savedItems.checkAvailability).mockResolvedValue([]);
  });

  it("renders customer homepage with brand identity and store hours status", async () => {
    render(
      <SavedItemsProvider>
        <ToastProvider>
          <CustomerHomePage />
        </ToastProvider>
      </SavedItemsProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Traditional Craft,")).toBeInTheDocument();
      expect(screen.getByText("Explore Garment Catalog")).toBeInTheDocument();
    });
  });

  it("renders catalog page with product filters and zero price exposure", async () => {
    render(
      <SavedItemsProvider>
        <ToastProvider>
          <CustomerCatalogPage />
        </ToastProvider>
      </SavedItemsProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Handloom Kasavu Saree")).toBeInTheDocument();
      expect(screen.getByText("Pure Cotton")).toBeInTheDocument();
    });

    // Zero-Price Guarantee: strictly no price tokens
    expect(screen.queryByText(/₹/)).toBeNull();
    expect(screen.queryByText(/INR/i)).toBeNull();
    expect(screen.queryByText(/MRP/i)).toBeNull();
  });

  it("renders store visit page with physical address and weekly hours schedule", async () => {
    render(
      <SavedItemsProvider>
        <ToastProvider>
          <CustomerVisitPage />
        </ToastProvider>
      </SavedItemsProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Physical Store Status")).toBeInTheDocument();
      expect(screen.getByText("Store Address & Contact")).toBeInTheDocument();
      expect(screen.getByText("Main Bazaar Road")).toBeInTheDocument();
    });
  });

  it("renders saved products page with zero cart/checkout semantics", async () => {
    render(
      <SavedItemsProvider>
        <ToastProvider>
          <SavedItemsPage />
        </ToastProvider>
      </SavedItemsProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Personal Wishlist")).toBeInTheDocument();
      expect(screen.getByText("Your saved list is empty")).toBeInTheDocument();
    });

    // Verify absence of e-commerce checkout buttons
    expect(screen.queryByText(/checkout/i)).toBeNull();
    expect(screen.queryByText(/pay now/i)).toBeNull();
    expect(screen.queryByText(/add to cart/i)).toBeNull();
    expect(screen.queryByText(/order now/i)).toBeNull();
  });
});
