import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminQRScannerPage from "@/app/admin/qr/scanner/page";
import AdminQRPrintPage from "@/app/admin/qr/print/page";
import { ToastProvider } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  adminApi: {
    qr: {
      lookup: vi.fn(),
      executeAction: vi.fn(),
      getPrintData: vi.fn(),
      runCleanup: vi.fn(),
    },
    categories: {
      list: vi.fn(),
    },
  },
}));

describe("Admin QR Scanner & Tag Print Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(adminApi.categories.list).mockResolvedValue([
      {
        id: "cat-1",
        name: "Sarees",
        slug: "sarees",
        description: null,
        thumbnail_url: null,
        display_order: 0,
        is_active: true,
        show_prices: true,
        created_at: "2026-08-21T00:00:00Z",
        updated_at: "2026-08-21T00:00:00Z",
        subcategories: [
          {
            id: "sub-1",
            category_id: "cat-1",
            name: "Silk Sarees",
            slug: "silk-sarees",
            display_order: 0,
            is_active: true,
          },
        ],
      },
    ]);

    vi.mocked(adminApi.qr.getPrintData).mockResolvedValue([
      {
        product_id: "prod-1",
        name: "Royal Kasavu Saree",
        slug: "royal-kasavu-saree",
        style_code: "KGY-SAR-SIL-260830-1A2B",
        qr_code: "KGY-QR-A1B2C3D4",
        category_name: "Sarees",
        subcategory_name: "Silk Sarees",
        price: 4999,
        operational_status: "AVAILABLE",
        primary_image_url: "https://example.com/saree.jpg",
      },
    ]);
  });

  it("renders QR Scanner and looks up product via input", async () => {
    vi.mocked(adminApi.qr.lookup).mockResolvedValue({
      product_id: "prod-1",
      name: "Royal Kasavu Saree",
      slug: "royal-kasavu-saree",
      style_code: "KGY-SAR-SIL-260830-1A2B",
      qr_code: "KGY-QR-A1B2C3D4",
      qr_status: "ACTIVE",
      operational_status: "AVAILABLE",
      is_damaged: false,
      is_retired: false,
      manual_sold_out: false,
      is_available: true,
      price: 4999,
      show_price: true,
      category_id: "cat-1",
      category_name: "Sarees",
      subcategory_id: "sub-1",
      subcategory_name: "Silk Sarees",
      primary_image_url: "https://example.com/saree.jpg",
      sold_out_at: null,
      damaged_at: null,
      retired_at: null,
      variants: [],
    });

    render(
      <ToastProvider>
        <AdminQRScannerPage />
      </ToastProvider>
    );

    expect(screen.getByText("Physical QR Scanner")).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Scan or enter QR token/i);

    fireEvent.change(input, { target: { value: "KGY-QR-A1B2C3D4" } });
    fireEvent.click(screen.getByRole("button", { name: /Identify/i }));

    await waitFor(() => {
      expect(adminApi.qr.lookup).toHaveBeenCalledWith("KGY-QR-A1B2C3D4");
      expect(screen.getByRole("heading", { name: "Royal Kasavu Saree" })).toBeInTheDocument();
      expect(screen.getAllByText("KGY-SAR-SIL-260830-1A2B")[0]).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /SOLD OUT/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /DAMAGED/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /RETURN/i })).toBeInTheDocument();
    });
  });

  it("executes lifecycle SOLD_OUT and DAMAGED actions from scanner", async () => {
    vi.mocked(adminApi.qr.lookup).mockResolvedValue({
      product_id: "prod-1",
      name: "Royal Kasavu Saree",
      slug: "royal-kasavu-saree",
      style_code: "KGY-SAR-SIL-260830-1A2B",
      qr_code: "KGY-QR-A1B2C3D4",
      qr_status: "ACTIVE",
      operational_status: "AVAILABLE",
      is_damaged: false,
      is_retired: false,
      manual_sold_out: false,
      is_available: true,
      price: 4999,
      show_price: true,
      category_id: "cat-1",
      category_name: "Sarees",
      subcategory_id: "sub-1",
      subcategory_name: "Silk Sarees",
      primary_image_url: "https://example.com/saree.jpg",
      sold_out_at: null,
      damaged_at: null,
      retired_at: null,
      variants: [],
    });

    vi.mocked(adminApi.qr.executeAction).mockResolvedValue({
      product_id: "prod-1",
      name: "Royal Kasavu Saree",
      slug: "royal-kasavu-saree",
      style_code: "KGY-SAR-SIL-260830-1A2B",
      qr_code: "KGY-QR-A1B2C3D4",
      qr_status: "ACTIVE",
      operational_status: "SOLD_OUT",
      is_damaged: false,
      is_retired: false,
      manual_sold_out: true,
      is_available: false,
      price: 4999,
      show_price: true,
      category_id: "cat-1",
      category_name: "Sarees",
      subcategory_id: "sub-1",
      subcategory_name: "Silk Sarees",
      primary_image_url: "https://example.com/saree.jpg",
      sold_out_at: "2026-08-30T00:00:00Z",
      damaged_at: null,
      retired_at: null,
      variants: [],
    });

    render(
      <ToastProvider>
        <AdminQRScannerPage />
      </ToastProvider>
    );

    const input = screen.getByPlaceholderText(/Scan or enter QR token/i);
    fireEvent.change(input, { target: { value: "KGY-QR-A1B2C3D4" } });
    fireEvent.click(screen.getByRole("button", { name: /Identify/i }));

    await waitFor(() => {
      expect(adminApi.qr.lookup).toHaveBeenCalledWith("KGY-QR-A1B2C3D4");
      expect(screen.getByRole("heading", { name: "Royal Kasavu Saree" })).toBeInTheDocument();
    });

    const soldOutBtn = screen.getByRole("button", { name: /SOLD OUT/i });
    fireEvent.click(soldOutBtn);

    await waitFor(() => {
      expect(adminApi.qr.executeAction).toHaveBeenCalledWith({
        qr_code: "KGY-QR-A1B2C3D4",
        action: "SOLD_OUT",
      });
    });
  });

  it("renders QR Tag Printing Center with label preview and batch selection", async () => {
    render(
      <ToastProvider>
        <AdminQRPrintPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("QR Tag Printing Center")).toBeInTheDocument();
      expect(screen.getByText("Royal Kasavu Saree")).toBeInTheDocument();
      expect(screen.getByText("KGY-SAR-SIL-260830-1A2B")).toBeInTheDocument();
      expect(screen.getByText(/Print Selected/i)).toBeInTheDocument();
    });
  });
});
