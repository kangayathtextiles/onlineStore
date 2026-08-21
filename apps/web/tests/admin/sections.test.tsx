import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminSectionsPage from "@/app/admin/sections/page";
import { ToastProvider } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  adminApi: {
    sections: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      reorderItems: vi.fn(),
      delete: vi.fn(),
    },
    products: {
      list: vi.fn(),
    },
  },
}));

describe("Admin Promotional Sections Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(adminApi.sections.list).mockResolvedValue([
      {
        id: "sec-1",
        title: "Festive Wedding Edit",
        slug: "festive-wedding-edit",
        subtitle: "Handcrafted bridal sets",
        banner_image_url: null,
        is_active: true,
        display_order: 0,
        created_at: "2026-08-21T00:00:00Z",
        updated_at: "2026-08-21T00:00:00Z",
        items: [],
      },
    ]);

    vi.mocked(adminApi.products.list).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 50,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });
  });

  it("renders promotional sections list and title", async () => {
    render(
      <ToastProvider>
        <AdminSectionsPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Promotional Custom Sections")).toBeInTheDocument();
      expect(screen.getByText("Festive Wedding Edit")).toBeInTheDocument();
      expect(screen.getByText("Handcrafted bridal sets")).toBeInTheDocument();
    });
  });
});
