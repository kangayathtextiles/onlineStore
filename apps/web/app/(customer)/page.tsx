"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Shirt,
  Layers,
  Store,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/customer/product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { publicApi } from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import type {
  PublicCategoryTree,
  PublicProductSummary,
  PublicSection,
} from "@/types/api";
import { useStore } from "@/lib/store-context";

export default function CustomerHomePage() {
  const { status, profile: store, isStatusLoading } = useStore();
  const [categories, setCategories] = React.useState<PublicCategoryTree[]>([]);
  const [sections, setSections] = React.useState<PublicSection[]>([]);
  const [featuredProducts, setFeaturedProducts] = React.useState<PublicProductSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      try {
        setLoading(true);
        const [catsData, sectionsData, prodsData] = await Promise.all([
          publicApi.categories.list().catch(() => []),
          publicApi.sections.list().catch(() => []),
          publicApi.products.list({ page: 1, page_size: 8 }).catch(() => ({ items: [] })),
        ]);

        if (isMounted) {
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
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/50 via-canvas to-canvas border-b border-amber-950/10 pt-8 pb-14 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(101,23,20,0.06),rgba(255,255,255,0))]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
          {/* Status Capsule */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/95 border border-amber-950/10 text-zinc-700 shadow-xs backdrop-blur-md">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                !status && isStatusLoading
                  ? "bg-amber-400/80 animate-pulse"
                  : status?.is_open
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-rose-500"
              }`}
            />
            <span className="truncate max-w-[200px] sm:max-w-none">
              {!status && isStatusLoading
                ? `Physical Store in ${storeCity || siteConfig.location.locality}`
                : status?.is_open
                ? `Physical Store is OPEN NOW in ${storeCity || siteConfig.location.locality}`
                : `Physical Store in ${storeCity || siteConfig.location.locality} is CLOSED`}
            </span>
            <span className="text-zinc-300 hidden sm:inline">•</span>
            <Link href="/visit" className="text-burgundy hover:text-burgundy-700 underline font-semibold hidden sm:inline">
              View Hours &amp; Directions
            </Link>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-zinc-900 leading-tight">
              Traditional Craft, <br />
              <span className="bg-gradient-to-r from-burgundy via-rose-800 to-amber-700 bg-clip-text text-transparent italic font-normal">
                Contemporary Grace.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-xl mx-auto">
              Explore authentic Kerala handlooms, festive silks, and family wear online. Verify size and color availability before visiting our showroom in Kalkandi, Palakkad.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/products" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto h-11 px-6 text-sm font-semibold active:scale-[0.98] transition-all">
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Garment Catalog</span>
              </Button>
            </Link>

            <Link href="/visit" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full sm:w-auto h-11 px-6 text-sm font-semibold active:scale-[0.98] transition-all">
                <Store className="w-4 h-4" />
                <span>Store Location & Directions</span>
              </Button>
            </Link>
          </div>

          {/* Showroom Notice */}
          <p className="hidden sm:block text-xs text-zinc-500 max-w-md mx-auto">
            Live showroom inventory • In-person fitting & purchases in store
          </p>
        </div>
      </section>

      {/* 2. Main Categories Showcase */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-burgundy flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Departments
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 mt-1">
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
                className="group relative rounded-2xl border border-amber-950/10 bg-white p-5 hover:border-burgundy/40 hover:shadow-[0_8px_24px_rgba(42,13,11,0.08)] transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 relative rounded-xl bg-sand border border-amber-950/10 flex items-center justify-center overflow-hidden mb-4 group-hover:scale-105 transition-transform">
                    {cat.thumbnail_url ? (
                      <Image src={resolveImageUrl(cat.thumbnail_url)} alt={cat.name} fill unoptimized className="object-cover" />
                    ) : (
                      <Layers className="w-6 h-6 text-burgundy" />
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-base text-zinc-900 group-hover:text-burgundy transition-colors">
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
            <span className="text-xs font-bold uppercase tracking-wider text-burgundy flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              In-Store Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 mt-1">
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
          <ProductGridSkeleton count={4} />
        ) : featuredProducts.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 bg-zinc-50 rounded-2xl border border-zinc-200">
            <Shirt className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-700">Catalog is updating</p>
            <p className="text-xs text-zinc-500 mt-1">Visit our store to view all in-store stock.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Physical Store Discovery Guide ("How It Works") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-950/10 bg-sand/50 p-6 sm:p-10 space-y-8 shadow-xs">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-burgundy flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              Showroom Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900">
              How Our Showroom Works
            </h2>
            <p className="text-sm text-zinc-600">
              Convenient digital browsing paired with hands-on in-store fitting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-amber-950/10 shadow-xs space-y-2 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
              <div className="w-9 h-9 rounded-xl bg-burgundy/10 border border-burgundy/20 text-burgundy font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-zinc-900">1. Browse Online</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Explore curated weaves, fabrics, and styles from the comfort of home.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-amber-950/10 shadow-xs space-y-2 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
              <div className="w-9 h-9 rounded-xl bg-burgundy/10 border border-burgundy/20 text-burgundy font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-zinc-900">2. Verify Availability</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Confirm real-time size and color stock availability before your visit.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-amber-950/10 shadow-xs space-y-2 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
              <div className="w-9 h-9 rounded-xl bg-burgundy/10 border border-burgundy/20 text-burgundy font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-zinc-900">3. Try in Showroom</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Experience the fabric, try in fitting rooms, and purchase in person.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Physical Retail Store & Location Information */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-950/10 bg-gradient-to-b from-white to-sand/40 p-6 sm:p-10 lg:p-12 space-y-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-amber-950/10 pb-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-burgundy flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Physical Showroom
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
                Visit Our Store in Kalkandi, Palakkad
              </h2>
              <p className="text-sm text-zinc-600 max-w-xl leading-relaxed">
                Located on Main Anaikatti Road in Kalkandi. Explore authentic Kerala handlooms, festive silks, and family wear with dedicated styling assistance.
              </p>
            </div>
            <a
              href={siteConfig.location.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-burgundy hover:bg-burgundy-700 text-white font-medium text-xs shadow-xs transition-all active:scale-[0.98] self-start md:self-auto flex-shrink-0"
            >
              <MapPin className="w-4 h-4 text-rose-200" />
              <span>Get Directions on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Store Address & Contact */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-burgundy font-bold text-sm">
                <MapPin className="w-4 h-4" />
                <span>Store Address &amp; Contact</span>
              </div>
              <address className="not-italic text-xs text-zinc-600 space-y-1 leading-relaxed">
                <p className="font-bold text-zinc-900 text-sm">{siteConfig.legalName}</p>
                <p>{siteConfig.location.streetAddress}</p>
                <p>
                  {siteConfig.location.locality}, {siteConfig.location.district},{" "}
                  {siteConfig.location.state} - {siteConfig.location.postalCode}
                </p>
                <p className="text-zinc-500 pt-1">Near Kalkandi Junction</p>
              </address>
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Call Store:</span>
                </span>
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="font-bold text-zinc-900 hover:text-burgundy transition-colors"
                >
                  {siteConfig.contact.phone}
                </a>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-burgundy font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>Weekly Hours (IST)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                  <span className="font-medium text-zinc-700">Monday – Friday</span>
                  <span className="font-mono text-zinc-900 font-semibold">09:30 – 20:30</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                  <span className="font-medium text-zinc-700">Saturday</span>
                  <span className="font-mono text-zinc-900 font-semibold">09:30 – 20:00</span>
                </div>
                <div className="flex items-center justify-between py-1 text-zinc-500">
                  <span className="font-medium">Sunday</span>
                  <span className="text-rose-600 font-semibold uppercase text-xs">Closed</span>
                </div>
              </div>
            </div>

            {/* In-Store Amenities */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-burgundy font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Showroom Experience</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-600">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Fitting rooms available for trying garments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Customer parking space on premises</span>
                </li>
                <li className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-burgundy flex-shrink-0" />
                  <span>UPI, Credit/Debit cards &amp; Cash accepted</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
