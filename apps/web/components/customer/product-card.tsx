"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Shirt, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <div className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Thumbnail Container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
          {product.primary_image_url ? (
            <img
              src={product.primary_image_url}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600 gap-2">
              <Shirt className="w-10 h-10 stroke-1" />
              <span className="text-[11px] font-medium text-zinc-500">Photo Coming Soon</span>
            </div>
          )}

          {/* Quick Save Heart Button */}
          <button
            type="button"
            onClick={handleSaveClick}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
              saved
                ? "bg-rose-950/80 text-rose-400 border border-rose-800/80"
                : "bg-black/40 text-zinc-300 hover:text-white border border-white/10 hover:bg-black/60"
            }`}
            title={saved ? "Remove from saved" : "Save garment"}
            aria-label={saved ? "Remove from saved items" : "Save this garment"}
          >
            <Heart className={`w-4 h-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>

          {/* Stock Status Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant={product.is_available ? "success" : "danger"} className="text-[10px] shadow-md backdrop-blur-md bg-zinc-950/80">
              {product.is_available ? (
                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <XCircle className="w-2.5 h-2.5 text-rose-400" />
              )}
              <span>{product.is_available ? "In Stock" : "Sold Out"}</span>
            </Badge>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {/* Category / Subcategory tags */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400/90 uppercase tracking-wider">
            <span>{product.category_name || "Garment"}</span>
            {product.subcategory_name && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 font-normal">{product.subcategory_name}</span>
              </>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-rose-200 transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Material & Style Code */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="truncate">{product.material || "Fine Fabric"}</span>
            {product.style_code && (
              <span className="font-mono text-[10px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                {product.style_code}
              </span>
            )}
          </div>

          {/* Available Sizes preview */}
          {(product.available_sizes || []).length > 0 && (
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Sizes:</span>
              {product.available_sizes?.map((size) => (
                <span
                  key={size}
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                >
                  {size}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
