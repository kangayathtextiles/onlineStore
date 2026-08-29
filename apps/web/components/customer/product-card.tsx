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
    <div className="group relative rounded-2xl border border-zinc-200/90 bg-white hover:border-burgundy/40 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Aspect 3:4 / 4:5 Responsive Fashion Image Canvas */}
        <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full overflow-hidden bg-[#F0EFED] flex items-center justify-center">
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
            className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-xs ${
              saved
                ? "bg-rose-50/95 text-rose-600 border border-rose-200 scale-105"
                : "bg-white/90 text-zinc-600 hover:text-rose-600 border border-zinc-200/80 hover:bg-white"
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

          {/* Floating Stock Status Badge (Bottom-Left) */}
          <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-10">
            <Badge
              variant={product.is_available ? "success" : "danger"}
              className="text-[8px] sm:text-[10px] px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-xs backdrop-blur-md bg-white/95 border border-zinc-200/60 font-semibold flex items-center gap-1"
            >
              {product.is_available ? (
                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
              ) : (
                <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-600" />
              )}
              <span>{product.is_available ? "In Stock" : "Sold Out"}</span>
            </Badge>
          </div>

          {/* Floating Color Swatch Counter Pill (Bottom-Right, Reference Image 4) */}
          {colors.length > 0 && (
            <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-zinc-200/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-burgundy/80 inline-block" />
              <span className="text-[9px] font-semibold text-zinc-700">{colors.length}</span>
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="p-2.5 sm:p-4 space-y-1 bg-white">
          {/* Category / Subcategory hierarchy */}
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-burgundy uppercase tracking-wider">
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
          <h3 className="font-bold text-xs sm:text-sm text-zinc-900 group-hover:text-burgundy transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Product Price (Rendered ONLY when visible) */}
          {product.price !== null && product.price !== undefined && Number(product.price) > 0 && (
            <div className="pt-0.5">
              <span className="text-xs sm:text-sm font-bold text-zinc-900">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Material & Style Code */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-500 gap-1.5 pt-0.5">
            <span className="truncate font-medium text-zinc-600">
              {product.material || "Fine Fabric"}
            </span>
            {product.style_code && (
              <span className="font-mono text-[8px] sm:text-[9px] text-zinc-600 bg-zinc-100 px-1 py-0.5 rounded flex-shrink-0 border border-zinc-200/80">
                {product.style_code}
              </span>
            )}
          </div>

          {/* Available Sizes preview */}
          {sizes.length > 0 && (
            <div className="pt-0.5 flex items-center gap-1 flex-wrap">
              {sizes.slice(0, 3).map((size) => (
                <span
                  key={size}
                  className="px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold bg-zinc-100/80 text-zinc-700 border border-zinc-200/80"
                >
                  {size}
                </span>
              ))}
              {sizes.length > 3 && (
                <span className="text-[8px] sm:text-[9px] text-zinc-500 font-medium">
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

