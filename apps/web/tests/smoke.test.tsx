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
        banner_message: null,
        today_schedule: null,
        current_time_ist: "2026-08-21T10:00:00+05:30",
        next_transition_time_ist: null,
      }),
      getProfile: vi.fn().mockResolvedValue({
        id: "store-1",
        name: "KANGAYATH",
        tagline: "Showroom",
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
      }),
    },
    categories: {
      list: vi.fn().mockResolvedValue([]),
    },
    sections: {
      list: vi.fn().mockResolvedValue([]),
    },
    products: {
      list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, page_size: 8, total_pages: 1, has_next: false, has_previous: false }),
    },
  },
}));

describe("Frontend Foundation Smoke Test", () => {
  it("renders the digital showroom customer homepage", async () => {
    render(
      <ToastProvider>
        <SavedItemsProvider>
          <CustomerHomePage />
        </SavedItemsProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Traditional Craft/i);
    });
  });
});
