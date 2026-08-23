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

  return (
    <div className="group relative rounded-2xl border border-zinc-200/90 bg-white hover:border-burgundy/40 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Thumbnail Container with 4:5 Aspect Ratio */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F0EFED] flex items-center justify-center">
          <ProductImage
            src={product.primary_image_url}
            alt={product.name}
            aspectRatio="4/5"
            zoomOnHover={true}
          />

          {/* Quick Save Heart Button */}
          <button
            type="button"
            onClick={handleSaveClick}
            className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-xs ${
              saved
                ? "bg-rose-50/95 text-rose-600 border border-rose-200 scale-105"
                : "bg-white/85 text-zinc-600 hover:text-rose-600 border border-zinc-200/80 hover:bg-white"
            }`}
            title={saved ? "Remove from saved" : "Save garment"}
            aria-label={saved ? "Remove from saved items" : "Save this garment"}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                saved ? "fill-rose-600 text-rose-600" : ""
              }`}
            />
          </button>

          {/* Floating Stock Status Badge */}
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-10">
            <Badge
              variant={product.is_available ? "success" : "danger"}
              className="text-[8px] sm:text-[10px] px-1.5 py-0.5 sm:px-2.5 sm:py-1 shadow-xs backdrop-blur-md bg-white/95 border border-zinc-200/60 font-semibold"
            >
              {product.is_available ? (
                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
              ) : (
                <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-600" />
              )}
              <span>{product.is_available ? "In Stock" : "Sold Out"}</span>
            </Badge>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-3 sm:p-4.5 space-y-1.5 sm:space-y-2">
          {/* Category / Subcategory hierarchy */}
          <div className="flex items-center gap-1 text-[9px] sm:text-[11px] font-bold text-burgundy uppercase tracking-wider">
            <span>{product.category_name || "Garment"}</span>
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
          <h3 className="font-bold text-xs sm:text-base text-zinc-900 group-hover:text-burgundy transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Material & Style Code */}
          <div className="flex items-center justify-between text-xs text-zinc-600 gap-1.5">
            <span className="truncate text-[10px] sm:text-xs font-medium text-zinc-600">
              {product.material || "Fine Fabric"}
            </span>
            {product.style_code && (
              <span className="font-mono text-[8px] sm:text-[10px] text-zinc-600 bg-zinc-100 px-1 py-0.5 rounded flex-shrink-0 border border-zinc-200/80">
                {product.style_code}
              </span>
            )}
          </div>

          {/* Available Sizes preview */}
          {(product.available_sizes || []).length > 0 && (
            <div className="pt-0.5 flex items-center gap-1 flex-wrap">
              <span className="text-[8px] sm:text-[10px] text-zinc-500 uppercase font-bold">
                Sizes:
              </span>
              {product.available_sizes?.slice(0, 3).map((size) => (
                <span
                  key={size}
                  className="px-1 py-0.5 rounded text-[8px] sm:text-[10px] font-semibold bg-zinc-100/80 text-zinc-700 border border-zinc-200/80"
                >
                  {size}
                </span>
              ))}
              {(product.available_sizes || []).length > 3 && (
                <span className="text-[8px] sm:text-[9px] text-zinc-500 font-medium">
                  +{(product.available_sizes || []).length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

