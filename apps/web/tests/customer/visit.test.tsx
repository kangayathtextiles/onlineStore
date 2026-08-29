import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import VisitStorePage from "@/app/(customer)/visit/page";
import { ToastProvider } from "@/components/ui/toast";
import { publicApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  publicApi: {
    store: {
      getProfile: vi.fn(),
      getStatus: vi.fn(),
    },
  },
}));

describe("Customer Visit Store Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(publicApi.store.getProfile).mockResolvedValue({
      id: "store-1",
      name: "Kangayath Clothing & Textiles",
      tagline: "Exclusive Silk & Linen",
      phone_primary: "+91 98765 43210",
      phone_secondary: null,
      whatsapp_number: "+91 98765 43210",
      email: "info@kangayath.in",
      address_line1: "Main Road",
      address_line2: "Near Temple Gate",
      city: "Thrissur",
      state: "Kerala",
      pincode: "680001",
      latitude: 10.5276,
      longitude: 76.2144,
      google_maps_url: "https://maps.google.com/?q=kangayath",
      show_prices: true,
      schedules: [
        {
          day_of_week: "MONDAY",
          is_closed: false,
          open_time: "09:30",
          close_time: "21:00",
        },
      ],
      created_at: "2026-08-21T00:00:00Z",
      updated_at: "2026-08-21T00:00:00Z",
    });

    vi.mocked(publicApi.store.getStatus).mockResolvedValue({
      is_open: true,
      effective_mode: "AUTO",
      banner_message: null,
      today_schedule: {
        day_of_week: "MONDAY",
        is_closed: false,
        open_time: "09:30",
        close_time: "21:00",
      },
      current_time_ist: "2026-08-21T11:00:00+05:30",
      next_transition_time_ist: "2026-08-21T21:00:00+05:30",
    });
  });

  it("renders store visit details, open status, address, and weekly hours", async () => {
    render(
      <ToastProvider>
        <VisitStorePage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Visit Our Store in Thrissur/i)).toBeInTheDocument();
      expect(screen.getByText("OPEN NOW")).toBeInTheDocument();
      expect(screen.getByText("Kangayath Clothing & Textiles")).toBeInTheDocument();
      expect(screen.getByText("MONDAY")).toBeInTheDocument();
      expect(screen.getByText("09:30 – 21:00")).toBeInTheDocument();
    });
  });
});
