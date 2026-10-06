"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/product-image";
import { useSavedItems } from "@/lib/saved-items-context";
import type { PublicProductSummary } from "@/types/api";

interface ProductCardProps {
  product: PublicProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isSaved, toggleSave } = useSavedItems();
  const saved = isSaved(product.id);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(product);
  };

  const colors = product.available_colors || [];
  const sizes = product.available_sizes || [];

  return (
    <div className="group relative rounded-2xl border border-amber-950/10 bg-white hover:border-burgundy/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Aspect 3:4 / 4:5 Responsive Fashion Image Canvas */}
        <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full overflow-hidden bg-[#F7F4EF] flex items-center justify-center">
          <ProductImage
            src={product.primary_image_url}
            alt={product.name}
            aspectRatio="3/4"
            fit="cover"
            zoomOnHover={true}
            containerClassName="w-full h-full"
          />

          {/* Quick Save Heart Button */}
          <button
            type="button"
            onClick={handleSaveClick}
            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-xs active:scale-90 ${
              saved
                ? "bg-rose-50/95 text-rose-600 border border-rose-200 scale-105"
                : "bg-white/90 text-zinc-600 hover:text-rose-600 border border-amber-950/10 hover:bg-white"
            }`}
            title={saved ? "Remove from saved" : "Save garment"}
            aria-label={saved ? "Remove from saved items" : "Save this garment"}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                saved ? "fill-rose-600 text-rose-600" : ""
              }`}
            />
          </button>

          {/* Floating Stock Status Badge (Bottom-Left) */}
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <Badge
              variant={product.is_available ? "success" : "danger"}
              className="text-xs px-2.5 py-1 rounded-full shadow-xs backdrop-blur-md bg-white/95 border border-amber-950/10 font-medium flex items-center gap-1.5"
            >
              {product.is_available ? (
                <CheckCircle className="w-3 h-3 text-emerald-600" />
              ) : (
                <XCircle className="w-3 h-3 text-rose-600" />
              )}
              <span>{product.is_available ? "In Stock" : "Sold Out"}</span>
            </Badge>
          </div>

          {/* Floating Color Swatch Counter Pill (Bottom-Right) */}
          {colors.length > 0 && (
            <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-950/10 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-gold inline-block" />
              <span className="text-xs font-medium text-zinc-700">{colors.length}</span>
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="p-3.5 sm:p-4 space-y-1.5 bg-white">
          {/* Category / Subcategory hierarchy */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-burgundy uppercase tracking-wider">
            <span className="truncate">{product.category_name || "Garment"}</span>
            {product.subcategory_name && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-500 font-normal truncate">
                  {product.subcategory_name}
                </span>
              </>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-serif font-semibold text-sm sm:text-base text-zinc-900 group-hover:text-burgundy transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h3>

          {/* Product Price (Rendered ONLY when visible) */}
          {product.price !== null && product.price !== undefined && Number(product.price) > 0 && (
            <div className="pt-0.5">
              <span className="text-sm sm:text-base font-bold text-zinc-900">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Material & Style Code */}
          <div className="flex items-center justify-between text-xs text-zinc-600 gap-2 pt-0.5">
            <span className="truncate font-medium">
              {product.material || "Fine Fabric"}
            </span>
            {product.style_code && (
              <span className="font-mono text-xs text-zinc-600 bg-sand/70 px-1.5 py-0.5 rounded flex-shrink-0 border border-amber-950/10">
                {product.style_code}
              </span>
            )}
          </div>

          {/* Available Sizes preview */}
          {sizes.length > 0 && (
            <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
              {sizes.slice(0, 3).map((size) => (
                <span
                  key={size}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-sand/70 text-zinc-700 border border-amber-950/10"
                >
                  {size}
                </span>
              ))}
              {sizes.length > 3 && (
                <span className="text-xs text-zinc-500 font-medium">
                  +{sizes.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

