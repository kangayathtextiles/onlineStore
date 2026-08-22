"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Shirt,
  Layers,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/customer/product-card";
import { publicApi } from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";
import type {
  PublicCategoryTree,
  PublicProductSummary,
  PublicSection,
  StoreProfile,
  StoreStatusResponse,
} from "@/types/api";

export default function CustomerHomePage() {
  const [status, setStatus] = React.useState<StoreStatusResponse | null>(null);
  const [store, setStore] = React.useState<StoreProfile | null>(null);
  const [categories, setCategories] = React.useState<PublicCategoryTree[]>([]);
  const [sections, setSections] = React.useState<PublicSection[]>([]);
  const [featuredProducts, setFeaturedProducts] = React.useState<PublicProductSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      try {
        setLoading(true);
        const [statusData, storeData, catsData, sectionsData, prodsData] = await Promise.all([
          publicApi.store.getStatus().catch(() => null),
          publicApi.store.getProfile().catch(() => null),
          publicApi.categories.list().catch(() => []),
          publicApi.sections.list().catch(() => []),
          publicApi.products.list({ page: 1, page_size: 8 }).catch(() => ({ items: [] })),
        ]);

        if (isMounted) {
          setStatus(statusData);
          setStore(storeData);
          setCategories(Array.isArray(catsData) ? catsData : []);
          setSections(Array.isArray(sectionsData) ? sectionsData : []);
          setFeaturedProducts(prodsData?.items || []);
        }
      } catch {
        // Ignored
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  const storeCity = store?.city || store?.locality || store?.district || "";

  return (
    <div className="space-y-12 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/50 via-white to-white border-b border-zinc-200/80 pt-8 pb-14 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(101,23,20,0.06),rgba(255,255,255,0))]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
          {/* Status Capsule */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 shadow-xs backdrop-blur-md">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status?.is_open ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="truncate max-w-[200px] sm:max-w-none">
              {status?.is_open
                ? `Physical Store is OPEN NOW${storeCity ? ` in ${storeCity}` : ""}`
                : "Physical Store is Currently CLOSED"}
            </span>
            <span className="text-zinc-300 hidden sm:inline">•</span>
            <Link href="/visit" className="text-burgundy hover:text-burgundy-700 underline font-semibold hidden sm:inline">
              View Hours & Map
            </Link>
          </div>

          <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              Traditional Craft, <br />
              <span className="bg-gradient-to-r from-burgundy via-rose-700 to-amber-700 bg-clip-text text-transparent">
                Contemporary Grace.
              </span>
            </h1>
            <p className="text-sm sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              Welcome to the KANGAYATH digital showroom. Discover pure handloom silks, festive dhotis,
              and everyday casuals available at our retail store.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-1 sm:pt-2">
            <Link href="/products" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold">
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Garment Catalog</span>
              </Button>
            </Link>

            <Link href="/visit" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold">
                <Store className="w-4 h-4" />
                <span>Store Location & Directions</span>
              </Button>
            </Link>
          </div>

          {/* Showroom Notice */}
          <p className="hidden sm:block text-xs text-zinc-500 max-w-md mx-auto">
            ⚡ Check live size & color stock online. Try on and purchase in-person at our physical store.
          </p>
        </div>
      </section>

      {/* 2. Main Categories Showcase */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-burgundy">
                Departments
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 mt-1">
                Browse By Category
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs sm:text-sm font-semibold text-burgundy hover:text-burgundy-700 flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.slug)}`}
                className="group relative rounded-2xl border border-zinc-200 bg-white p-5 hover:border-burgundy/30 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden mb-4 group-hover:scale-105 transition-transform">
                    {cat.thumbnail_url ? (
                      <img src={resolveImageUrl(cat.thumbnail_url)} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <Layers className="w-6 h-6 text-burgundy" />
                    )}
                  </div>
                  <h3 className="font-bold text-base text-zinc-900 group-hover:text-burgundy transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-zinc-600 line-clamp-2">
                    {cat.description || `${(cat.subcategories || []).length} subcategories available`}
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-burgundy">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Promotional Custom Sections (e.g. Festival Specials, New Arrivals) */}
      {sections.map((section) => (
        <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-8 rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50/60 via-rose-50/30 to-amber-50/30 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-burgundy text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Special Showcase</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight pt-1">
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="text-sm text-zinc-600 max-w-xl">{section.subtitle}</p>
              )}
            </div>

            <Link href={`/products`}>
              <Button variant="outline" size="sm">
                <span>View Full Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Section Products Grid */}
          {section.products.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
              {section.products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              Garments in this section are currently updating.
            </div>
          )}
        </section>
      ))}

      {/* 4. Featured Garments Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-burgundy">
              In-Store Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 mt-1">
              Recent Garment Arrivals
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-burgundy hover:text-burgundy-700 flex items-center gap-1 group"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-zinc-500">
            <p>Loading showroom garments...</p>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 bg-zinc-50 rounded-2xl border border-zinc-200">
            <Shirt className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-700">Catalog is updating</p>
            <p className="text-xs text-zinc-500 mt-1">Visit our store to view all in-store stock.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Physical Store Discovery Guide ("How It Works") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-8 sm:p-12 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-burgundy">
              Showroom Discovery Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
              How KANGAYATH Digital Showroom Works
            </h2>
            <p className="text-sm text-zinc-600">
              Experience the best of both worlds: convenient online browsing with hands-on physical retail fitting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-burgundy/10 border border-burgundy/20 text-burgundy font-extrabold flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-base text-zinc-900">1. Discover Online</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Browse our complete garment catalog, photos, fabrics, and descriptions from your phone or computer.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-burgundy/10 border border-burgundy/20 text-burgundy font-extrabold flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-base text-zinc-900">2. Check Live Stock</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Check real-time stock availability for your exact size and color before traveling to our store.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-burgundy/10 border border-burgundy/20 text-burgundy font-extrabold flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-base text-zinc-900">3. Visit & Purchase</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Visit our physical store to try garments on in our fitting rooms and make your purchase in person.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
