"use client";

import * as React from "react";
import { Palette, Ruler, Plus, Edit2, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { SizeOption, ColorOption } from "@/types/api";

import useSWR from "swr";

export default function AdminAttributesPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = React.useState<"sizes" | "colors">("sizes");

  const { data: sizes = [], mutate: mutateSizes, isLoading: isSizesLoading } = useSWR(
    "admin-attributes-sizes",
    () => adminApi.attributes.listSizes().catch(() => [] as SizeOption[])
  );
  
  const { data: colors = [], mutate: mutateColors, isLoading: isColorsLoading } = useSWR(
    "admin-attributes-colors",
    () => adminApi.attributes.listColors().catch(() => [] as ColorOption[])
  );

  const loading = isSizesLoading || isColorsLoading;

  const refreshAttributes = () => {
    mutateSizes();
    mutateColors();
  };

  // Size Modal
  const [isSizeModalOpen, setIsSizeModalOpen] = React.useState(false);
  const [editingSize, setEditingSize] = React.useState<SizeOption | null>(null);
  const [sizeName, setSizeName] = React.useState("");
  const [sizeDisplayOrder, setSizeDisplayOrder] = React.useState("0");
  const [isSavingSize, setIsSavingSize] = React.useState(false);
  const [sizeToDelete, setSizeToDelete] = React.useState<SizeOption | null>(null);
  const [isDeletingSize, setIsDeletingSize] = React.useState(false);

  // Color Modal
  const [isColorModalOpen, setIsColorModalOpen] = React.useState(false);
  const [editingColor, setEditingColor] = React.useState<ColorOption | null>(null);
  const [colorName, setColorName] = React.useState("");
  const [colorHex, setColorHex] = React.useState("#651714");
  const [colorDisplayOrder, setColorDisplayOrder] = React.useState("0");
  const [isSavingColor, setIsSavingColor] = React.useState(false);
  const [colorToDelete, setColorToDelete] = React.useState<ColorOption | null>(null);
  const [isDeletingColor, setIsDeletingColor] = React.useState(false);

  // --- Size Handlers ---
  const openCreateSize = () => {
    setEditingSize(null);
    setSizeName("");
    setSizeDisplayOrder(sizes.length.toString());
    setIsSizeModalOpen(true);
  };

  const openEditSize = (s: SizeOption) => {
    setEditingSize(s);
    setSizeName(s.name);
    setSizeDisplayOrder(s.display_order.toString());
    setIsSizeModalOpen(true);
  };

  const handleSaveSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sizeName.trim()) return;

    try {
      setIsSavingSize(true);
      if (editingSize) {
        await adminApi.attributes.updateSize(editingSize.id, {
          name: sizeName.trim(),
          display_order: parseInt(sizeDisplayOrder, 10) || 0,
        });
        toast.success("Size Updated", `'${sizeName}' saved.`);
      } else {
        await adminApi.attributes.createSize({
          name: sizeName.trim(),
          display_order: parseInt(sizeDisplayOrder, 10) || 0,
        });
        toast.success("Size Added", `'${sizeName}' added to dictionary.`);
      }
      setIsSizeModalOpen(false);
      refreshAttributes();
    } catch (err: unknown) {
      toast.error("Failed to save size", (err as Error).message);
    } finally {
      setIsSavingSize(false);
    }
  };

  const handleDeleteSize = async () => {
    if (!sizeToDelete) return;
    try {
      setIsDeletingSize(true);
      await adminApi.attributes.deleteSize(sizeToDelete.id);
      toast.success("Size Deleted", `'${sizeToDelete.name}' removed.`);
      setSizeToDelete(null);
      refreshAttributes();
    } catch (err: unknown) {
      toast.error("Delete failed", (err as Error).message);
    } finally {
      setIsDeletingSize(false);
    }
  };

  // --- Color Handlers ---
  const openCreateColor = () => {
    setEditingColor(null);
    setColorName("");
    setColorHex("#651714");
    setColorDisplayOrder(colors.length.toString());
    setIsColorModalOpen(true);
  };

  const openEditColor = (c: ColorOption) => {
    setEditingColor(c);
    setColorName(c.name);
    setColorHex(c.hex_code);
    setColorDisplayOrder(c.display_order.toString());
    setIsColorModalOpen(true);
  };

  const handleSaveColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorName.trim() || !colorHex.trim()) return;

    try {
      setIsSavingColor(true);
      if (editingColor) {
        await adminApi.attributes.updateColor(editingColor.id, {
          name: colorName.trim(),
          hex_code: colorHex.trim(),
          display_order: parseInt(colorDisplayOrder, 10) || 0,
        });
        toast.success("Color Updated", `'${colorName}' saved.`);
      } else {
        await adminApi.attributes.createColor({
          name: colorName.trim(),
          hex_code: colorHex.trim(),
          display_order: parseInt(colorDisplayOrder, 10) || 0,
        });
        toast.success("Color Added", `'${colorName}' added to dictionary.`);
      }
      setIsColorModalOpen(false);
      refreshAttributes();
    } catch (err: unknown) {
      toast.error("Failed to save color", (err as Error).message);
    } finally {
      setIsSavingColor(false);
    }
  };

  const handleDeleteColor = async () => {
    if (!colorToDelete) return;
    try {
      setIsDeletingColor(true);
      await adminApi.attributes.deleteColor(colorToDelete.id);
      toast.success("Color Deleted", `'${colorToDelete.name}' removed.`);
      setColorToDelete(null);
      refreshAttributes();
    } catch (err: unknown) {
      toast.error("Delete failed", (err as Error).message);
    } finally {
      setIsDeletingColor(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Size & Color Attributes
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Maintain standard garment sizing and color swatches used across product matrices.
          </p>
        </div>

        {activeTab === "sizes" ? (
          <Button variant="primary" size="md" onClick={openCreateSize}>
            <Plus className="w-4 h-4" />
            <span>Add Standard Size</span>
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={openCreateColor}>
            <Plus className="w-4 h-4" />
            <span>Add Standard Color</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveTab("sizes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "sizes"
              ? "bg-burgundy text-white shadow-xs"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>Sizes Dictionary ({sizes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("colors")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "colors"
              ? "bg-burgundy text-white shadow-xs"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Colors & Swatches ({colors.length})</span>
        </button>
      </div>

      {/* Tab 1: Sizes List */}
      {activeTab === "sizes" && (
        <Card>
          <CardHeader className="border-b border-zinc-200">
            <CardTitle>Standard Size Labels</CardTitle>
            <CardDescription>
              Labels used to populate variation matrices (e.g. S, M, L, XL, 32, 34, Free Size).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600 text-xs uppercase font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-6">Size Name</th>
                  <th className="py-3 px-6">Display Order</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-zinc-500">
                      Loading sizes...
                    </td>
                  </tr>
                ) : sizes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-zinc-500">
                      No sizes registered.
                    </td>
                  </tr>
                ) : (
                  sizes.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-zinc-900">{s.name}</td>
                      <td className="py-3.5 px-6 font-mono text-xs text-zinc-500">{s.display_order}</td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditSize(s)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded"
                            title="Edit Size"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSizeToDelete(s)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                            title="Delete Size"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Colors List */}
      {activeTab === "colors" && (
        <Card>
          <CardHeader className="border-b border-zinc-200">
            <CardTitle>Color Palettes & Swatches</CardTitle>
            <CardDescription>
              Color definitions with hex codes for live showroom customer swatch rendering.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600 text-xs uppercase font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-6">Swatch Preview</th>
                  <th className="py-3 px-6">Color Name</th>
                  <th className="py-3 px-6">Hex Code</th>
                  <th className="py-3 px-6">Display Order</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Loading colors...
                    </td>
                  </tr>
                ) : colors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No colors registered.
                    </td>
                  </tr>
                ) : (
                  colors.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-6 h-6 rounded-full border border-zinc-300 shadow-xs"
                            style={{ backgroundColor: c.hex_code }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-zinc-900">{c.name}</td>
                      <td className="py-3.5 px-6 font-mono text-xs text-zinc-500">{c.hex_code}</td>
                      <td className="py-3.5 px-6 font-mono text-xs text-zinc-500">{c.display_order}</td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditColor(c)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded"
                            title="Edit Color"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setColorToDelete(c)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                            title="Delete Color"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Modal: Size Create / Edit */}
      <Modal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
        title={editingSize ? "Edit Size Option" : "Add Standard Size"}
        description="Standard size label for garments."
      >
        <form onSubmit={handleSaveSize} className="space-y-4">
          <Input
            label="Size Label"
            required
            placeholder="e.g., S, M, L, XL, XXL, 32, 34, Free Size"
            value={sizeName}
            onChange={(e) => setSizeName(e.target.value)}
          />

          <Input
            label="Display Sorting Order"
            type="number"
            value={sizeDisplayOrder}
            onChange={(e) => setSizeDisplayOrder(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <Button variant="outline" type="button" onClick={() => setIsSizeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSavingSize}>
              Save Size
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Color Create / Edit */}
      <Modal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        title={editingColor ? "Edit Color Swatch" : "Add Standard Color"}
        description="Color label and hex code for showroom swatch rendering."
      >
        <form onSubmit={handleSaveColor} className="space-y-4">
          <Input
            label="Color Name"
            required
            placeholder="e.g., Maroon, Navy Blue, Golden Yellow, Olive"
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700">
              Color Hex Code <span className="text-rose-600">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-10 h-10 rounded-lg border border-zinc-200 bg-white cursor-pointer p-0.5 shadow-xs"
              />
              <Input
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                placeholder="#651714"
                className="font-mono"
                required
              />
            </div>
          </div>

          <Input
            label="Display Sorting Order"
            type="number"
            value={colorDisplayOrder}
            onChange={(e) => setColorDisplayOrder(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <Button variant="outline" type="button" onClick={() => setIsColorModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSavingColor}>
              Save Color
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deletions */}
      <ConfirmModal
        isOpen={Boolean(sizeToDelete)}
        onClose={() => setSizeToDelete(null)}
        onConfirm={handleDeleteSize}
        title="Delete Size"
        message={`Are you sure you want to delete size '${sizeToDelete?.name}'?`}
        isLoading={isDeletingSize}
      />

      <ConfirmModal
        isOpen={Boolean(colorToDelete)}
        onClose={() => setColorToDelete(null)}
        onConfirm={handleDeleteColor}
        title="Delete Color"
        message={`Are you sure you want to delete color '${colorToDelete?.name}'?`}
        isLoading={isDeletingColor}
      />
    </div>
  );
}
