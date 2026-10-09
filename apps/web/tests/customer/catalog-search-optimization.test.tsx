import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import * as React from "react";
import { CustomerMobileNav } from "@/components/customer/mobile-nav";
import ProductsPage from "@/app/(customer)/products/page";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";
import { StoreProvider } from "@/lib/store-context";
import { publicApi } from "@/lib/api";

let mockPathname = "/products";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
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
    store: {
      getStatus: vi.fn(),
      getProfile: vi.fn(),
    },
  },
}));

describe("Catalog and Search Unified Optimization Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/products";
    mockSearchParams = new URLSearchParams();

    vi.mocked(publicApi.store.getStatus).mockResolvedValue({
      is_open: true,
      banner_message: null,
      effective_mode: "AUTO",
      today_schedule: {
        day_of_week: "MONDAY",
        is_closed: false,
        open_time: "09:30",
        close_time: "20:30",
      },
      current_time_ist: "2026-10-09 10:00:00 AM IST",
    } as any);

    vi.mocked(publicApi.store.getProfile).mockResolvedValue({
      id: "store-1",
      name: "Kangayath",
      primary_phone: "+91 99479 23223",
      phone_primary: "+91 99479 23223",
      whatsapp_number: "919947923223",
      google_maps_url: "https://maps.google.com",
      address_line1: "Kalkandi",
      locality: "Agali",
      district: "Palakkad",
      state: "Kerala",
      pincode: "678582",
    } as any);

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
    ]);

    vi.mocked(publicApi.attributes.listColors).mockResolvedValue([
      { id: "c-1", name: "Maroon", hex_code: "#651714", display_order: 0 },
    ]);

    vi.mocked(publicApi.products.list).mockResolvedValue({
      items: [
        {
          id: "prod-1",
          name: "Kasavu Silk Shirt",
          slug: "kasavu-silk-shirt",
          material: "Mulberry Silk",
          style_code: "KASAVU-001",
          featured: true,
          is_available: true,
          primary_image_url: null,
          category_name: "Men",
          category_slug: "men",
          subcategory_name: "Shirts",
          subcategory_slug: "shirts",
          available_sizes: ["M"],
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

  it("1. Verifies Mobile Navigation has exactly 4 tabs and removes redundant Search tab", () => {
    mockPathname = "/products";

    render(
      <ToastProvider>
        <SavedItemsProvider>
          <StoreProvider>
            <CustomerMobileNav />
          </StoreProvider>
        </SavedItemsProvider>
      </ToastProvider>
    );

    // Nav must exist
    const nav = screen.getByRole("navigation", { name: "Mobile Navigation" });
    expect(nav).toBeInTheDocument();

    // Must contain exactly 4 links: Home, Search, Saved, Visit
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Search & Browse Garments" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Saved Garments/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Store Hours & Directions" })).toBeInTheDocument();

    // Confirm the tab has text "Search"
    expect(screen.getByRole("link", { name: "Search & Browse Garments" })).toHaveTextContent("Search");

    // Search link is highlighted when on /products
    const searchLink = screen.getByRole("link", { name: "Search & Browse Garments" });
    expect(searchLink).toHaveAttribute("aria-current", "page");
  });

  it("2. Verifies Catalog search bar contains clear (X) button when query is present", async () => {
    mockPathname = "/products";
    mockSearchParams = new URLSearchParams();

    render(
      <ToastProvider>
        <SavedItemsProvider>
          <StoreProvider>
            <ProductsPage />
          </StoreProvider>
        </SavedItemsProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search title, fabric, code...")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search title, fabric, code...");

    // Initially no clear button
    expect(screen.queryByLabelText("Clear search input")).toBeNull();

    // Type a search query
    fireEvent.change(searchInput, { target: { value: "Silk" } });
    expect(searchInput).toHaveValue("Silk");

    // Clear button appears
    const clearButton = screen.getByLabelText("Clear search input");
    expect(clearButton).toBeInTheDocument();

    // Click clear button
    fireEvent.click(clearButton);
    expect(searchInput).toHaveValue("");
    expect(screen.queryByLabelText("Clear search input")).toBeNull();
  });

  it("3. Verifies focus=search query parameter smoothly focuses the search input", async () => {
    mockPathname = "/products";
    mockSearchParams = new URLSearchParams("focus=search");

    render(
      <ToastProvider>
        <SavedItemsProvider>
          <StoreProvider>
            <ProductsPage />
          </StoreProvider>
        </SavedItemsProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search title, fabric, code...");
      expect(searchInput).toBeInTheDocument();
      expect(document.activeElement).toBe(searchInput);
    });
  });

  it("4. Verifies Reset All Filters clears search, departments, and attributes", async () => {
    mockPathname = "/products";
    mockSearchParams = new URLSearchParams("category=men&search=Kasavu");

    render(
      <ToastProvider>
        <SavedItemsProvider>
          <StoreProvider>
            <ProductsPage />
          </StoreProvider>
        </SavedItemsProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Kasavu Silk Shirt")).toBeInTheDocument();
    });

    // Reset button should exist (active filters > 0)
    const resetButtons = screen.getAllByRole("button", { name: /Reset/i });
    expect(resetButtons.length).toBeGreaterThan(0);

    fireEvent.click(resetButtons[0]);

    // Search input should be cleared
    const searchInput = screen.getByPlaceholderText("Search title, fabric, code...");
    expect(searchInput).toHaveValue("");
  });

  it("5. Verifies Quick Department Chips allow 1-tap browsing under Search", async () => {
    mockPathname = "/products";
    mockSearchParams = new URLSearchParams();

    render(
      <ToastProvider>
        <SavedItemsProvider>
          <StoreProvider>
            <ProductsPage />
          </StoreProvider>
        </SavedItemsProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "All Garments" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Men" })).toBeInTheDocument();
    });

    const menChip = screen.getByRole("button", { name: "Men" });
    fireEvent.click(menChip);

    await waitFor(() => {
      expect(publicApi.products.list).toHaveBeenCalledWith(
        expect.objectContaining({ category: "men" })
      );
    });
  });
});
