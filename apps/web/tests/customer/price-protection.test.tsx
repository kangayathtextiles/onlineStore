import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ProductCard } from "@/components/customer/product-card";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";
import type { PublicProductSummary } from "@/types/api";

describe("Customer Zero Price Protection Guarantee", () => {
  const sampleProduct: PublicProductSummary = {
    id: "prod-1",
    name: "Pure Silk Kanchipuram Saree",
    slug: "pure-silk-kanchipuram-saree",
    material: "100% Pure Mulberry Silk",
    style_code: "KAN-SILK-108",
    featured: true,
    is_available: true,
    primary_image_url: "https://images.kangayath.in/kanchipuram.webp",
    category_name: "Women Ethnic",
    category_slug: "women-ethnic",
    subcategory_name: "Silk Sarees",
    subcategory_slug: "silk-sarees",
    available_sizes: ["Free Size"],
    available_colors: ["Crimson Red", "Royal Blue"],
  };

  it("ensures ProductCard renders ZERO price, currency symbols, or cart/checkout terms", () => {
    const { container } = render(
      <ToastProvider>
        <SavedItemsProvider>
          <ProductCard product={sampleProduct} />
        </SavedItemsProvider>
      </ToastProvider>
    );

    const textContent = container.textContent || "";
    const lowerText = textContent.toLowerCase();

    // Must NOT contain currency signs
    expect(textContent).not.toContain("₹");
    expect(textContent).not.toContain("$");
    expect(textContent).not.toContain("€");
    expect(textContent).not.toContain("£");
    expect(lowerText).not.toContain("inr");
    expect(lowerText).not.toContain("price");
    expect(lowerText).not.toContain("cost");
    expect(lowerText).not.toContain("checkout");
    expect(lowerText).not.toContain("add to cart");
    expect(lowerText).not.toContain("buy now");
  });
});
