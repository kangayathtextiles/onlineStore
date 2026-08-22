"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Shirt, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSavedItems } from "@/lib/saved-items-context";
import { resolveImageUrl } from "@/lib/utils";
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

  const imageSrc = resolveImageUrl(product.primary_image_url);

  return (
    <div className="group relative rounded-2xl border border-zinc-200 bg-white hover:border-burgundy/40 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Thumbnail Container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100 flex items-center justify-center">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
              <Shirt className="w-10 h-10 stroke-1" />
              <span className="text-[11px] font-medium text-zinc-500">Photo Coming Soon</span>
            </div>
          )}

          {/* Quick Save Heart Button */}
          <button
            type="button"
            onClick={handleSaveClick}
            className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-xs ${
              saved
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-white/90 text-zinc-600 hover:text-rose-600 border border-zinc-200 hover:bg-white"
            }`}
            title={saved ? "Remove from saved" : "Save garment"}
            aria-label={saved ? "Remove from saved items" : "Save this garment"}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${saved ? "fill-rose-600 text-rose-600" : ""}`} />
          </button>

          {/* Stock Status Badge */}
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3">
            <Badge variant={product.is_available ? "success" : "danger"} className="text-[9px] sm:text-[10px] px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-xs backdrop-blur-md bg-white/95">
              {product.is_available ? (
                <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
              ) : (
                <XCircle className="w-2.5 h-2.5 text-rose-600" />
              )}
              <span>{product.is_available ? "In Stock" : "Sold Out"}</span>
            </Badge>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-3.5 sm:p-5 space-y-2 sm:space-y-2.5">
          {/* Category / Subcategory tags */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-burgundy uppercase tracking-wider">
            <span>{product.category_name || "Garment"}</span>
            {product.subcategory_name && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-500 font-normal truncate">{product.subcategory_name}</span>
              </>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-sm sm:text-base text-zinc-900 group-hover:text-burgundy transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Material & Style Code */}
          <div className="flex items-center justify-between text-xs text-zinc-600 gap-2">
            <span className="truncate">{product.material || "Fine Fabric"}</span>
            {product.style_code && (
              <span className="font-mono text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded flex-shrink-0 border border-zinc-200">
                {product.style_code}
              </span>
            )}
          </div>

          {/* Available Sizes preview */}
          {(product.available_sizes || []).length > 0 && (
            <div className="pt-0.5 flex items-center gap-1 flex-wrap">
              <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-bold">Sizes:</span>
              {product.available_sizes?.slice(0, 4).map((size) => (
                <span
                  key={size}
                  className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200"
                >
                  {size}
                </span>
              ))}
              {(product.available_sizes || []).length > 4 && (
                <span className="text-[9px] text-zinc-500 font-medium">
                  +{(product.available_sizes || []).length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
