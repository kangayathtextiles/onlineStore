"use client";

import * as React from "react";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { adminApi, ApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";
import type { Category, SubcategorySummary } from "@/types/api";

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedCats, setExpandedCats] = React.useState<Record<string, boolean>>({});

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [catName, setCatName] = React.useState("");
  const [catSlug, setCatSlug] = React.useState("");
  const [catDescription, setCatDescription] = React.useState("");
  const [catThumbnail, setCatThumbnail] = React.useState("");
  const [catDisplayOrder, setCatDisplayOrder] = React.useState("0");
  const [catIsActive, setCatIsActive] = React.useState(true);
  const [catShowPrices, setCatShowPrices] = React.useState(true);
  const [isSavingCat, setIsSavingCat] = React.useState(false);

  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = React.useState(false);
  const [editingSubcategory, setEditingSubcategory] = React.useState<SubcategorySummary | null>(null);
  const [targetParentCatId, setTargetParentCatId] = React.useState("");
  const [subName, setSubName] = React.useState("");
  const [subSlug, setSubSlug] = React.useState("");
  const [subDisplayOrder, setSubDisplayOrder] = React.useState("0");
  const [subIsActive, setSubIsActive] = React.useState(true);
  const [isSavingSub, setIsSavingSub] = React.useState(false);

  // Deletions
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [isDeletingCat, setIsDeletingCat] = React.useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = React.useState<SubcategorySummary | null>(null);
  const [isDeletingSub, setIsDeletingSub] = React.useState(false);

  const loadCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.categories.list();
      setCategories(data);
      // Auto expand all
      const expanded: Record<string, boolean> = {};
      data.forEach((c) => (expanded[c.id] = true));
      setExpandedCats(expanded);
    } catch (err: unknown) {
      toast.error("Failed to load categories", (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // --- Category Handlers ---
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatDescription("");
    setCatThumbnail("");
    setCatDisplayOrder("0");
    setCatIsActive(true);
    setCatShowPrices(true);
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description || "");
    setCatThumbnail(cat.thumbnail_url || "");
    setCatDisplayOrder(cat.display_order.toString());
    setCatIsActive(cat.is_active);
    setCatShowPrices(cat.show_prices !== undefined ? cat.show_prices : true);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      setIsSavingCat(true);
      if (editingCategory) {
        await adminApi.categories.update(editingCategory.id, {
          name: catName.trim(),
          slug: catSlug.trim() || undefined,
          description: catDescription.trim() || undefined,
          thumbnail_url: catThumbnail.trim() || undefined,
          display_order: parseInt(catDisplayOrder, 10) || 0,
          is_active: catIsActive,
          show_prices: catShowPrices,
        });
        toast.success("Category Updated", `'${catName}' updated.`);
      } else {
        await adminApi.categories.create({
          name: catName.trim(),
          slug: catSlug.trim() || undefined,
          description: catDescription.trim() || undefined,
          thumbnail_url: catThumbnail.trim() || undefined,
          display_order: parseInt(catDisplayOrder, 10) || 0,
          is_active: catIsActive,
          show_prices: catShowPrices,
        });
        toast.success("Category Created", `'${catName}' added.`);
      }
      setIsCategoryModalOpen(false);
      loadCategories();
    } catch (err: unknown) {
      toast.error("Category save failed", (err as Error).message);
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeletingCat(true);
      await adminApi.categories.delete(categoryToDelete.id);
      toast.success("Category Deleted", `'${categoryToDelete.name}' removed.`);
      setCategoryToDelete(null);
      loadCategories();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error(
          "Cannot Delete Category",
          "This category has active subcategories or assigned products. Please delete or reassign them first."
        );
      } else {
        toast.error("Delete failed", (err as Error).message);
      }
    } finally {
      setIsDeletingCat(false);
    }
  };

  // --- Subcategory Handlers ---
  const openCreateSubcategory = (parentCatId: string) => {
    setEditingSubcategory(null);
    setTargetParentCatId(parentCatId);
    setSubName("");
    setSubSlug("");
    setSubDisplayOrder("0");
    setSubIsActive(true);
    setIsSubcategoryModalOpen(true);
  };

  const openEditSubcategory = (sub: SubcategorySummary) => {
    setEditingSubcategory(sub);
    setTargetParentCatId(sub.category_id);
    setSubName(sub.name);
    setSubSlug(sub.slug);
    setSubDisplayOrder(sub.display_order.toString());
    setSubIsActive(sub.is_active);
    setIsSubcategoryModalOpen(true);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !targetParentCatId) return;

    try {
      setIsSavingSub(true);
      if (editingSubcategory) {
        await adminApi.categories.updateSubcategory(editingSubcategory.id, {
          name: subName.trim(),
          slug: subSlug.trim() || undefined,
          display_order: parseInt(subDisplayOrder, 10) || 0,
          is_active: subIsActive,
        });
        toast.success("Subcategory Updated", `'${subName}' saved.`);
      } else {
        await adminApi.categories.createSubcategory({
          category_id: targetParentCatId,
          name: subName.trim(),
          slug: subSlug.trim() || undefined,
          display_order: parseInt(subDisplayOrder, 10) || 0,
          is_active: subIsActive,
        });
        toast.success("Subcategory Created", `'${subName}' added.`);
      }
      setIsSubcategoryModalOpen(false);
      loadCategories();
    } catch (err: unknown) {
      toast.error("Subcategory save failed", (err as Error).message);
    } finally {
      setIsSavingSub(false);
    }
  };

  const handleDeleteSubcategory = async () => {
    if (!subcategoryToDelete) return;
    try {
      setIsDeletingSub(true);
      await adminApi.categories.deleteSubcategory(subcategoryToDelete.id);
      toast.success("Subcategory Deleted", `'${subcategoryToDelete.name}' removed.`);
      setSubcategoryToDelete(null);
      loadCategories();
    } catch (err: unknown) {
      toast.error(
        "Cannot Delete Subcategory",
        (err as Error).message || "Products are currently linked to this subcategory."
      );
    } finally {
      setIsDeletingSub(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Taxonomy & Categories
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Organize main clothing sections and unlimited subcategories for customer discovery.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={openCreateCategory}>
          <Plus className="w-4 h-4" />
          <span>New Main Category</span>
        </Button>
      </div>

      {/* Categories Tree */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-zinc-500">
            <p>Loading category hierarchy...</p>
          </div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-500">
              <FolderTree className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-700">No categories found</p>
              <p className="text-xs text-zinc-500 mt-1">Create your first main category (e.g. Men, Women, Kids).</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={openCreateCategory}>
                <Plus className="w-4 h-4" />
                <span>Create Main Category</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          categories.map((cat) => {
            const isExpanded = Boolean(expandedCats[cat.id]);
            return (
              <Card key={cat.id} className="overflow-hidden border-zinc-200 bg-white shadow-xs">
                {/* Category Header Row */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-zinc-50 border-b border-zinc-200">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-900 transition-colors"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>

                    <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {cat.thumbnail_url ? (
                        <img src={resolveImageUrl(cat.thumbnail_url)} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <FolderTree className="w-5 h-5 text-burgundy" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-zinc-900 truncate">{cat.name}</h2>
                        <Badge variant={cat.is_active ? "success" : "neutral"} className="text-[10px]">
                          {cat.is_active ? "Active" : "Hidden"}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">
                        /{cat.slug} • {cat.subcategories.length} subcategories
                      </p>
                    </div>
                  </div>

                  {/* Actions for Category */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openCreateSubcategory(cat.id)}
                      title="Add subcategory to this category"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Sub</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditCategory(cat)}
                      title="Edit category settings"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setCategoryToDelete(cat)}
                      title="Delete category (RESTRICT guard enabled)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Subcategories List */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-zinc-50/50">
                    {cat.subcategories.length === 0 ? (
                      <div className="py-4 text-center text-xs text-zinc-500">
                        No subcategories yet. Click &quot;Add Sub&quot; above to create one.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cat.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 transition-colors shadow-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-zinc-900 truncate">{sub.name}</span>
                                {!sub.is_active && (
                                  <Badge variant="neutral" className="text-[9px] py-0 px-1">
                                    Hidden
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-500 font-mono block truncate">
                                /{sub.slug}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => openEditSubcategory(sub)}
                                className="p-1 text-zinc-400 hover:text-zinc-700 rounded"
                                title="Edit Subcategory"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSubcategoryToDelete(sub)}
                                className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                                title="Delete Subcategory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Modal: Category Create / Edit */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Create Main Category"}
        description="Main catalog department visible to showroom customers."
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Category Name"
            required
            placeholder="e.g., Men, Women, Kids, Festive"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />

          <Input
            label="Custom URL Slug (Optional)"
            placeholder="e.g., festive-collection"
            value={catSlug}
            onChange={(e) => setCatSlug(e.target.value)}
            helperText="Leave blank to automatically slugify from title"
          />

          <Input
            label="Thumbnail Image URL (Optional)"
            placeholder="https://images.kangayath.in/categories/women.webp"
            value={catThumbnail}
            onChange={(e) => setCatThumbnail(e.target.value)}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Brief summary of what this department contains..."
            rows={2}
            value={catDescription}
            onChange={(e) => setCatDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input
              label="Display Order"
              type="number"
              value={catDisplayOrder}
              onChange={(e) => setCatDisplayOrder(e.target.value)}
            />

            <div className="pt-6">
              <Switch
                checked={catIsActive}
                onCheckedChange={setCatIsActive}
                label="Active in Showroom"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
            <div>
              <span className="text-xs font-semibold text-zinc-900 block">Show Product Prices</span>
              <span className="text-[11px] text-zinc-500 block">Display prices for products in this category</span>
            </div>
            <Switch
              checked={catShowPrices}
              onCheckedChange={setCatShowPrices}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <Button variant="outline" type="button" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSavingCat}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Subcategory Create / Edit */}
      <Modal
        isOpen={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        title={editingSubcategory ? "Edit Subcategory" : "Create Subcategory"}
        description="Sub-department grouping specific garments."
      >
        <form onSubmit={handleSaveSubcategory} className="space-y-4">
          <Select
            label="Parent Category"
            required
            value={targetParentCatId}
            onChange={(e) => setTargetParentCatId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label="Subcategory Name"
            required
            placeholder="e.g., Casual Shirts, Silk Sarees, Dhotis"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
          />

          <Input
            label="Custom URL Slug (Optional)"
            placeholder="e.g., silk-sarees"
            value={subSlug}
            onChange={(e) => setSubSlug(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input
              label="Display Order"
              type="number"
              value={subDisplayOrder}
              onChange={(e) => setSubDisplayOrder(e.target.value)}
            />

            <div className="pt-6">
              <Switch
                checked={subIsActive}
                onCheckedChange={setSubIsActive}
                label="Active Status"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <Button variant="outline" type="button" onClick={() => setIsSubcategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSavingSub}>
              Save Subcategory
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal: Delete Category */}
      <ConfirmModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Main Category"
        message={`Are you sure you want to delete '${categoryToDelete?.name}'? If active subcategories or products are linked, the database will reject deletion to prevent broken links.`}
        confirmText="Confirm Deletion"
        isLoading={isDeletingCat}
      />

      {/* Confirm Modal: Delete Subcategory */}
      <ConfirmModal
        isOpen={Boolean(subcategoryToDelete)}
        onClose={() => setSubcategoryToDelete(null)}
        onConfirm={handleDeleteSubcategory}
        title="Delete Subcategory"
        message={`Are you sure you want to delete '${subcategoryToDelete?.name}'? If products belong to this subcategory, delete or reassign those products first.`}
        confirmText="Delete Subcategory"
        isLoading={isDeletingSub}
      />
    </div>
  );
}
