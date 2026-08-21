import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminCategoriesPage from "@/app/admin/categories/page";
import { ToastProvider } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  adminApi: {
    categories: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createSubcategory: vi.fn(),
      updateSubcategory: vi.fn(),
      deleteSubcategory: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, public code: string, message: string) {
      super(message);
    }
  },
}));

describe("Admin Categories Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(adminApi.categories.list).mockResolvedValue([
      {
        id: "cat-1",
        name: "Women Ethnic",
        slug: "women-ethnic",
        description: "Sarees and lehengas",
        thumbnail_url: null,
        display_order: 0,
        is_active: true,
        created_at: "2026-08-21T00:00:00Z",
        updated_at: "2026-08-21T00:00:00Z",
        subcategories: [
          {
            id: "sub-1",
            category_id: "cat-1",
            name: "Kanchipuram Silk",
            slug: "kanchipuram-silk",
            display_order: 0,
            is_active: true,
          },
        ],
      },
    ]);
  });

  it("renders category hierarchy with subcategories", async () => {
    render(
      <ToastProvider>
        <AdminCategoriesPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Taxonomy & Categories")).toBeInTheDocument();
      expect(screen.getByText("Women Ethnic")).toBeInTheDocument();
      expect(screen.getByText("Kanchipuram Silk")).toBeInTheDocument();
    });
  });
});
