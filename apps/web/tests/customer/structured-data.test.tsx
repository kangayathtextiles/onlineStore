import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CustomerLayout from "@/app/(customer)/layout";
import ProductDetailPage from "@/app/(customer)/products/[slug]/page";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";
import { publicApi } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "kasavu-festive-saree" }),
  usePathname: () => "/products/kasavu-festive-saree",
}));

vi.mock("@/lib/api", () => ({
  publicApi: {
    products: {
      getBySlug: vi.fn(),
    },
    store: {
      getProfile: vi.fn(),
      getStatus: vi.fn(),
    },
    categories: {
      getTree: vi.fn(),
    },
  },
}));

describe("Zero-Price JSON-LD Structured Data Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(publicApi.store.getProfile).mockResolvedValue({
      id: "store-1",
      name: "Kangayath",
      tagline: null,
      phone_primary: "+91 98765 43210",
      phone_secondary: null,
      whatsapp_number: "+91 98765 43210",
      email: null,
      address_line1: "Main Bazaar Road",
      address_line2: null,
      city: "Thrissur",
      state: "Kerala",
      pincode: "680001",
      google_maps_url: null,
      latitude: 10.5276,
      longitude: 76.2144,
      show_prices: true,
      schedules: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.mocked(publicApi.store.getStatus).mockResolvedValue({
      is_open: true,
      current_time_ist: "10:30 AM IST",
      effective_mode: "AUTO",
      today_schedule: null,
      banner_message: null,
      next_transition_time_ist: null,
    });

    vi.mocked(publicApi.products.getBySlug).mockResolvedValue({
      id: "prod-1",
      name: "Kasavu Festive Saree",
      slug: "kasavu-festive-saree",
      description: "Authentic Kerala cotton saree with gold zari",
      material: "Pure Cotton",
      style_code: "KASAVU-01",
      featured: false,
      is_available: true,
      meta_title: null,
      meta_description: null,
      category_name: "Festive Wear",
      category_slug: "festive-wear",
      subcategory_name: "Kasavu Sarees",
      subcategory_slug: "kasavu-sarees",
      images: [
        {
          id: "img-1",
          product_id: "prod-1",
          url: "https://images.kangayath.in/kasavu.webp",
          alt_text: "Kasavu Saree",
          is_primary: true,
          display_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
      variants: [],
    });
  });

  it("renders LocalBusiness ClothingStore JSON-LD in Customer Layout without price fields", () => {
    const { container } = render(
      <SavedItemsProvider>
        <ToastProvider>
          <CustomerLayout>
            <div>Test Child</div>
          </CustomerLayout>
        </ToastProvider>
      </SavedItemsProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThanOrEqual(1);

    const schemaContent = scripts[0].innerHTML;
    const parsed = JSON.parse(schemaContent);

    expect(parsed["@type"]).toBe("ClothingStore");
    expect(parsed.name).toBe("Kangayath");
    expect(parsed.address["@type"]).toBe("PostalAddress");

    // Zero-Price Guarantee: No price/offers in store schema
    expect(schemaContent.toLowerCase()).not.toContain('"offers"');
    expect(schemaContent.toLowerCase()).not.toContain('"price"');
  });

  it("renders Product and BreadcrumbList JSON-LD in Product Detail Page with Zero Price Guarantee", async () => {
    const { container } = render(
      <SavedItemsProvider>
        <ToastProvider>
          <ProductDetailPage />
        </ToastProvider>
      </SavedItemsProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Kasavu Festive Saree").length).toBeGreaterThanOrEqual(1);
    });

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThanOrEqual(2);

    const productSchema = JSON.parse(scripts[0].innerHTML);
    expect(productSchema["@type"]).toBe("Product");
    expect(productSchema.name).toBe("Kasavu Festive Saree");
    expect(productSchema.brand.name).toBe("Kangayath");

    // Zero Price Guarantee Check: strictly NO offers or price
    expect(productSchema.offers).toBeUndefined();
    expect(JSON.stringify(productSchema).toLowerCase()).not.toContain('"price"');
    expect(JSON.stringify(productSchema).toLowerCase()).not.toContain('"pricecurrency"');

    const breadcrumbSchema = JSON.parse(scripts[1].innerHTML);
    expect(breadcrumbSchema["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbSchema.itemListElement.length).toBe(4);
  });
});
