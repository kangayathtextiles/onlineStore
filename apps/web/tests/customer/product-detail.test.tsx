import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ProductDetailPage from "@/app/(customer)/products/[slug]/page";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";
import { publicApi } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "kasavu-wedding-saree" }),
}));

vi.mock("@/lib/api", () => ({
  publicApi: {
    products: {
      getBySlug: vi.fn(),
    },
    store: {
      getProfile: vi.fn(),
    },
  },
}));

describe("Customer Product Detail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(publicApi.store.getProfile).mockResolvedValue({
      id: "store-1",
      name: "Kangayath Showroom",
      tagline: null,
      phone_primary: "+91 98765 43210",
      phone_secondary: null,
      whatsapp_number: "+91 98765 43210",
      email: null,
      address_line1: "Main Road",
      address_line2: null,
      city: "Thrissur",
      state: "Kerala",
      pincode: "680001",
      latitude: null,
      longitude: null,
      google_maps_url: null,
      show_prices: true,
      show_style_codes: true,
      schedules: [],
      created_at: "2026-08-21T00:00:00Z",
      updated_at: "2026-08-21T00:00:00Z",
    });

    vi.mocked(publicApi.products.getBySlug).mockResolvedValue({
      id: "prod-1",
      name: "Kasavu Wedding Saree",
      slug: "kasavu-wedding-saree",
      description: "Traditional pure handloom with gold zari border.",
      material: "Handloom Kasavu Silk",
      style_code: "KASAVU-W-01",
      featured: true,
      is_available: true,
      meta_title: null,
      meta_description: null,
      category_name: "Women Ethnic",
      category_slug: "women-ethnic",
      subcategory_name: "Silk Sarees",
      subcategory_slug: "silk-sarees",
      images: [
        {
          id: "img-1",
          product_id: "prod-1",
          url: "https://images.kangayath.in/kasavu1.webp",
          alt_text: "Kasavu Saree Front View",
          is_primary: true,
          display_order: 0,
          created_at: "2026-08-21T00:00:00Z",
        },
      ],
      variants: [
        {
          id: "var-1",
          product_id: "prod-1",
          size_id: "s-1",
          color_id: "c-1",
          sku: "KAS-FS-GOLD",
          is_available: true,
          created_at: "2026-08-21T00:00:00Z",
          updated_at: "2026-08-21T00:00:00Z",
          size: { id: "s-1", name: "Free Size", display_order: 0 },
          color: { id: "c-1", name: "Gold Zari", hex_code: "#D4AF37", display_order: 0 },
        },
      ],
    });
  });

  it("renders product detail, size & color selectors, stock status, and WhatsApp CTA", async () => {
    render(
      <ToastProvider>
        <SavedItemsProvider>
          <ProductDetailPage />
        </SavedItemsProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Kasavu Wedding Saree" })
      ).toBeInTheDocument();
      expect(screen.getByText("Handloom Kasavu Silk")).toBeInTheDocument();
      expect(screen.getByText("KASAVU-W-01")).toBeInTheDocument();
      expect(screen.getAllByText("Free Size").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Gold Zari").length).toBeGreaterThan(0);
      expect(screen.getByText("Available in Store")).toBeInTheDocument();
      expect(screen.getByText(/Inquire & Reserve on WhatsApp/i)).toBeInTheDocument();
      expect(screen.getByText("Save for Later")).toBeInTheDocument();
    });
  });
});
