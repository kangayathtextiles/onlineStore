"use client";

import * as React from "react";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  ListOrdered,
  Check,
  ArrowUp,
  ArrowDown,
  Shirt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { AdminProduct, AdminSection, CustomSectionItem } from "@/types/api";

export default function AdminSectionsPage() {
  const toast = useToast();
  const [sections, setSections] = React.useState<AdminSection[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Section Modal
  const [isSectionModalOpen, setIsSectionModalOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<AdminSection | null>(null);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [bannerImageUrl, setBannerImageUrl] = React.useState("");
  const [displayOrder, setDisplayOrder] = React.useState("0");
  const [isActive, setIsActive] = React.useState(true);
  const [isSavingSection, setIsSavingSection] = React.useState(false);

  // Curator Modal
  const [isCuratorOpen, setIsCuratorOpen] = React.useState(false);
  const [curatingSection, setCuratingSection] = React.useState<AdminSection | null>(null);
  const [curatedItems, setCuratedItems] = React.useState<CustomSectionItem[]>([]);
  const [catalogProducts, setCatalogProducts] = React.useState<AdminProduct[]>([]);
  const [catalogSearch, setCatalogSearch] = React.useState("");
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);

  // Deletion
  const [sectionToDelete, setSectionToDelete] = React.useState<AdminSection | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const loadSections = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.sections.list();
      setSections(data);
    } catch (err: unknown) {
      toast.error("Failed to load sections", (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadSections();
  }, [loadSections]);

  // --- Section Handlers ---
  const openCreateSection = () => {
    setEditingSection(null);
    setTitle("");
    setSlug("");
    setSubtitle("");
    setBannerImageUrl("");
    setDisplayOrder(sections.length.toString());
    setIsActive(true);
    setIsSectionModalOpen(true);
  };

  const openEditSection = (sec: AdminSection) => {
    setEditingSection(sec);
    setTitle(sec.title);
    setSlug(sec.slug);
    setSubtitle(sec.subtitle || "");
    setBannerImageUrl(sec.banner_image_url || "");
    setDisplayOrder(sec.display_order.toString());
    setIsActive(sec.is_active);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSavingSection(true);
      if (editingSection) {
        await adminApi.sections.update(editingSection.id, {
          title: title.trim(),
          slug: slug.trim() || undefined,
          subtitle: subtitle.trim() || undefined,
          banner_image_url: bannerImageUrl.trim() || undefined,
          display_order: parseInt(displayOrder, 10) || 0,
          is_active: isActive,
        });
        toast.success("Section Updated", `'${title}' updated.`);
      } else {
        await adminApi.sections.create({
          title: title.trim(),
          slug: slug.trim() || undefined,
          subtitle: subtitle.trim() || undefined,
          banner_image_url: bannerImageUrl.trim() || undefined,
          display_order: parseInt(displayOrder, 10) || 0,
          is_active: isActive,
        });
        toast.success("Section Created", `'${title}' created.`);
      }
      setIsSectionModalOpen(false);
      loadSections();
    } catch (err: unknown) {
      toast.error("Failed to save section", (err as Error).message);
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      setIsDeleting(true);
      await adminApi.sections.delete(sectionToDelete.id);
      toast.success("Section Deleted", `'${sectionToDelete.title}' removed.`);
      setSectionToDelete(null);
      loadSections();
    } catch (err: unknown) {
      toast.error("Delete failed", (err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Curator Handlers ---
  const openCurator = async (sec: AdminSection) => {
    setCuratingSection(sec);
    setCuratedItems([...sec.items]);
    setIsCuratorOpen(true);

    try {
      const res = await adminApi.products.list({ page: 1, page_size: 50 });
      setCatalogProducts(res.items);
    } catch {
      // Ignored
    }
  };

  const handleAddProductToCurator = (prod: AdminProduct) => {
    if (curatedItems.some((i) => i.product_id === prod.id)) {
      toast.info("Already Added", `'${prod.name}' is already in this section.`);
      return;
    }

    const primaryImg = prod.images.find((i) => i.is_primary)?.url || prod.images[0]?.url;
    const newItem: CustomSectionItem = {
      id: Math.random().toString(36).substring(2, 9),
      section_id: curatingSection?.id || "",
      product_id: prod.id,
      sort_order: curatedItems.length,
      created_at: new Date().toISOString(),
      product_name: prod.name,
      product_slug: prod.slug,
      product_image_url: primaryImg || null,
      is_available: prod.is_available,
    };

    setCuratedItems((prev) => [...prev, newItem]);
  };

  const handleRemoveFromCurator = (productId: string) => {
    setCuratedItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= curatedItems.length) return;

    const updated = [...curatedItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setCuratedItems(updated);
  };

  const handleSaveCuratedOrder = async () => {
    if (!curatingSection) return;

    try {
      setIsSavingOrder(true);
      const payload = curatedItems.map((item, idx) => ({
        product_id: item.product_id,
        sort_order: idx,
      }));

      await adminApi.sections.reorderItems(curatingSection.id, { items: payload });
      toast.success("Section Products Saved", "Curated showcase sequence updated.");
      setIsCuratorOpen(false);
      loadSections();
    } catch (err: unknown) {
      toast.error("Failed to save sequence", (err as Error).message);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const filteredCatalog = catalogProducts.filter((p) =>
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (p.material && p.material.toLowerCase().includes(catalogSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Promotional Custom Sections
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create arbitrary showcase collections (e.g. Festival Specials, New Arrivals, Wedding Edit).
          </p>
        </div>

        <Button variant="primary" size="md" onClick={openCreateSection}>
          <Plus className="w-4 h-4" />
          <span>New Custom Section</span>
        </Button>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-zinc-500">
            <p>Loading promotional sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-500">
              <Sparkles className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-300">No promotional sections created yet</p>
              <p className="text-xs text-zinc-500 mt-1">
                Create custom collections to feature on the customer homepage.
              </p>
              <Button variant="primary" size="sm" className="mt-4" onClick={openCreateSection}>
                <Plus className="w-4 h-4" />
                <span>Create Section</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          sections.map((sec) => (
            <Card key={sec.id} className="overflow-hidden border-zinc-800 bg-zinc-900/90">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  {sec.banner_image_url ? (
                    <div className="w-14 h-14 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
                      <img src={sec.banner_image_url} alt={sec.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-bold text-zinc-100">{sec.title}</h2>
                      <Badge variant={sec.is_active ? "success" : "neutral"} className="text-xs">
                        {sec.is_active ? "Active" : "Hidden"}
                      </Badge>
                      <Badge variant="brand" className="text-xs">
                        {sec.items.length} garments
                      </Badge>
                    </div>
                    {sec.subtitle && <p className="text-xs text-zinc-400 mt-0.5">{sec.subtitle}</p>}
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      slug: /{sec.slug} • order: {sec.display_order}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openCurator(sec)}
                    title="Pick and reorder garments in this section"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Curate Products</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditSection(sec)}
                    title="Edit section metadata"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setSectionToDelete(sec)}
                    title="Delete section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Section Create / Edit */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title={editingSection ? "Edit Promotional Section" : "Create Custom Section"}
        description="Promotional banner and collection showcase for customer showroom."
      >
        <form onSubmit={handleSaveSection} className="space-y-4">
          <Input
            label="Section Title"
            required
            placeholder="e.g., Onam Festival Collection, Monsoon Special"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label="Custom URL Slug (Optional)"
            placeholder="e.g., onam-special-offers"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />

          <Input
            label="Subtitle / Tagline (Optional)"
            placeholder="e.g., Handcrafted traditional silk and cotton sarees"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />

          <Input
            label="Banner Image URL (Optional)"
            placeholder="https://images.kangayath.in/banners/onam-festive.webp"
            value={bannerImageUrl}
            onChange={(e) => setBannerImageUrl(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input
              label="Display Order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />

            <div className="pt-6">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                label="Active on Showroom"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsSectionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSavingSection}>
              Save Section
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Curator (Pick & Reorder Products) */}
      <Modal
        isOpen={isCuratorOpen}
        onClose={() => setIsCuratorOpen(false)}
        title={`Curate Products: ${curatingSection?.title}`}
        description="Pick products from your catalog and adjust their display order in this showcase."
        maxWidth="3xl"
      >
        <div className="space-y-6">
          {/* Two column layout: Left (Curated list with order buttons), Right (Catalog picker) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Selected / Curated Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase text-zinc-400">
                  Assigned Products ({curatedItems.length})
                </h3>
              </div>

              <div className="border border-zinc-800 bg-zinc-950/60 rounded-xl p-3 max-h-[350px] overflow-y-auto space-y-2">
                {curatedItems.length === 0 ? (
                  <p className="py-8 text-center text-xs text-zinc-500">
                    No products added yet. Click &quot;+ Add&quot; from the catalog on the right.
                  </p>
                ) : (
                  curatedItems.map((item, index) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/90 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-zinc-500 w-4">{index + 1}.</span>
                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.product_image_url ? (
                            <img src={item.product_image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Shirt className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </div>
                        <span className="font-semibold text-zinc-200 truncate">{item.product_name}</span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveItem(index, "up")}
                          className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 rounded"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === curatedItems.length - 1}
                          onClick={() => handleMoveItem(index, "down")}
                          className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 rounded"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCurator(item.product_id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                          title="Remove from section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Catalog Product Search & Picker */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase text-zinc-400">Add From Catalog</h3>
              <Input
                placeholder="Search products to add..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />

              <div className="border border-zinc-800 bg-zinc-950/60 rounded-xl p-3 max-h-[300px] overflow-y-auto space-y-2">
                {filteredCatalog.length === 0 ? (
                  <p className="py-8 text-center text-xs text-zinc-500">No matching catalog items.</p>
                ) : (
                  filteredCatalog.map((prod) => {
                    const isAdded = curatedItems.some((i) => i.product_id === prod.id);
                    const primaryImg = prod.images.find((i) => i.is_primary)?.url || prod.images[0]?.url;
                    return (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {primaryImg ? (
                              <img src={primaryImg} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Shirt className="w-3.5 h-3.5 text-zinc-500" />
                            )}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-zinc-200 block truncate">{prod.name}</span>
                            <span className="text-[10px] text-zinc-500">{prod.material || "Garment"}</span>
                          </div>
                        </div>

                        <Button
                          variant={isAdded ? "secondary" : "outline"}
                          size="sm"
                          disabled={isAdded}
                          onClick={() => handleAddProductToCurator(prod)}
                          className="flex-shrink-0"
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="outline" onClick={() => setIsCuratorOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCuratedOrder} isLoading={isSavingOrder}>
              Save Curated Showcase
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Modal: Delete Section */}
      <ConfirmModal
        isOpen={Boolean(sectionToDelete)}
        onClose={() => setSectionToDelete(null)}
        onConfirm={handleDeleteSection}
        title="Delete Custom Section"
        message={`Are you sure you want to delete '${sectionToDelete?.title}'? The products in this collection will remain safe in your catalog.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
