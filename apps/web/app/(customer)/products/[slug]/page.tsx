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
import { ProductImage } from "@/components/ui/product-image";
import { ProductDetailSkeleton } from "@/components/ui/skeleton";
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
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [prodData, storeData] = await Promise.all([
          publicApi.products.getBySlug(slug),
          publicApi.store.getProfile().catch(() => null),
        ]);

        if (isMounted) {
          setProduct(prodData);
          setStore(storeData);

          // Pre-select first available variant or first size/color
          if (prodData.variants.length > 0) {
            const firstInStock =
              prodData.variants.find((v) => v.is_available) || prodData.variants[0];
            if (firstInStock.size_id) setSelectedSizeId(firstInStock.size_id);
            if (firstInStock.color_id) setSelectedColorId(firstInStock.color_id);
          }
        }
      } catch {
        if (isMounted) {
          setProduct(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return <ProductDetailSkeleton />;
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

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} at Kangayath digital showroom`,
    image: product.images.map((img) => img.url),
    sku: product.style_code || undefined,
    material: product.material || undefined,
    brand: {
      "@type": "Brand",
      name: "Kangayath",
    },
    category: product.category_name,
    ...(product.price !== null && product.price !== undefined && Number(product.price) > 0
      ? {
          offers: {
            "@type": "Offer",
            price: Number(product.price),
            priceCurrency: "INR",
            availability: product.is_available
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: process.env.NEXT_PUBLIC_SITE_URL || "https://kangayath.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catalog",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kangayath.in"}/products`,
      },
      ...(product.category_name
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.category_name,
              item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kangayath.in"}/products?category=${encodeURIComponent(
                product.category_slug || ""
              )}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: product.name,
              item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kangayath.in"}/products/${product.slug}`,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: product.name,
              item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kangayath.in"}/products/${product.slug}`,
            },
          ]),
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-24 sm:pb-12 space-y-8 sm:space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-zinc-500 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
        <Link href="/" className="hover:text-zinc-900 transition-colors flex-shrink-0">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-zinc-400 flex-shrink-0" />
        <Link href="/products" className="hover:text-zinc-900 transition-colors flex-shrink-0">
          Catalog
        </Link>
        {product.category_name && (
          <>
            <ChevronRight className="w-3 h-3 text-zinc-400 flex-shrink-0" />
            <Link
              href={`/products?category=${encodeURIComponent(product.category_slug || "")}`}
              className="hover:text-zinc-900 transition-colors flex-shrink-0 hidden sm:inline"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-zinc-400 flex-shrink-0" />
        <span className="text-zinc-900 font-semibold truncate max-w-[150px] sm:max-w-xs">
          {product.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Photo Container */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#F0EFED] border border-zinc-200/90 aspect-[4/5] flex items-center justify-center">
            <ProductImage
              src={currentImage?.url}
              alt={currentImage?.alt_text || product.name}
              aspectRatio="4/5"
              fit="cover"
              zoomOnHover={false}
              priority={true}
              containerClassName="w-full h-full"
            />

            {/* In-Stock / Sold-Out Badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
              <Badge
                variant={product.is_available ? "success" : "danger"}
                className="text-xs shadow-xs backdrop-blur-md bg-white/95 border border-zinc-200/60 font-semibold"
              >
                {product.is_available ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>{product.is_available ? "In Stock at Store" : "Currently Sold Out"}</span>
              </Badge>
            </div>
          </div>

          {/* Carousel Dots & Quick Actions Bar (Reference Image 3) */}
          <div className="flex items-center justify-between pt-1">
            {/* Carousel Dots Indicator */}
            {product.images.length > 1 ? (
              <div className="flex items-center gap-1.5">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`transition-all rounded-full ${
                      selectedImageIndex === idx
                        ? "w-4 h-2 bg-burgundy"
                        : "w-2 h-2 bg-zinc-300 hover:bg-zinc-400"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            ) : <div />}

            {/* Quick Actions (Heart & Share) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSave(summaryProduct)}
                className={`p-2 rounded-full border transition-all ${
                  saved
                    ? "bg-rose-50 border-rose-200 text-rose-600 shadow-xs"
                    : "bg-white border-zinc-200 text-zinc-600 hover:text-rose-600 hover:bg-zinc-50"
                }`}
                title={saved ? "Remove from wishlist" : "Save garment"}
              >
                <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
                title="Share garment link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thumbnail Gallery Strip (up to 6 photos) */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 sm:w-20 aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-[#F0EFED] ${
                    selectedImageIndex === idx
                      ? "border-burgundy shadow-xs ring-2 ring-burgundy/20"
                      : "border-zinc-200 opacity-70 hover:opacity-100 hover:border-zinc-300"
                  }`}
                >
                  <ProductImage
                    src={img.url}
                    alt=""
                    aspectRatio="4/5"
                    fit="cover"
                    zoomOnHover={false}
                    containerClassName="w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Garment Information & Sizing (5 cols) */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          {/* Header info */}
          <div className="space-y-2 border-b border-zinc-200 pb-5 sm:pb-6">
            <div className="flex items-center gap-2">
              {product.category_name && (
                <Badge variant="brand" className="text-[10px] sm:text-xs">
                  {product.category_name}
                </Badge>
              )}
              {product.subcategory_name && (
                <Badge variant="neutral" className="text-[10px] sm:text-xs">
                  {product.subcategory_name}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              {product.name}
            </h1>

            {/* Product Price (Rendered ONLY when visible) */}
            {product.price !== null && product.price !== undefined && Number(product.price) > 0 && (
              <div className="pt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-zinc-500 font-normal">
                  (Showroom Price)
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
              {product.material && (
                <span>
                  Fabric: <strong className="text-zinc-800">{product.material}</strong>
                </span>
              )}
              {product.style_code && (
                <span>
                  Style Code:{" "}
                  <strong className="font-mono text-zinc-800">{product.style_code}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Color Selection Cards (Reference Image 3) */}
          {uniqueColors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-700 font-medium">
                  Colour: <strong className="font-bold text-zinc-900">{selectedColorName}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {uniqueColors.map((c) => {
                  const isSelected = selectedColorId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColorId(c.id)}
                      className={`flex flex-col items-center p-2 rounded-2xl border-2 transition-all flex-shrink-0 bg-white ${
                        isSelected
                          ? "border-burgundy ring-2 ring-burgundy/20 shadow-xs"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <div className="w-16 aspect-[4/5] rounded-xl overflow-hidden bg-[#F0EFED] flex items-center justify-center mb-1.5 border border-zinc-200/60">
                        <span
                          className="w-6 h-6 rounded-full border border-zinc-300 shadow-xs flex-shrink-0"
                          style={{ backgroundColor: c.hex_code }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-semibold truncate max-w-[70px] ${
                          isSelected ? "text-burgundy" : "text-zinc-700"
                        }`}
                      >
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector Pills (Reference Image 3) */}
          {uniqueSizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-700 font-medium">
                  Size: <strong className="font-bold text-zinc-900">{selectedSizeName}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {uniqueSizes.map((s) => {
                  const isSelected = selectedSizeId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSizeId(s.id)}
                      className={`min-w-[48px] h-11 px-4 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-burgundy border-burgundy text-white shadow-xs scale-105"
                          : "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Variation Stock Status */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] sm:text-xs text-zinc-500 block">Stock Availability for:</span>
              <span className="text-xs font-bold text-zinc-900">
                {selectedSizeName} / {selectedColorName}
              </span>
            </div>

            <Badge variant={isVariantInStock ? "success" : "danger"} className="text-xs">
              {isVariantInStock ? (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>Available in Store</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-rose-600" />
                  <span>Sold Out</span>
                </>
              )}
            </Badge>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:block space-y-3 pt-2">
            {/* Direct WhatsApp Inquiry */}
            <a
              href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-all active:scale-[0.98]"
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
            <div className="space-y-2 border-t border-zinc-200 pt-5 sm:pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Garment Description
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Physical Store Notice Box */}
          <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 space-y-2.5 sm:space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
              <Store className="w-4 h-4 text-burgundy" />
              <span>Physical Retail Exclusive</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              We welcome you to visit our store in{" "}
              <strong className="text-zinc-900">
                {store?.city || store?.locality || store?.district || "Kangeyam"}
              </strong>{" "}
              to try this piece in our fitting rooms. All sales and billing are done at our retail counter.
            </p>
            <Link
              href="/visit"
              className="inline-flex items-center gap-1 text-xs font-semibold text-burgundy hover:text-burgundy-700"
            >
              <span>Get store directions & hours</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 sm:hidden shadow-lg flex items-center gap-2">
        <Button
          variant={saved ? "danger" : "outline"}
          size="sm"
          onClick={() => toggleSave(summaryProduct)}
          className="h-11 w-11 p-0 flex-shrink-0 rounded-xl"
          aria-label={saved ? "Remove from wishlist" : "Save for later"}
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
        </Button>
        <a
          href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs shadow-xs"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Inquire on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
