"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Grid,
  CheckCircle,
  XCircle,
  Star,
  Image as ImageIcon,
  Palette,
  UploadCloud,
  Link2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";
import type {
  AdminProduct,
  Category,
  ColorOption,
  LifecycleState,
  ProductImage,
  ProductVariant,
  SizeOption,
  SubcategorySummary,
} from "@/types/api";

export default function EditProductPage() {
  const params = useParams();
  const toast = useToast();
  const productId = params.id as string;

  const [product, setProduct] = React.useState<AdminProduct | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [subcategories, setSubcategories] = React.useState<SubcategorySummary[]>([]);
  const [sizes, setSizes] = React.useState<SizeOption[]>([]);
  const [colors, setColors] = React.useState<ColorOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSavingDetails, setIsSavingDetails] = React.useState(false);

  // Form State
  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [subcategoryId, setSubcategoryId] = React.useState("");
  const [material, setMaterial] = React.useState("");
  const [styleCode, setStyleCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [showPrice, setShowPrice] = React.useState(true);
  const [lifecycleState, setLifecycleState] = React.useState<LifecycleState>("DRAFT");
  const [metaTitle, setMetaTitle] = React.useState("");
  const [metaDescription, setMetaDescription] = React.useState("");

  // Modals
  const [isImageModalOpen, setIsImageModalOpen] = React.useState(false);
  const [uploadMode, setUploadMode] = React.useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [imageUrl, setImageUrl] = React.useState("");
  const [imageAlt, setImageAlt] = React.useState("");
  const [isPrimaryImage, setIsPrimaryImage] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [imageToDelete, setImageToDelete] = React.useState<ProductImage | null>(null);

  const [isMatrixModalOpen, setIsMatrixModalOpen] = React.useState(false);
  const [selectedSizeIds, setSelectedSizeIds] = React.useState<string[]>([]);
  const [selectedColorIds, setSelectedColorIds] = React.useState<string[]>([]);
  const [isGeneratingMatrix, setIsGeneratingMatrix] = React.useState(false);

  const [isSingleVariantModalOpen, setIsSingleVariantModalOpen] = React.useState(false);
  const [singleSizeId, setSingleSizeId] = React.useState("");
  const [singleColorId, setSingleColorId] = React.useState("");
  const [singleSku, setSingleSku] = React.useState("");
  const [isAddingVariant, setIsAddingVariant] = React.useState(false);

  const [variantToDelete, setVariantToDelete] = React.useState<ProductVariant | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [prod, cats, sizeList, colorList] = await Promise.all([
        adminApi.products.get(productId),
        adminApi.categories.list(),
        adminApi.attributes.listSizes(),
        adminApi.attributes.listColors(),
      ]);

      setProduct(prod);
      setName(prod.name);
      setCategoryId(prod.category_id);
      setSubcategoryId(prod.subcategory_id);
      setMaterial(prod.material || "");
      setStyleCode(prod.style_code || "");
      setDescription(prod.description || "");
      setPrice(prod.price !== null && prod.price !== undefined ? String(prod.price) : "");
      setShowPrice(prod.show_price !== undefined ? prod.show_price : true);
      setLifecycleState(prod.lifecycle_state);
      setMetaTitle(prod.meta_title || "");
      setMetaDescription(prod.meta_description || "");

      setCategories(cats);
      const currentCat = cats.find((c) => c.id === prod.category_id);
      if (currentCat) {
        setSubcategories(currentCat.subcategories);
      }

      setSizes(sizeList);
      setColors(colorList);
    } catch (err: unknown) {
      toast.error("Failed to load product", (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    const cat = categories.find((c) => c.id === selectedId);
    if (cat) {
      setSubcategories(cat.subcategories);
      if (cat.subcategories.length > 0) {
        setSubcategoryId(cat.subcategories[0].id);
      } else {
        setSubcategoryId("");
      }
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingDetails(true);
      const updated = await adminApi.products.update(productId, {
        category_id: categoryId,
        subcategory_id: subcategoryId,
        name: name.trim(),
        material: material.trim() || undefined,
        style_code: styleCode.trim() || undefined,
        description: description.trim() || undefined,
        price: price.trim() ? Number(price) : null,
        show_price: showPrice,
        lifecycle_state: lifecycleState,
        meta_title: metaTitle.trim() || undefined,
        meta_description: metaDescription.trim() || undefined,
      });
      setProduct(updated);
      toast.success("Product Saved", `'${updated.name}' details updated.`);
    } catch (err: unknown) {
      toast.error("Save failed", (err as Error).message);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleToggleMasterSoldOut = async (checked: boolean) => {
    try {
      const updated = await adminApi.products.updateSoldOut(productId, checked);
      setProduct(updated);
      toast.success(
        checked ? "Marked Sold Out" : "Restored In-Stock",
        `Master product override set to ${checked ? "Sold Out" : "Available"}.`
      );
    } catch (err: unknown) {
      toast.error("Toggle failed", (err as Error).message);
    }
  };

  // --- Image Handlers ---
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadMode === "file") {
      if (!selectedFile) {
        toast.error("Photo Required", "Please select or drop an image file from your device gallery.");
        return;
      }

      try {
        setIsUploadingImage(true);
        const updated = await adminApi.products.uploadImage(
          productId,
          selectedFile,
          isPrimaryImage,
          imageAlt.trim() || undefined
        );
        setProduct(updated);
        setIsImageModalOpen(false);
        setSelectedFile(null);
        setImageAlt("");
        setIsPrimaryImage(false);
        toast.success("Photo Uploaded", "Image successfully added to gallery.");
      } catch (err: unknown) {
        toast.error("Upload failed", (err as Error).message);
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      if (!imageUrl.trim()) {
        toast.error("URL Required", "Please enter a valid image URL.");
        return;
      }

      try {
        setIsUploadingImage(true);
        const updated = await adminApi.products.addImage(productId, {
          url: imageUrl.trim(),
          alt_text: imageAlt.trim() || undefined,
          is_primary: isPrimaryImage,
        });
        setProduct(updated);
        setIsImageModalOpen(false);
        setImageUrl("");
        setImageAlt("");
        setIsPrimaryImage(false);
        toast.success("Image Added", "Gallery updated.");
      } catch (err: unknown) {
        toast.error("Image addition failed", (err as Error).message);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    try {
      const updated = await adminApi.products.deleteImage(productId, imageToDelete.id);
      setProduct(updated);
      setImageToDelete(null);
      toast.success("Image Deleted", "Image removed from gallery.");
    } catch (err: unknown) {
      toast.error("Failed to delete image", (err as Error).message);
    }
  };

  const handleSetPrimaryImage = async (image: ProductImage) => {
    if (!product) return;
    try {
      const reordered = product.images.map((img) => ({
        image_id: img.id,
        display_order: img.display_order,
        is_primary: img.id === image.id,
      }));
      const updated = await adminApi.products.reorderImages(productId, reordered);
      setProduct(updated);
      toast.success("Primary Image Updated", "Set as thumbnail cover.");
    } catch (err: unknown) {
      toast.error("Failed to set primary image", (err as Error).message);
    }
  };

  // --- Variant Handlers ---
  const handleToggleVariantAvailability = async (variant: ProductVariant) => {
    try {
      const nextVal = !variant.is_available;
      const updated = await adminApi.products.updateVariantAvailability(productId, variant.id, {
        is_available: nextVal,
      });
      setProduct(updated);
      toast.success(
        nextVal ? "Variant In-Stock" : "Variant Sold Out",
        `${variant.size?.name || "Size"} / ${variant.color?.name || "Color"} is now ${nextVal ? "Available" : "Sold Out"}.`
      );
    } catch (err: unknown) {
      toast.error("Failed to update variant", (err as Error).message);
    }
  };

  const handleGenerateMatrix = async () => {
    if (selectedSizeIds.length === 0 || selectedColorIds.length === 0) {
      toast.error("Selection Required", "Please select at least 1 size and 1 color.");
      return;
    }

    try {
      setIsGeneratingMatrix(true);
      const updated = await adminApi.products.generateVariantMatrix(productId, {
        size_ids: selectedSizeIds,
        color_ids: selectedColorIds,
        default_available: true,
      });
      setProduct(updated);
      setIsMatrixModalOpen(false);
      setSelectedSizeIds([]);
      setSelectedColorIds([]);
      toast.success("Variant Matrix Generated", `${updated.variants.length} combinations created.`);
    } catch (err: unknown) {
      toast.error("Matrix generation failed", (err as Error).message);
    } finally {
      setIsGeneratingMatrix(false);
    }
  };

  const handleAddSingleVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleSizeId || !singleColorId) {
      toast.error("Incomplete Selection", "Please select both a Size and a Color.");
      return;
    }

    try {
      setIsAddingVariant(true);
      const updated = await adminApi.products.addVariant(productId, {
        size_id: singleSizeId,
        color_id: singleColorId,
        sku: singleSku.trim() || undefined,
        is_available: true,
      });
      setProduct(updated);
      setIsSingleVariantModalOpen(false);
      setSingleSizeId("");
      setSingleColorId("");
      setSingleSku("");
      toast.success("Variant Added", "Added to product inventory.");
    } catch (err: unknown) {
      toast.error("Failed to add variant", (err as Error).message);
    } finally {
      setIsAddingVariant(false);
    }
  };

  const handleDeleteVariant = async () => {
    if (!variantToDelete) return;
    try {
      const updated = await adminApi.products.deleteVariant(productId, variantToDelete.id);
      setProduct(updated);
      setVariantToDelete(null);
      toast.success("Variant Removed", "Combination deleted from product.");
    } catch (err: unknown) {
      toast.error("Failed to delete variant", (err as Error).message);
    }
  };

  if (loading || !product) {
    return (
      <div className="py-16 text-center text-zinc-500">
        <p>Loading garment details and variant inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{product.name}</h1>
              <Badge
                variant={
                  product.lifecycle_state === "PUBLISHED"
                    ? "success"
                    : product.lifecycle_state === "DRAFT"
                    ? "warning"
                    : "neutral"
                }
              >
                {product.lifecycle_state}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Style Code: <span className="font-mono text-zinc-700 font-semibold">{product.style_code || "N/A"}</span> •{" "}
              {product.subcategory?.name || "General"}
            </p>
          </div>
        </div>

        {/* Master Sold Out Toggle */}
        <div className="flex items-center gap-4 bg-white border border-zinc-200 px-4 py-2 rounded-xl shadow-xs">
          <Switch
            checked={product.manual_sold_out}
            onCheckedChange={handleToggleMasterSoldOut}
            label="Master Sold Out"
            description="Force entire product unavailable"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: General Metadata Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSaveDetails} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Garment Details</CardTitle>
                <CardDescription>Product title, fabric, taxonomy, and visibility.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Input
                  label="Title"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Select
                  label="Category"
                  required
                  value={categoryId}
                  onChange={handleCategoryChange}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Subcategory"
                  required
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                >
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. Linen, Silk, Cotton"
                />

                <Input
                  label="Style Code"
                  value={styleCode}
                  onChange={(e) => setStyleCode(e.target.value)}
                  placeholder="e.g. KURTA-101"
                />

                {/* Price & Display Price Visibility Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <Input
                    label="Product Price (₹)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 799"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    helperText="Optional retail display price"
                  />

                  <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 block">Show Price</span>
                      <span className="text-[11px] text-zinc-500 block">Visible on customer showroom</span>
                    </div>
                    <Switch
                      checked={showPrice}
                      onCheckedChange={setShowPrice}
                    />
                  </div>
                </div>

                <Textarea
                  label="Description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Fabric and styling notes..."
                />

                <Select
                  label="Lifecycle Status"
                  value={lifecycleState}
                  onChange={(e) => setLifecycleState(e.target.value as LifecycleState)}
                >
                  <option value="DRAFT">Draft (Hidden from public)</option>
                  <option value="PUBLISHED">Published (Live in showroom)</option>
                  <option value="HIDDEN">Hidden (Private archive)</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>

                <div className="pt-2">
                  <Button variant="primary" size="md" type="submit" isLoading={isSavingDetails} className="w-full">
                    <Save className="w-4 h-4" />
                    <span>Save Garment Details</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Right Column: Images & Variation Inventory */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Image Gallery</CardTitle>
                  <Badge variant={product.images.length >= 6 ? "danger" : "neutral"} className="text-xs">
                    {product.images.length} / 6 Max
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Display photos for customer showroom. Exactly one primary thumbnail.
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={product.images.length >= 6}
                onClick={() => setIsImageModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Add Image</span>
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              {product.images.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                  <ImageIcon className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-700 font-medium">No images uploaded yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Upload high quality garment photos (up to 6).</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Photo</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {product.images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative rounded-xl border border-zinc-200 bg-zinc-100 overflow-hidden aspect-[4/5] flex flex-col justify-between shadow-xs"
                    >
                      <img src={resolveImageUrl(img.url)} alt={img.alt_text || product.name} className="w-full h-full object-cover object-center" />

                      {/* Primary badge */}
                      {img.is_primary && (
                        <div className="absolute top-2 left-2 bg-burgundy/95 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 fill-current" />
                          <span>PRIMARY</span>
                        </div>
                      )}

                      {/* Action overlays */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        {!img.is_primary && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSetPrimaryImage(img)}
                            title="Make Primary Thumbnail"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setImageToDelete(img)}
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variant Matrix & Availability Grid */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Size & Color Variations</CardTitle>
                  <Badge variant="brand">{product.variants.length} combinations</Badge>
                </div>
                <CardDescription className="text-xs">
                  Manage independent in-stock / sold-out availability for each size and color pair.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsMatrixModalOpen(true)}
                  title="Generate combinatorial matrix"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Generate Matrix</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSingleVariantModalOpen(true)}
                  title="Add single variant"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Single Variant</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {product.variants.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 bg-zinc-50/50">
                  <Palette className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-zinc-700">No variations created yet</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Click &quot;Generate Matrix&quot; to pick your sizes and colors and automatically create all combinations.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsMatrixModalOpen(true)}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Generate Matrix (Sizes × Colors)</span>
                  </Button>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-600 text-xs uppercase font-semibold border-b border-zinc-200">
                    <tr>
                      <th className="py-3 px-6">Size</th>
                      <th className="py-3 px-6">Color</th>
                      <th className="py-3 px-6">SKU / Code</th>
                      <th className="py-3 px-6">Availability</th>
                      <th className="py-3 px-6 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {product.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                        {/* Size */}
                        <td className="py-3.5 px-6 font-semibold text-zinc-900">
                          {v.size?.name || "Free Size"}
                        </td>

                        {/* Color with visual swatch */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-zinc-300 shadow-xs flex-shrink-0"
                              style={{ backgroundColor: v.color?.hex_code || "#666" }}
                            />
                            <span className="text-xs text-zinc-700 font-medium">
                              {v.color?.name || "Standard"}
                            </span>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3.5 px-6 font-mono text-xs text-zinc-500">
                          {v.sku || "—"}
                        </td>

                        {/* 1-Click Availability Toggle */}
                        <td className="py-3.5 px-6">
                          <button
                            onClick={() => handleToggleVariantAvailability(v)}
                            className="group inline-flex items-center gap-1.5 focus:outline-none"
                            title="Click to toggle availability"
                          >
                            <Badge variant={v.is_available ? "success" : "danger"}>
                              {v.is_available ? (
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-rose-600" />
                              )}
                              <span>{v.is_available ? "In Stock" : "Sold Out"}</span>
                            </Badge>
                          </button>
                        </td>

                        {/* Delete Action */}
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => setVariantToDelete(v)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md transition-colors"
                            title="Remove combination"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Add Image */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setSelectedFile(null);
        }}
        title="Add Garment Photo"
        description="Select a photo directly from your device gallery or provide a CDN image URL."
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-zinc-100 border border-zinc-200 rounded-xl">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                uploadMode === "file"
                  ? "bg-burgundy text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>From Device Gallery</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                uploadMode === "url"
                  ? "bg-burgundy text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
          </div>

          <form onSubmit={handleAddImage} className="space-y-4">
            {uploadMode === "file" ? (
              <ImageUploader
                file={selectedFile}
                onFileSelect={setSelectedFile}
                disabled={isUploadingImage}
              />
            ) : (
              <Input
                label="Image URL (CDN / WebP)"
                required
                placeholder="https://images.kangayath.in/products/kasavu-front.webp"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={isUploadingImage}
              />
            )}

            <Input
              label="Alt Text / Caption (Optional)"
              placeholder="e.g., Kasavu Saree golden zari border detail"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              disabled={isUploadingImage}
            />

            <div className="pt-2">
              <Switch
                checked={isPrimaryImage}
                onCheckedChange={setIsPrimaryImage}
                label="Set as Primary Cover"
                description="Used as main thumbnail in showroom cards"
                disabled={isUploadingImage}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsImageModalOpen(false);
                  setSelectedFile(null);
                }}
                disabled={isUploadingImage}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isUploadingImage}
                disabled={uploadMode === "file" ? !selectedFile : !imageUrl.trim()}
              >
                {uploadMode === "file" ? "Upload Photo" : "Save Photo"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Generate Variant Matrix */}
      <Modal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        title="Generate Variant Matrix"
        description="Select available sizes and colors to generate a combinatorial inventory grid."
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Size Selectors */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">
              1. Select Sizes ({selectedSizeIds.length} chosen)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
              {sizes.map((s) => {
                const isSelected = selectedSizeIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setSelectedSizeIds((prev) =>
                        isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                      )
                    }
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-rose-50 border-burgundy text-burgundy font-semibold shadow-xs"
                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selectors */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">
              2. Select Colors ({selectedColorIds.length} chosen)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
              {colors.map((c) => {
                const isSelected = selectedColorIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setSelectedColorIds((prev) =>
                        isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                      )
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-rose-50 border-burgundy text-burgundy font-semibold shadow-xs"
                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
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

          {/* Calculation summary */}
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between text-xs">
            <span className="text-zinc-600">Total New Combinations:</span>
            <span className="font-bold text-burgundy text-sm">
              {selectedSizeIds.length * selectedColorIds.length} Variants
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
            <Button variant="outline" onClick={() => setIsMatrixModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerateMatrix}
              isLoading={isGeneratingMatrix}
              disabled={selectedSizeIds.length === 0 || selectedColorIds.length === 0}
            >
              Generate Grid
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add Single Variant */}
      <Modal
        isOpen={isSingleVariantModalOpen}
        onClose={() => setIsSingleVariantModalOpen(false)}
        title="Add Single Variation"
        description="Add a specific size and color combination."
      >
        <form onSubmit={handleAddSingleVariant} className="space-y-4">
          <Select
            label="Size"
            required
            value={singleSizeId}
            onChange={(e) => setSingleSizeId(e.target.value)}
          >
            <option value="">Select Size</option>
            {sizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          <Select
            label="Color"
            required
            value={singleColorId}
            onChange={(e) => setSingleColorId(e.target.value)}
          >
            <option value="">Select Color</option>
            {colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label="SKU / Tag (Optional)"
            placeholder="e.g., KAS-L-GOLD"
            value={singleSku}
            onChange={(e) => setSingleSku(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <Button variant="outline" type="button" onClick={() => setIsSingleVariantModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isAddingVariant}>
              Add Combination
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Image Confirmation */}
      <ConfirmModal
        isOpen={Boolean(imageToDelete)}
        onClose={() => setImageToDelete(null)}
        onConfirm={handleDeleteImage}
        title="Delete Photo"
        message="Are you sure you want to delete this photo from the garment gallery?"
      />

      {/* Delete Variant Confirmation */}
      <ConfirmModal
        isOpen={Boolean(variantToDelete)}
        onClose={() => setVariantToDelete(null)}
        onConfirm={handleDeleteVariant}
        title="Delete Variation"
        message={`Are you sure you want to remove '${variantToDelete?.size?.name || "Size"} / ${variantToDelete?.color?.name || "Color"}' combination?`}
      />
    </div>
  );
}
