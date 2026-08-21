"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Clock,
  MapPin,
  CheckCircle,
  MessageCircle,
  Shirt,
  Layers,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/customer/product-card";
import { publicApi } from "@/lib/api";
import { formatISTTime } from "@/lib/utils";
import type {
  PublicCategoryTree,
  PublicProductSummary,
  PublicSection,
  StoreStatusResponse,
} from "@/types/api";

export default function CustomerHomePage() {
  const [status, setStatus] = React.useState<StoreStatusResponse | null>(null);
  const [categories, setCategories] = React.useState<PublicCategoryTree[]>([]);
  const [sections, setSections] = React.useState<PublicSection[]>([]);
  const [featuredProducts, setFeaturedProducts] = React.useState<PublicProductSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [statusData, catsData, sectionsData, prodsData] = await Promise.all([
          publicApi.store.getStatus().catch(() => null),
          publicApi.categories.list().catch(() => []),
          publicApi.sections.list().catch(() => []),
          publicApi.products.list({ page: 1, page_size: 8 }).catch(() => ({ items: [] })),
        ]);

        setStatus(statusData);
        setCategories(Array.isArray(catsData) ? catsData : []);
        setSections(Array.isArray(sectionsData) ? sectionsData : []);
        setFeaturedProducts(prodsData?.items || []);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-burgundy-950/40 via-zinc-950 to-zinc-950 border-b border-zinc-800/80 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(101,23,20,0.3),rgba(255,255,255,0))]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Status Capsule */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 shadow-md backdrop-blur-md">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status?.is_open ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            />
            <span>
              {status?.is_open
                ? "Physical Store is OPEN NOW in Thrissur"
                : "Physical Store is Currently CLOSED"}
            </span>
            <span className="text-zinc-600">•</span>
            <Link href="/visit" className="text-rose-400 hover:text-rose-300 underline font-medium">
              View Hours & Map
            </Link>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
              Traditional Craft, <br />
              <span className="bg-gradient-to-r from-rose-200 via-rose-300 to-amber-200 bg-clip-text text-transparent">
                Contemporary Grace.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Welcome to the KANGAYATH digital showroom. Discover pure handloom silks, festive dhotis,
              and everyday casuals available at our retail store.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/products">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 py-3 text-sm">
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Garment Catalog</span>
              </Button>
            </Link>

            <Link href="/visit">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3 text-sm">
                <Store className="w-4 h-4" />
                <span>Store Location & Directions</span>
              </Button>
            </Link>
          </div>

          {/* Showroom Notice */}
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            ⚡ Check live size & color stock online. Try on and purchase in-person at our physical store.
          </p>
        </div>
      </section>

      {/* 2. Main Categories Showcase */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Departments
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100 mt-1">
                Browse By Category
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 group"
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
                className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden mb-4 group-hover:scale-105 transition-transform">
                    {cat.thumbnail_url ? (
                      <img src={cat.thumbnail_url} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <Layers className="w-6 h-6 text-rose-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-base text-zinc-100 group-hover:text-rose-200 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {cat.description || `${(cat.subcategories || []).length} subcategories available`}
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-rose-400">
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
          <div className="p-6 sm:p-8 rounded-3xl border border-burgundy-900/40 bg-gradient-to-r from-zinc-900 via-zinc-900 to-wine/20 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-burgundy/80 text-rose-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Special Showcase</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="text-sm text-zinc-300 max-w-xl">{section.subtitle}</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              In-Store Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100 mt-1">
              Recent Garment Arrivals
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 group"
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
          <div className="py-16 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
            <Shirt className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-300">Catalog is updating</p>
            <p className="text-xs text-zinc-500 mt-1">Visit our store to view all in-store stock.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Physical Store Discovery Guide ("How It Works") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 sm:p-12 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Showroom Discovery Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">
              How KANGAYATH Digital Showroom Works
            </h2>
            <p className="text-sm text-zinc-400">
              Experience the best of both worlds: convenient online browsing with hands-on physical retail fitting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-burgundy/30 border border-burgundy/50 text-rose-300 font-extrabold flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-base text-zinc-100">1. Discover Online</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Browse our complete garment catalog, photos, fabrics, and descriptions from your phone or computer.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-burgundy/30 border border-burgundy/50 text-rose-300 font-extrabold flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-base text-zinc-100">2. Check Live Stock</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Check real-time stock availability for your exact size and color before traveling to our store.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-burgundy/30 border border-burgundy/50 text-rose-300 font-extrabold flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-base text-zinc-100">3. Visit & Purchase</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Visit our physical store to try garments on in our fitting rooms and make your purchase in person.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
