"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Shirt,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/customer/product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { publicApi } from "@/lib/api";
import type {
  ColorOption,
  PublicCategoryTree,
  PublicProductSummary,
  SizeOption,
  SubcategorySummary,
} from "@/types/api";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state
  const initialCategory = searchParams.get("category") || "";
  const initialSubcategory = searchParams.get("subcategory") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialSizeId = searchParams.get("size_id") || "";
  const initialColorId = searchParams.get("color_id") || "";
  const initialAvailableOnly = searchParams.get("available_only") === "true";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  // Local filter state
  const [categorySlug, setCategorySlug] = React.useState(initialCategory);
  const [subcategorySlug, setSubcategorySlug] = React.useState(initialSubcategory);
  const [search, setSearch] = React.useState(initialSearch);
  const [selectedSizeId, setSelectedSizeId] = React.useState(initialSizeId);
  const [selectedColorId, setSelectedColorId] = React.useState(initialColorId);
  const [availableOnly, setAvailableOnly] = React.useState(initialAvailableOnly);
  const [page, setPage] = React.useState(initialPage);

  // Data state
  const [products, setProducts] = React.useState<PublicProductSummary[]>([]);
  const [categories, setCategories] = React.useState<PublicCategoryTree[]>([]);
  const [sizes, setSizes] = React.useState<SizeOption[]>([]);
  const [colors, setColors] = React.useState<ColorOption[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Mobile Filter Drawer
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Load Taxonomies & Attribute Dictionaries
  React.useEffect(() => {
    let isMounted = true;
    async function loadMetadata() {
      try {
        const [cats, sizeList, colorList] = await Promise.all([
          publicApi.categories.list().catch(() => []),
          publicApi.attributes.listSizes().catch(() => []),
          publicApi.attributes.listColors().catch(() => []),
        ]);
        if (isMounted) {
          setCategories(cats);
          setSizes(sizeList);
          setColors(colorList);
        }
      } catch {
        // Ignored
      }
    }
    loadMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Products based on filters
  const fetchProducts = React.useCallback(async (isMountedRef?: { current: boolean }) => {
    try {
      setLoading(true);
      const res = await publicApi.products.list({
        category: categorySlug || undefined,
        subcategory: subcategorySlug || undefined,
        size_id: selectedSizeId || undefined,
        color_id: selectedColorId || undefined,
        available_only: availableOnly ? true : undefined,
        search: search.trim() || undefined,
        page,
        page_size: 16,
      });

      if (!isMountedRef || isMountedRef.current) {
        setProducts(res.items);
        setTotalPages(res.total_pages);
        setTotalCount(res.total);
      }
    } catch {
      if (!isMountedRef || isMountedRef.current) {
        setProducts([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } finally {
      if (!isMountedRef || isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [categorySlug, subcategorySlug, selectedSizeId, selectedColorId, availableOnly, search, page]);

  React.useEffect(() => {
    const isMounted = { current: true };
    fetchProducts(isMounted);
    return () => {
      isMounted.current = false;
    };
  }, [fetchProducts]);

  // Derived subcategories for active category
  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const availableSubcategories: SubcategorySummary[] = activeCategory
    ? activeCategory.subcategories
    : [];

  const handleCategorySelect = (slug: string) => {
    setCategorySlug(slug);
    setSubcategorySlug("");
    setPage(1);
  };

  const handleResetFilters = () => {
    setCategorySlug("");
    setSubcategorySlug("");
    setSearch("");
    setSelectedSizeId("");
    setSelectedColorId("");
    setAvailableOnly(false);
    setPage(1);
    router.push("/products");
  };

  const activeFiltersCount = [
    Boolean(categorySlug),
    Boolean(subcategorySlug),
    Boolean(search),
    Boolean(selectedSizeId),
    Boolean(selectedColorId),
    Boolean(availableOnly),
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-5 sm:pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-burgundy">
            Digital Showroom Catalog
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 mt-1">
            All Garments
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-zinc-600 mt-1">
            Browse our store collections. Check size and color availability before visiting our shop.
          </p>
        </div>

        {/* Search Input & Mobile Filter Toggle */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, fabric, code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-burgundy focus:bg-white"
            />
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex-shrink-0 h-10 px-3.5"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && <Badge variant="brand">{activeFiltersCount}</Badge>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Column: Filter Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6 sticky top-28 bg-zinc-50/70 border border-zinc-200 p-6 rounded-2xl">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-burgundy hover:text-burgundy-700 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* In-Stock Only Switch */}
          <div className="pt-1 pb-3 border-b border-zinc-200">
            <Switch
              checked={availableOnly}
              onCheckedChange={(val) => {
                setAvailableOnly(val);
                setPage(1);
              }}
              label="In-Stock Items Only"
              description="Hide currently sold-out garments"
            />
          </div>

          {/* Department / Category Filter */}
          <div className="space-y-2 border-b border-zinc-200 pb-4">
            <label className="block text-xs font-semibold uppercase text-zinc-500">Department</label>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleCategorySelect("")}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  categorySlug === ""
                    ? "bg-burgundy text-white font-bold shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                All Departments
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    categorySlug === cat.slug
                      ? "bg-burgundy text-white font-bold shadow-xs"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-70">({cat.subcategories.length})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories (If Category selected) */}
          {availableSubcategories.length > 0 && (
            <div className="space-y-2 border-b border-zinc-200 pb-4">
              <label className="block text-xs font-semibold uppercase text-zinc-500">
                Subcategory
              </label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setSubcategorySlug("");
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    subcategorySlug === ""
                      ? "bg-zinc-200 text-zinc-900 font-bold"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  All {activeCategory?.name} Subcategories
                </button>
                {availableSubcategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSubcategorySlug(sub.slug);
                      setPage(1);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      subcategorySlug === sub.slug
                        ? "bg-zinc-200 text-zinc-900 font-bold"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Filter Chips */}
          {sizes.length > 0 && (
            <div className="space-y-2 border-b border-zinc-200 pb-4">
              <label className="block text-xs font-semibold uppercase text-zinc-500">Size</label>
              <div className="grid grid-cols-3 gap-1.5">
                {sizes.map((s) => {
                  const isSelected = selectedSizeId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSizeId(isSelected ? "" : s.id);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-burgundy border-burgundy text-white shadow-xs"
                          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Swatch Filters */}
          {colors.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase text-zinc-500">Color</label>
              <div className="grid grid-cols-2 gap-2">
                {colors.map((c) => {
                  const isSelected = selectedColorId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedColorId(isSelected ? "" : c.id);
                        setPage(1);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-rose-50 border-burgundy text-burgundy font-semibold"
                          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-zinc-300 flex-shrink-0"
                        style={{ backgroundColor: c.hex_code }}
                      />
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Right Column: Product Grid */}
        <main className="lg:col-span-3 space-y-6">
          {/* Active filters pill bar */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              Showing <span className="text-zinc-900 font-bold">{products.length}</span> of{" "}
              <span className="text-zinc-900 font-bold">{totalCount}</span> garments
            </span>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="py-20 text-center bg-zinc-50 rounded-3xl border border-zinc-200 p-8 space-y-4">
              <Shirt className="w-12 h-12 text-zinc-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-800">No matching garments found</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Try clearing some filters or searching for another fabric or garment style.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={handleResetFilters}>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              <span className="text-xs text-zinc-500 font-medium px-2">
                Page <span className="text-zinc-900 font-bold">{page}</span> of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 space-y-6 overflow-y-auto border-l border-zinc-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <span className="text-sm font-bold uppercase text-zinc-900">Filter Garments</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <Switch
              checked={availableOnly}
              onCheckedChange={(val) => {
                setAvailableOnly(val);
                setPage(1);
              }}
              label="In-Stock Only"
            />

            {/* Category Select */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase text-zinc-500">Department</label>
              <Select
                value={categorySlug}
                onChange={(e) => handleCategorySelect(e.target.value)}
              >
                <option value="">All Departments</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Subcategory Select */}
            {availableSubcategories.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase text-zinc-500">Subcategory</label>
                <Select
                  value={subcategorySlug}
                  onChange={(e) => {
                    setSubcategorySlug(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Subcategories</option>
                  {availableSubcategories.map((s) => (
                    <option key={s.id} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Sizes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase text-zinc-500">Sizes</label>
              <div className="grid grid-cols-3 gap-1.5">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSizeId(selectedSizeId === s.id ? "" : s.id);
                      setPage(1);
                    }}
                    className={`py-1.5 rounded-lg border text-xs font-semibold ${
                      selectedSizeId === s.id
                        ? "bg-burgundy text-white border-burgundy"
                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="w-1/2">
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-1/2"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center text-zinc-500">
          <p>Loading garments showroom...</p>
        </div>
      }
    >
      <ProductsContent />
    </React.Suspense>
  );
}
