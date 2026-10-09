import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import * as React from "react";
import { SearchAutocomplete } from "@/components/customer/search-autocomplete";
import { publicApi } from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  publicApi: {
    products: {
      list: vi.fn(),
    },
  },
}));

describe("Search Autocomplete & Product Suggestions Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(publicApi.products.list).mockResolvedValue({
      items: [
        {
          id: "prod-1",
          name: "Kasavu Silk Shirt",
          slug: "kasavu-silk-shirt",
          material: "Mulberry Silk",
          style_code: "KASAVU-001",
          featured: true,
          is_available: true,
          primary_image_url: null,
          category_name: "Men",
          category_slug: "men",
          subcategory_name: "Shirts",
          subcategory_slug: "shirts",
          available_sizes: ["M", "L"],
          available_colors: ["Maroon"],
        },
        {
          id: "prod-2",
          name: "Kasavu Cotton Dhoti",
          slug: "kasavu-cotton-dhoti",
          material: "Pure Cotton",
          style_code: "DHOTI-002",
          featured: false,
          is_available: false,
          primary_image_url: null,
          category_name: "Men",
          category_slug: "men",
          subcategory_name: "Dhotis",
          subcategory_slug: "dhotis",
          available_sizes: ["Free Size"],
          available_colors: ["Cream"],
        },
      ],
      total: 2,
      page: 1,
      page_size: 5,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    });
  });

  function Wrapper({ initialValue = "" }: { initialValue?: string }) {
    const [val, setVal] = React.useState(initialValue);
    return <SearchAutocomplete value={val} onChange={setVal} />;
  }

  it("1. Does not show suggestions dropdown when query is less than 2 characters", async () => {
    render(<Wrapper initialValue="k" />);

    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("k");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("2. Fetches and displays suggestions when typing >= 2 characters", async () => {
    render(<Wrapper initialValue="" />);

    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Kasavu" } });
    });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByText("Kasavu Silk Shirt")).toBeInTheDocument();
      expect(screen.getByText("Kasavu Cotton Dhoti")).toBeInTheDocument();
    });

    expect(screen.getByText("Mulberry Silk")).toBeInTheDocument();
    expect(screen.getByText("In Stock")).toBeInTheDocument();
    expect(screen.getByText("Sold Out")).toBeInTheDocument();
  });

  it("3. Navigates to product detail page when suggestion is clicked", async () => {
    render(<Wrapper initialValue="" />);

    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Kasavu" } });
    });

    await waitFor(() => {
      expect(screen.getByText("Kasavu Silk Shirt")).toBeInTheDocument();
    });

    const suggestion = screen.getByText("Kasavu Silk Shirt");
    fireEvent.click(suggestion);

    expect(mockPush).toHaveBeenCalledWith("/products/kasavu-silk-shirt");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("4. Supports keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)", async () => {
    render(<Wrapper initialValue="" />);

    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Kasavu" } });
    });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    // Press ArrowDown to highlight first item
    await act(async () => {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    });
    const option1 = screen.getByRole("option", { name: /Kasavu Silk Shirt/i });
    await waitFor(() => {
      expect(option1).toHaveAttribute("aria-selected", "true");
    });

    // Press ArrowDown to highlight second item
    await act(async () => {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    });
    const option2 = screen.getByRole("option", { name: /Kasavu Cotton Dhoti/i });
    await waitFor(() => {
      expect(option2).toHaveAttribute("aria-selected", "true");
    });

    // Press Enter to select second item
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(mockPush).toHaveBeenCalledWith("/products/kasavu-cotton-dhoti");
  });

  it("5. Closes dropdown when Escape is pressed", async () => {
    render(<Wrapper initialValue="" />);

    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Kasavu" } });
    });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("6. Displays empty state message when no garments match", async () => {
    vi.mocked(publicApi.products.list).mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      page_size: 5,
      total_pages: 0,
      has_next: false,
      has_previous: false,
    });

    render(<Wrapper initialValue="" />);

    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "NonExistentWeave" } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No garments matching/i)).toBeInTheDocument();
    });
  });

  it("7. Clears input and closes dropdown when Clear (X) button is clicked", async () => {
    render(<Wrapper initialValue="" />);

    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Kasavu" } });
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Clear search input")).toBeInTheDocument();
    });

    const clearBtn = screen.getByLabelText("Clear search input");
    fireEvent.click(clearBtn);

    expect(input).toHaveValue("");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
