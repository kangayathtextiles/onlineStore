"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, Store } from "lucide-react";
import { useSavedItems } from "@/lib/saved-items-context";
import { useStoreStatus } from "@/lib/store-context";

export function CustomerMobileNav() {
  const pathname = usePathname();
  const { savedCount } = useSavedItems();
  const { status, isLoading } = useStoreStatus();

  // Do not show the bottom nav on admin routes or product detail pages (which have a dedicated sticky inquiry bar)
  const isProductDetailPage = pathname.startsWith("/products/") && pathname !== "/products";
  if (pathname.startsWith("/admin") || isProductDetailPage) {
    return null;
  }

  const isCatalog = pathname.startsWith("/products");
  const isHome = pathname === "/";
  const isSaved = pathname === "/saved";
  const isVisit = pathname === "/visit";

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-950/10 shadow-[0_-4px_20px_rgba(42,13,11,0.06)] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1"
    >
      <div className="grid grid-cols-4 h-14 items-center">
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 ${
            isHome ? "text-burgundy" : "text-zinc-600 hover:text-zinc-900"
          }`}
          aria-label="Home"
          aria-current={isHome ? "page" : undefined}
        >
          <Home className={`w-5 h-5 ${isHome ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span className={`text-[11px] tracking-tight ${isHome ? "font-bold" : "font-medium"}`}>
            Home
          </span>
        </Link>

        {/* 2. Search & Browse */}
        <Link
          href="/products"
          className={`flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 ${
            isCatalog ? "text-burgundy" : "text-zinc-600 hover:text-zinc-900"
          }`}
          aria-label="Search & Browse Garments"
          aria-current={isCatalog ? "page" : undefined}
        >
          <Search className={`w-5 h-5 ${isCatalog ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span className={`text-[11px] tracking-tight ${isCatalog ? "font-bold" : "font-medium"}`}>
            Search
          </span>
        </Link>

        {/* 3. Saved Wishlist */}
        <Link
          href="/saved"
          className={`relative flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 ${
            isSaved ? "text-burgundy" : "text-zinc-600 hover:text-zinc-900"
          }`}
          aria-label={`Saved Garments (${savedCount} items)`}
          aria-current={isSaved ? "page" : undefined}
        >
          <div className="relative">
            <Heart
              className={`w-5 h-5 ${
                isSaved
                  ? "stroke-[2.5] fill-burgundy text-burgundy"
                  : savedCount > 0
                  ? "fill-rose-500 text-rose-500 stroke-[1.75]"
                  : "stroke-[1.75]"
              }`}
            />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-burgundy text-white text-[10px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center ring-2 ring-white">
                {savedCount > 9 ? "9+" : savedCount}
              </span>
            )}
          </div>
          <span className={`text-[11px] tracking-tight ${isSaved ? "font-bold" : "font-medium"}`}>
            Saved
          </span>
        </Link>

        {/* 5. Visit & Hours */}
        <Link
          href="/visit"
          className={`relative flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 ${
            isVisit ? "text-burgundy" : "text-zinc-600 hover:text-zinc-900"
          }`}
          aria-label="Store Hours & Directions"
          aria-current={isVisit ? "page" : undefined}
        >
          <div className="relative">
            <Store className={`w-5 h-5 ${isVisit ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span
              className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full ring-1 ring-white ${
                !status && isLoading
                  ? "bg-amber-400/80 animate-pulse"
                  : status?.is_open
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-rose-400"
              }`}
              title={
                !status && isLoading
                  ? "Checking Store Hours"
                  : status?.is_open
                  ? "Store is Open"
                  : "Store is Closed"
              }
            />
          </div>
          <span className={`text-[11px] tracking-tight ${isVisit ? "font-bold" : "font-medium"}`}>
            Visit
          </span>
        </Link>
      </div>
    </nav>
  );
}
