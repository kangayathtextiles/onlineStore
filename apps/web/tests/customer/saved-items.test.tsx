import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SavedProductsPage from "@/app/(customer)/saved/page";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";
import { publicApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  publicApi: {
    store: {
      getProfile: vi.fn(),
    },
    savedItems: {
      checkAvailability: vi.fn(),
    },
  },
}));

describe("Customer Saved Products Page", () => {
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
      schedules: [],
      created_at: "2026-08-21T00:00:00Z",
      updated_at: "2026-08-21T00:00:00Z",
    });

    vi.mocked(publicApi.savedItems.checkAvailability).mockResolvedValue([]);
  });

  it("renders empty saved items placeholder when wishlist is empty", async () => {
    render(
      <ToastProvider>
        <SavedItemsProvider>
          <SavedProductsPage />
        </SavedItemsProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Your saved list is empty")).toBeInTheDocument();
      expect(screen.getByText("Browse Garment Showroom")).toBeInTheDocument();
    });
  });
});
