"use client";

import * as React from "react";
import Link from "next/link";
import {
  Heart,
  Trash2,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/product-image";
import { useSavedItems } from "@/lib/saved-items-context";
import { publicApi } from "@/lib/api";
import type { StoreProfile } from "@/types/api";

export default function SavedProductsPage() {
  const { savedItems, removeSaved, clearSaved } = useSavedItems();
  const [store, setStore] = React.useState<StoreProfile | null>(null);
  const [liveAvailability, setLiveAvailability] = React.useState<
    Record<string, boolean>
  >({});
  const [loadingAvailability, setLoadingAvailability] = React.useState(false);

  // Check live availability for saved products from backend API
  React.useEffect(() => {
    async function checkStock() {
      if (savedItems.length === 0) return;

      try {
        setLoadingAvailability(true);
        const [availList, storeProfile] = await Promise.all([
          publicApi.savedItems.checkAvailability(savedItems.map((i) => i.id)),
          publicApi.store.getProfile().catch(() => null),
        ]);

        setStore(storeProfile);
        const map: Record<string, boolean> = {};
        availList.forEach((item) => {
          map[item.product_id] = item.is_available;
        });
        setLiveAvailability(map);
      } catch {
        // Ignored
      } finally {
        setLoadingAvailability(false);
      }
    }
    checkStock();
  }, [savedItems]);

  const whatsappPhone = store?.whatsapp_number
    ? store.whatsapp_number.replace(/[^0-9]/g, "")
    : "919876543210";

  const allSavedSummaryText = encodeURIComponent(
    `Hello Kangayath! I have saved the following garments in my wishlist and would like to check availability:\n\n${savedItems
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.name} (Style: ${item.style_code || "N/A"})`
      )
      .join("\n")}\n\nCould you please let me know if these are in stock for a store visit?`
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8 sm:space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 sm:pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-burgundy">
            Personal Wishlist
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 mt-1">
            Saved Garments ({savedItems.length})
            {loadingAvailability && (
              <span className="text-[10px] text-amber-600 animate-pulse font-mono ml-2 font-normal">
                (Checking live stock...)
              </span>
            )}
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-zinc-600 mt-1">
            Garments you have bookmarked for your upcoming physical store visit.
          </p>
        </div>

        {savedItems.length > 0 && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href={`https://wa.me/${whatsappPhone}?text=${allSavedSummaryText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Inquire All on WhatsApp</span>
            </a>

            <Button variant="ghost" size="sm" onClick={clearSaved} className="px-3 flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </Button>
          </div>
        )}
      </div>

      {savedItems.length === 0 ? (
        <div className="py-24 text-center bg-zinc-50 rounded-3xl border border-zinc-200 p-8 space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400 shadow-xs">
            <Heart className="w-8 h-8 stroke-1" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-800">Your saved list is empty</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Explore our collections and click the heart icon on any garment to save styles for your
              store visit.
            </p>
          </div>
          <Link href="/products">
            <Button variant="primary" size="md">
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Garment Showroom</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((item) => {
            const isAvailable =
              liveAvailability[item.id] !== undefined
                ? liveAvailability[item.id]
                : item.is_available;

            const singleItemMsg = encodeURIComponent(
              `Hello Kangayath! I have saved "${item.name}" (Style: ${
                item.style_code || "N/A"
              }) in my wishlist. Is it currently available at your retail store?`
            );

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between hover:border-burgundy/30 hover:shadow-md transition-all p-4 space-y-4"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.slug}`}
                    className="w-24 aspect-[4/5] rounded-xl overflow-hidden bg-[#F0EFED] border border-zinc-200 flex-shrink-0 relative group"
                  >
                    <ProductImage
                      src={item.primary_image_url}
                      alt={item.name}
                      aspectRatio="4/5"
                      zoomOnHover={true}
                    />
                  </Link>

                  {/* Info */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy">
                      {item.category_name || "Garment"}
                    </span>
                    <Link
                      href={`/products/${item.slug}`}
                      className="block font-bold text-sm text-zinc-900 hover:text-burgundy transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    {item.material && (
                      <p className="text-xs text-zinc-600 truncate">{item.material}</p>
                    )}
                    {item.style_code && (
                      <p className="text-[10px] font-mono text-zinc-500">{item.style_code}</p>
                    )}

                    <div className="pt-1">
                      <Badge variant={isAvailable ? "success" : "danger"} className="text-[10px]">
                        {isAvailable ? "In Stock" : "Sold Out"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <a
                    href={`https://wa.me/${whatsappPhone}?text=${singleItemMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Inquire</span>
                  </a>

                  <button
                    onClick={() => removeSaved(item.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors text-xs flex items-center gap-1"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
