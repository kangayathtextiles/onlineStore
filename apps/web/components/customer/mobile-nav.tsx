"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Shirt, Search, Heart, Store } from "lucide-react";
import { useSavedItems } from "@/lib/saved-items-context";
import { publicApi } from "@/lib/api";
import type { StoreStatusResponse } from "@/types/api";

export function CustomerMobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { savedCount } = useSavedItems();
  const [status, setStatus] = React.useState<StoreStatusResponse | null>(null);

  // Fetch store open status for the Visit item indicator
  React.useEffect(() => {
    let isMounted = true;
    async function fetchStatus() {
      try {
        const data = await publicApi.store.getStatus();
        if (isMounted) {
          setStatus(data);
        }
      } catch {
        // Ignored
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Do not show the bottom nav on admin routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const isFocusSearch = pathname === "/products" && searchParams?.get("focus") === "search";
  const isCatalog = pathname.startsWith("/products") && !isFocusSearch;
  const isHome = pathname === "/";
  const isSaved = pathname === "/saved";
  const isVisit = pathname === "/visit";

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-950/10 shadow-[0_-4px_20px_rgba(42,13,11,0.06)] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1"
    >
      <div className="grid grid-cols-5 h-14 items-center">
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

        {/* 2. Catalog */}
        <Link
          href="/products"
          className={`flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 ${
            isCatalog ? "text-burgundy" : "text-zinc-600 hover:text-zinc-900"
          }`}
          aria-label="Garment Catalog"
          aria-current={isCatalog ? "page" : undefined}
        >
          <Shirt className={`w-5 h-5 ${isCatalog ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span className={`text-[11px] tracking-tight ${isCatalog ? "font-bold" : "font-medium"}`}>
            Catalog
          </span>
        </Link>

        {/* 3. Search */}
        <Link
          href="/products?focus=search"
          className={`flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 ${
            isFocusSearch ? "text-burgundy" : "text-zinc-600 hover:text-zinc-900"
          }`}
          aria-label="Search Garments"
          aria-current={isFocusSearch ? "page" : undefined}
        >
          <Search className={`w-5 h-5 ${isFocusSearch ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span className={`text-[11px] tracking-tight ${isFocusSearch ? "font-bold" : "font-medium"}`}>
            Search
          </span>
        </Link>

        {/* 4. Saved Wishlist */}
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
                status?.is_open ? "bg-emerald-500 animate-pulse" : "bg-rose-400"
              }`}
              title={status?.is_open ? "Store is Open" : "Store is Closed"}
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
