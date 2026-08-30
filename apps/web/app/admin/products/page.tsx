"use client";

import * as React from "react";
import Link from "next/link";
import {
  PlusCircle,
  Shirt,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";
import type { AdminProduct, Category, LifecycleState } from "@/types/api";

import useSWR from "swr";

export default function AdminProductsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [selectedLifecycle, setSelectedLifecycle] = React.useState<string>("");

  const [productToDelete, setProductToDelete] = React.useState<AdminProduct | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const toast = useToast();

  const { data: categories = [] } = useSWR("admin-categories", () =>
    adminApi.categories.list().catch(() => [] as Category[])
  );

  const { data: prodRes, mutate: mutateProducts, isLoading: isProductsLoading } = useSWR(
    ["admin-products", page, search, selectedCategory, selectedLifecycle],
    () => adminApi.products.list({
      page,
      page_size: 15,
      search: search || undefined,
      category_id: selectedCategory || undefined,
      lifecycle_state: (selectedLifecycle as LifecycleState) || undefined,
    }).catch(() => ({ 
      items: [] as AdminProduct[], 
      total: 0, 
      page: 1, 
      page_size: 15, 
      total_pages: 1,
      has_next: false,
      has_previous: false
    }))
  );

  const loading = !prodRes && isProductsLoading;
  const products = prodRes?.items || [];
  const totalPages = prodRes?.total_pages || 1;
  const totalCount = prodRes?.total || 0;

  const handleToggleSoldOut = async (product: AdminProduct) => {
    try {
      const nextState = !product.manual_sold_out;
      
      mutateProducts((current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map(p => p.id === product.id ? { ...p, manual_sold_out: nextState, is_available: !nextState } : p)
        };
      }, { revalidate: false });

      await adminApi.products.updateSoldOut(product.id, nextState);
      mutateProducts();
      
      toast.success(
        nextState ? "Marked as Sold Out" : "Restored In-Stock",
        `'${product.name}' availability updated.`
      );
    } catch (err: unknown) {
      mutateProducts();
      toast.error("Failed to update availability", (err as Error).message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await adminApi.products.delete(productToDelete.id);
      toast.success("Product Deleted", `'${productToDelete.name}' removed from catalog.`);
      setProductToDelete(null);
      mutateProducts();
    } catch (err: unknown) {
      toast.error("Delete failed", (err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedLifecycle("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Product Catalog</h1>
          <p className="text-sm text-zinc-600 mt-1">
            Manage garment inventory, images, sizes, colors, and live availability ({totalCount} items).
          </p>
        </div>

        <Link href="/admin/products/new">
          <Button variant="primary" size="md">
            <PlusCircle className="w-4 h-4" />
            <span>Add New Garment</span>
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            {/* Search Input */}
            <div className="w-full relative">
              <Input
                label="Search"
                placeholder="Name, material, style code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Category Dropdown */}
            <Select
              label="Category"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            {/* Lifecycle State Dropdown */}
            <Select
              label="Lifecycle State"
              value={selectedLifecycle}
              onChange={(e) => {
                setSelectedLifecycle(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All States</option>
              <option value="PUBLISHED">Published (Live)</option>
              <option value="DRAFT">Draft</option>
              <option value="HIDDEN">Hidden</option>
              <option value="ARCHIVED">Archived</option>
            </Select>

            {/* Reset Button */}
            <Button variant="outline" size="md" onClick={resetFilters} className="w-full">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Catalog Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600 text-xs uppercase font-semibold border-b border-zinc-200">
              <tr>
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6">Style Code</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Variants</th>
                <th className="py-4 px-6">State</th>
                <th className="py-4 px-6">Availability</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Loading catalog items...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No products found matching active filters.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const primaryImg = product.images.find((i) => i.is_primary)?.url || product.images[0]?.url;
                  return (
                    <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {primaryImg ? (
                              <img src={resolveImageUrl(primaryImg)} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Shirt className="w-5 h-5 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="font-semibold text-zinc-900 hover:text-burgundy transition-colors block"
                            >
                              {product.name}
                            </Link>
                            <span className="text-xs text-zinc-500">{product.material || "Textile"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Style Code */}
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs text-zinc-600">{product.style_code || "—"}</span>
                      </td>

                      {/* Taxonomy */}
                      <td className="py-4 px-6">
                        <span className="text-xs text-zinc-700 font-medium">
                          {product.subcategory?.name || "General"}
                        </span>
                      </td>

                      {/* Variants Count */}
                      <td className="py-4 px-6">
                        <span className="text-xs text-zinc-600 font-medium">
                          {product.variants.length} combinations
                        </span>
                      </td>

                      {/* Lifecycle */}
                      <td className="py-4 px-6">
                        <Badge
                          variant={
                            product.lifecycle_state === "PUBLISHED"
                              ? "success"
                              : product.lifecycle_state === "DRAFT"
                              ? "warning"
                              : product.lifecycle_state === "HIDDEN"
                              ? "neutral"
                              : "danger"
                          }
                        >
                          {product.lifecycle_state}
                        </Badge>
                      </td>

                      {/* Master Availability Toggle */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleSoldOut(product)}
                          className="group inline-flex items-center gap-1.5 focus:outline-none"
                          title="Click to toggle master sold-out override"
                        >
                          <Badge variant={product.is_available ? "success" : "danger"}>
                            {product.is_available ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{product.is_available ? "In Stock" : "Sold Out"}</span>
                          </Badge>
                        </button>
                      </td>

                      {/* Row Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/products/${product.id}`}>
                            <Button variant="outline" size="sm" title="Edit Product & Variants">
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Manage</span>
                            </Button>
                          </Link>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setProductToDelete(product)}
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200">
            <span className="text-xs text-zinc-500">
              Page {page} of {totalPages} ({totalCount} total garments)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Garment From Catalog"
        message={`Are you sure you want to permanently delete '${productToDelete?.name}'? All image attachments and variant matrix records will also be removed.`}
        confirmText="Permanently Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
