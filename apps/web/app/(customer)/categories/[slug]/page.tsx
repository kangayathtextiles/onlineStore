"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shirt, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/customer/product-card";
import { publicApi } from "@/lib/api";
import type { PublicCategoryTree, PublicProductSummary } from "@/types/api";

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = React.useState<PublicCategoryTree | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<string>("");
  const [products, setProducts] = React.useState<PublicProductSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadCategoryData() {
      try {
        setLoading(true);
        const cats = await publicApi.categories.list();
        const matched = cats.find((c) => c.slug === slug);
        if (matched) {
          setCategory(matched);
        }

        const prods = await publicApi.products.list({
          category: slug,
          subcategory: selectedSubcategory || undefined,
          page: 1,
          page_size: 24,
        });
        setProducts(prods.items);
      } catch {
        // Ignored
      } finally {
        setLoading(false);
      }
    }
    loadCategoryData();
  }, [slug, selectedSubcategory]);

  if (loading && !category) {
    return (
      <div className="py-24 text-center text-zinc-500">
        <p>Loading department collection...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Breadcrumb & Header */}
      <div className="space-y-4 border-b border-zinc-800 pb-8">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-100 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-600" />
          <Link href="/products" className="hover:text-zinc-100 transition-colors">
            Catalog
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-600" />
          <span className="text-zinc-200 font-semibold">{category?.name || slug}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Department Showcase
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-100">
              {category?.name || "Garment Department"}
            </h1>
            {category?.description && (
              <p className="text-sm text-zinc-400 max-w-2xl mt-1">{category.description}</p>
            )}
          </div>

          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
              <span>All Departments</span>
            </Button>
          </Link>
        </div>

        {/* Subcategories Horizontal Filter Bar */}
        {category && category.subcategories.length > 0 && (
          <div className="flex items-center gap-2 pt-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedSubcategory("")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubcategory === ""
                  ? "bg-burgundy text-white shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              All {category.name} ({products.length})
            </button>
            {category.subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(sub.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSubcategory === sub.slug
                    ? "bg-burgundy text-white shadow-sm"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="py-20 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800 p-8 space-y-4">
          <Shirt className="w-12 h-12 text-zinc-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-200">No garments in this section yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Our inventory is currently being updated. Visit our store or explore other departments.
            </p>
          </div>
          <Link href="/products">
            <Button variant="primary" size="sm">
              <span>Explore All Garments</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
}
