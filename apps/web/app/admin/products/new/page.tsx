"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { Category, SubcategorySummary, LifecycleState } from "@/types/api";

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [subcategories, setSubcategories] = React.useState<SubcategorySummary[]>([]);
  const [loadingCats, setLoadingCats] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  // Validation
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    async function fetchTaxonomy() {
      try {
        setLoadingCats(true);
        const data = await adminApi.categories.list();
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id);
          setSubcategories(data[0].subcategories);
          if (data[0].subcategories.length > 0) {
            setSubcategoryId(data[0].subcategories[0].id);
          }
        }
      } catch (err: unknown) {
        toast.error("Failed to load categories", (err as Error).message);
      } finally {
        setLoadingCats(false);
      }
    }
    fetchTaxonomy();
  }, [toast]);

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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Garment name is required.";
    if (!categoryId) newErrors.categoryId = "Please select a Category.";
    if (!subcategoryId) newErrors.subcategoryId = "Please select a Subcategory.";
    if (price.trim() && (isNaN(Number(price)) || Number(price) < 0)) {
      newErrors.price = "Please enter a valid non-negative price.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const created = await adminApi.products.create({
        category_id: categoryId,
        subcategory_id: subcategoryId,
        name: name.trim(),
        material: material.trim() || undefined,
        style_code: styleCode.trim() || undefined,
        description: description.trim() || undefined,
        price: price.trim() ? Number(price) : undefined,
        show_price: showPrice,
        lifecycle_state: lifecycleState,
        meta_title: metaTitle.trim() || undefined,
        meta_description: metaDescription.trim() || undefined,
      });

      toast.success(
        "Garment Created Successfully",
        "Redirecting to product management workspace to configure images and variant matrix..."
      );
      router.push(`/admin/products/${created.id}`);
    } catch (err: unknown) {
      toast.error("Creation failed", (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Add New Garment</h1>
            <p className="text-xs text-zinc-500">Step 1: Enter product basic details and taxonomy</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Customer-facing name, fabric details, and categorization.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Product Name */}
            <Input
              label="Garment Title"
              placeholder="e.g., Traditional Kasavu Cotton Saree"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />

            {/* Category & Subcategory Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Category"
                required
                value={categoryId}
                onChange={handleCategoryChange}
                disabled={loadingCats}
                error={errors.categoryId}
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
                disabled={loadingCats || subcategories.length === 0}
                error={errors.subcategoryId}
              >
                {subcategories.length === 0 ? (
                  <option value="">No subcategories in this category</option>
                ) : (
                  subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))
                )}
              </Select>
            </div>

            {/* Material & Style Code Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Material / Fabric"
                placeholder="e.g., 100% Pure Handloom Cotton"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              />

              <Input
                label="Internal Style Code / Tag"
                placeholder="e.g., KASAVU-2024-01"
                value={styleCode}
                onChange={(e) => setStyleCode(e.target.value)}
              />
            </div>

            {/* Price & Display Price Visibility Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <Input
                label="Product Price (₹)"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 799"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={errors.price}
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

            {/* Description */}
            <Textarea
              label="Product Description & Styling Notes"
              placeholder="Provide fabric weave details, washing instructions, occasion suggestions..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Initial State */}
            <Select
              label="Initial Lifecycle Status"
              value={lifecycleState}
              onChange={(e) => setLifecycleState(e.target.value as LifecycleState)}
            >
              <option value="DRAFT">Draft (Not yet visible on customer showroom)</option>
              <option value="PUBLISHED">Published (Immediately visible to customers)</option>
              <option value="HIDDEN">Hidden (Archived in store records)</option>
            </Select>
          </CardContent>
        </Card>

        {/* SEO Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Social Meta Tags (Optional)</CardTitle>
            <CardDescription>Customize how this product appears on search engines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Meta Title"
              placeholder="e.g., Pure Kasavu Saree | Kangayath Clothing Store"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
            <Textarea
              label="Meta Description"
              placeholder="Brief summary for search engine snippets (under 160 characters)..."
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/products">
            <Button variant="outline" size="md" type="button" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
            <Save className="w-4 h-4" />
            <span>Create & Configure Variants</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
