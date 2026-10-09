import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { StoreProvider, useStore, useStoreStatus } from "@/lib/store-context";
import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerMobileNav } from "@/components/customer/mobile-nav";
import CustomerHomePage from "@/app/(customer)/page";
import VisitStorePage from "@/app/(customer)/visit/page";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";
import { publicApi } from "@/lib/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  publicApi: {
    store: {
      getStatus: vi.fn(),
      getProfile: vi.fn(),
    },
    categories: {
      list: vi.fn().mockResolvedValue([]),
    },
    sections: {
      list: vi.fn().mockResolvedValue([]),
    },
    products: {
      list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    },
    savedItems: {
      sync: vi.fn().mockResolvedValue({}),
      checkAvailability: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("Store Status Persistence, Navigation & Resilience Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Deduplicates simultaneous calls across Navbar, MobileNav, and HomePage", async () => {
    const mockStatus = {
      is_open: true,
      effective_mode: "AUTO",
      banner_message: "Festive discount live",
      today_schedule: {
        day_of_week: "MONDAY",
        is_closed: false,
        open_time: "09:30",
        close_time: "20:30",
      },
      current_time_ist: "2026-10-09 10:00:00 AM IST",
    };

    const mockProfile = {
      id: "store-1",
      name: "Kangayath Clothing & Textiles",
      city: "Palakkad",
      locality: "Kalkandi",
      district: "Palakkad",
      state: "Kerala",
      pincode: "678591",
      primary_phone: "+91 94470 00000",
      phone_primary: "+91 94470 00000",
      whatsapp_number: "+91 94470 00000",
      schedules: [],
      show_prices: false,
    };

    vi.mocked(publicApi.store.getStatus).mockResolvedValue(mockStatus as any);
    vi.mocked(publicApi.store.getProfile).mockResolvedValue(mockProfile as any);

    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 30000 }}>
        <StoreProvider>
          <ToastProvider>
            <SavedItemsProvider>
              <CustomerNavbar />
              <CustomerMobileNav />
              <CustomerHomePage />
            </SavedItemsProvider>
          </ToastProvider>
        </StoreProvider>
      </SWRConfig>
    );

    await waitFor(() => {
      expect(screen.getByText("STORE OPEN")).toBeInTheDocument();
      expect(screen.getByText(/Physical Store is OPEN NOW in/i)).toBeInTheDocument();
    });

    // Exactly 1 call to getStatus and 1 to getProfile despite 3 consumer components mounting
    expect(publicApi.store.getStatus).toHaveBeenCalledTimes(1);
    expect(publicApi.store.getProfile).toHaveBeenCalledTimes(1);
  });

  it("2. Prevents false-closed flickering during slow API responses", async () => {
    let resolveSlowStatus!: (val: any) => void;
    const slowStatusPromise = new Promise((resolve) => {
      resolveSlowStatus = resolve;
    });

    vi.mocked(publicApi.store.getStatus).mockReturnValue(slowStatusPromise as any);
    vi.mocked(publicApi.store.getProfile).mockResolvedValue({
      id: "store-1",
      name: "Kangayath",
      city: "Kalkandi",
    } as any);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <StoreProvider>
          <SavedItemsProvider>
            <CustomerNavbar />
          </SavedItemsProvider>
        </StoreProvider>
      </SWRConfig>
    );

    // While response is in-flight, it should NEVER render "STORE CLOSED"
    expect(screen.queryByText("STORE CLOSED")).toBeNull();
    // It renders neutral "STORE HOURS" placeholder
    expect(screen.getByText("STORE HOURS")).toBeInTheDocument();

    // Now resolve the promise as OPEN
    resolveSlowStatus({
      is_open: true,
      effective_mode: "AUTO",
      current_time_ist: "2026-10-09 11:00:00 AM IST",
    });

    await waitFor(() => {
      expect(screen.getByText("STORE OPEN")).toBeInTheDocument();
      expect(screen.queryByText("STORE HOURS")).toBeNull();
    });
  });

  it("3. Handles failed API response gracefully without false-closed alarm", async () => {
    vi.mocked(publicApi.store.getStatus).mockRejectedValue(new Error("Network Gateway Timeout"));
    vi.mocked(publicApi.store.getProfile).mockRejectedValue(new Error("Network Gateway Timeout"));

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <StoreProvider>
          <SavedItemsProvider>
            <CustomerNavbar />
          </SavedItemsProvider>
        </StoreProvider>
      </SWRConfig>
    );

    // When the status fetch fails, it must NOT falsely show "STORE CLOSED"
    await waitFor(() => {
      expect(screen.queryByText("STORE CLOSED")).toBeNull();
      expect(screen.getByText("STORE HOURS")).toBeInTheDocument();
    });
  });

  it("4. Preserves store status across simulated navigation between Home and Visit", async () => {
    const mockStatus = {
      is_open: true,
      effective_mode: "AUTO",
      current_time_ist: "2026-10-09 11:00:00 AM IST",
      today_schedule: {
        day_of_week: "MONDAY",
        is_closed: false,
        open_time: "09:30",
        close_time: "20:30",
      },
    };

    const mockProfile = {
      id: "store-1",
      name: "Kangayath Clothing & Textiles",
      city: "Kalkandi",
      locality: "Kalkandi",
      district: "Palakkad",
      state: "Kerala",
      pincode: "678591",
      primary_phone: "+91 94470 00000",
      schedules: [
        {
          day_of_week: "MONDAY",
          is_closed: false,
          open_time: "09:30",
          close_time: "20:30",
        },
      ],
      show_prices: false,
    };

    vi.mocked(publicApi.store.getStatus).mockResolvedValue(mockStatus as any);
    vi.mocked(publicApi.store.getProfile).mockResolvedValue(mockProfile as any);

    // Shared SWR cache representing the application session
    const sharedCache = new Map();

    // 1. Visit Home Page
    const { unmount: unmountHome } = render(
      <SWRConfig value={{ provider: () => sharedCache, dedupingInterval: 60000 }}>
        <StoreProvider>
          <ToastProvider>
            <SavedItemsProvider>
              <CustomerHomePage />
            </SavedItemsProvider>
          </ToastProvider>
        </StoreProvider>
      </SWRConfig>
    );

    await waitFor(() => {
      expect(screen.getByText(/Physical Store is OPEN NOW in/i)).toBeInTheDocument();
    });

    unmountHome();

    // 2. Navigate to Visit Page (Store Hours)
    const { unmount: unmountVisit } = render(
      <SWRConfig value={{ provider: () => sharedCache, dedupingInterval: 60000 }}>
        <StoreProvider>
          <ToastProvider>
            <VisitStorePage />
          </ToastProvider>
        </StoreProvider>
      </SWRConfig>
    );

    // Renders INSTANTLY from cache without full page blocking loader
    expect(screen.getByText("OPEN NOW")).toBeInTheDocument();
    expect(screen.getByText("Kangayath Clothing & Textiles")).toBeInTheDocument();

    unmountVisit();

    // 3. Navigate back to Home Page
    render(
      <SWRConfig value={{ provider: () => sharedCache, dedupingInterval: 60000 }}>
        <StoreProvider>
          <ToastProvider>
            <SavedItemsProvider>
              <CustomerHomePage />
            </SavedItemsProvider>
          </ToastProvider>
        </StoreProvider>
      </SWRConfig>
    );

    // Instant status display with ZERO false-closed flickering
    expect(screen.queryByText(/Physical Store in .* is CLOSED/i)).toBeNull();
    expect(screen.getByText(/Physical Store is OPEN NOW in/i)).toBeInTheDocument();

    // Verification: getStatus was NOT called a second or third time during navigation
    expect(publicApi.store.getStatus).toHaveBeenCalledTimes(1);
  });
});
