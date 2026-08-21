"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Heart,
  MessageCircle,
  CheckCircle,
  XCircle,
  Shirt,
  ChevronRight,
  Store,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSavedItems } from "@/lib/saved-items-context";
import { publicApi } from "@/lib/api";
import type {
  ColorOption,
  PublicProductDetail,
  PublicProductSummary,
  SizeOption,
  StoreProfile,
} from "@/types/api";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isSaved, toggleSave } = useSavedItems();

  const [product, setProduct] = React.useState<PublicProductDetail | null>(null);
  const [store, setStore] = React.useState<StoreProfile | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [selectedSizeId, setSelectedSizeId] = React.useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copiedLink, setCopiedLink] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodData, storeData] = await Promise.all([
          publicApi.products.getBySlug(slug),
          publicApi.store.getProfile().catch(() => null),
        ]);

        setProduct(prodData);
        setStore(storeData);

        // Pre-select first available variant or first size/color
        if (prodData.variants.length > 0) {
          const firstInStock = prodData.variants.find((v) => v.is_available) || prodData.variants[0];
          if (firstInStock.size_id) setSelectedSizeId(firstInStock.size_id);
          if (firstInStock.color_id) setSelectedColorId(firstInStock.color_id);
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-500">
        <p>Loading garment details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <Shirt className="w-12 h-12 text-zinc-600 mx-auto" />
        <h1 className="text-2xl font-bold text-zinc-200">Garment Not Found</h1>
        <p className="text-xs text-zinc-400">
          The requested garment might have been archived or is no longer available in the showroom.
        </p>
        <Link href="/products">
          <Button variant="primary" size="sm">
            <span>Browse All Garments</span>
          </Button>
        </Link>
      </div>
    );
  }

  // Derive unique sizes and colors from variants
  const uniqueSizes: SizeOption[] = [];
  const uniqueColors: ColorOption[] = [];

  product.variants.forEach((v) => {
    if (v.size && !uniqueSizes.some((s) => s.id === v.size?.id)) {
      uniqueSizes.push(v.size);
    }
    if (v.color && !uniqueColors.some((c) => c.id === v.color?.id)) {
      uniqueColors.push(v.color);
    }
  });

  // Evaluate matching variant availability
  const matchingVariant = product.variants.find(
    (v) =>
      (!selectedSizeId || v.size_id === selectedSizeId) &&
      (!selectedColorId || v.color_id === selectedColorId)
  );

  const isVariantInStock =
    product.is_available && (matchingVariant ? matchingVariant.is_available : false);

  const selectedSizeName =
    uniqueSizes.find((s) => s.id === selectedSizeId)?.name || "Standard Size";
  const selectedColorName =
    uniqueColors.find((c) => c.id === selectedColorId)?.name || "Standard Color";

  const currentImage = product.images[selectedImageIndex] || product.images[0];

  // Convert detail to summary for save toggle
  const summaryProduct: PublicProductSummary = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    material: product.material,
    style_code: product.style_code,
    featured: product.featured,
    is_available: product.is_available,
    primary_image_url: product.images[0]?.url || null,
    category_name: product.category_name,
    category_slug: product.category_slug,
    subcategory_name: product.subcategory_name,
    subcategory_slug: product.subcategory_slug,
    available_sizes: uniqueSizes.map((s) => s.name),
    available_colors: uniqueColors.map((c) => c.name),
  };

  const saved = isSaved(product.id);

  const whatsappPhone = store?.whatsapp_number
    ? store.whatsapp_number.replace(/[^0-9]/g, "")
    : "919876543210";

  const whatsappMessage = encodeURIComponent(
    `Hello Kangayath! I am inquiring about "${product.name}" (Style Code: ${
      product.style_code || "N/A"
    }) in Size: ${selectedSizeName}, Color: ${selectedColorName}. Is this piece available for trial at your retail store?`
  );

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/" className="hover:text-zinc-100 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-zinc-600" />
        <Link href="/products" className="hover:text-zinc-100 transition-colors">
          Catalog
        </Link>
        {product.category_name && (
          <>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <Link
              href={`/products?category=${encodeURIComponent(product.category_slug || "")}`}
              className="hover:text-zinc-100 transition-colors"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-zinc-600" />
        <span className="text-zinc-200 font-semibold truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Photo Container */}
          <div className="relative rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 aspect-[3/4] flex items-center justify-center">
            {currentImage ? (
              <img
                src={currentImage.url}
                alt={currentImage.alt_text || product.name}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="text-center text-zinc-600 p-8 space-y-2">
                <Shirt className="w-16 h-16 stroke-1 mx-auto" />
                <p className="text-xs text-zinc-500 font-medium">Garment photo coming soon</p>
              </div>
            )}

            {/* In-Stock / Sold-Out Badge */}
            <div className="absolute top-4 left-4">
              <Badge
                variant={product.is_available ? "success" : "danger"}
                className="text-xs shadow-lg backdrop-blur-md bg-zinc-950/80"
              >
                {product.is_available ? (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-rose-400" />
                )}
                <span>{product.is_available ? "In Stock at Store" : "Currently Sold Out"}</span>
              </Badge>
            </div>
          </div>

          {/* Thumbnail Gallery Strip (up to 6 photos) */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-zinc-950 ${
                    selectedImageIndex === idx
                      ? "border-rose-400 shadow-glow"
                      : "border-zinc-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Garment Information & Sizing (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Header info */}
          <div className="space-y-2 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-2">
              {product.category_name && (
                <Badge variant="brand" className="text-xs">
                  {product.category_name}
                </Badge>
              )}
              {product.subcategory_name && (
                <Badge variant="neutral" className="text-xs">
                  {product.subcategory_name}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
              {product.material && (
                <span>
                  Fabric: <strong className="text-zinc-200">{product.material}</strong>
                </span>
              )}
              {product.style_code && (
                <span>
                  Style Code:{" "}
                  <strong className="font-mono text-zinc-200">{product.style_code}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Size Selectors */}
          {uniqueSizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Select Size
                </label>
                <span className="text-xs text-rose-300 font-semibold">{selectedSizeName}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {uniqueSizes.map((s) => {
                  const isSelected = selectedSizeId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSizeId(s.id)}
                      className={`min-w-[48px] px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-burgundy text-white border-burgundy shadow-sm scale-105"
                          : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Swatch Selectors */}
          {uniqueColors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Select Color
                </label>
                <span className="text-xs text-rose-300 font-semibold">{selectedColorName}</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {uniqueColors.map((c) => {
                  const isSelected = selectedColorId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColorId(c.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-zinc-800 border-rose-400 text-rose-200 shadow-sm scale-105"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-zinc-600 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: c.hex_code }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Variation Stock Status */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 block">Stock Availability for:</span>
              <span className="text-xs font-bold text-zinc-200">
                {selectedSizeName} / {selectedColorName}
              </span>
            </div>

            <Badge variant={isVariantInStock ? "success" : "danger"} className="text-xs">
              {isVariantInStock ? (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span>Available in Store</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-rose-400" />
                  <span>Sold Out</span>
                </>
              )}
            </Badge>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            {/* Direct WhatsApp Inquiry */}
            <a
              href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Inquire & Reserve on WhatsApp</span>
            </a>

            {/* Save to Wishlist & Share */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={saved ? "danger" : "outline"}
                size="md"
                onClick={() => toggleSave(summaryProduct)}
                className="w-full"
              >
                <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
                <span>{saved ? "Saved in Wishlist" : "Save for Later"}</span>
              </Button>

              <Button variant="outline" size="md" onClick={handleCopyLink} className="w-full">
                <Share2 className="w-4 h-4" />
                <span>{copiedLink ? "Link Copied!" : "Share Garment"}</span>
              </Button>
            </div>
          </div>

          {/* Description & Fabric Details */}
          {product.description && (
            <div className="space-y-2 border-t border-zinc-800 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Garment Description
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Physical Store Notice Box */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Store className="w-4 h-4 text-rose-400" />
              <span>Physical Retail Exclusive</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We welcome you to visit our store in{" "}
              <strong className="text-zinc-200">{store?.city || "Thrissur"}</strong> to try this piece
              in our fitting rooms. All sales and billing are done at our retail counter.
            </p>
            <Link
              href="/visit"
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300"
            >
              <span>Get store directions & hours</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
