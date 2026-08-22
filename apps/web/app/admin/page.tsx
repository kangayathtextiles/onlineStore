"use client";

import * as React from "react";
import Link from "next/link";
import {
  Shirt,
  FolderTree,
  Sparkles,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import { formatISTTime, resolveImageUrl } from "@/lib/utils";
import type { AdminProduct, StoreStatusResponse, Category, AdminSection } from "@/types/api";

export default function AdminDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [products, setProducts] = React.useState<AdminProduct[]>([]);
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [sections, setSections] = React.useState<AdminSection[]>([]);
  const [storeStatus, setStoreStatus] = React.useState<StoreStatusResponse | null>(null);

  const toast = useToast();

  const loadDashboardData = React.useCallback(async (isMountedRef?: { current: boolean }) => {
    try {
      setLoading(true);
      const [prodRes, catRes, secRes, statusRes] = await Promise.all([
        adminApi.products.list({ page: 1, page_size: 6 }).catch(() => ({ items: [], total: 0 })),
        adminApi.categories.list().catch(() => []),
        adminApi.sections.list().catch(() => []),
        adminApi.store.getStatus().catch(() => null),
      ]);

      if (!isMountedRef || isMountedRef.current) {
        setProducts(prodRes.items || []);
        setTotalProducts(prodRes.total || 0);
        setCategories(Array.isArray(catRes) ? catRes : []);
        setSections(Array.isArray(secRes) ? secRes : []);
        setStoreStatus(statusRes);
      }
    } catch (err: unknown) {
      if (!isMountedRef || isMountedRef.current) {
        toast.error("Dashboard error", (err as Error).message);
      }
    } finally {
      if (!isMountedRef || isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [toast]);

  React.useEffect(() => {
    const isMounted = { current: true };
    loadDashboardData(isMounted);
    return () => {
      isMounted.current = false;
    };
  }, [loadDashboardData]);

  const handleToggleSoldOut = async (product: AdminProduct) => {
    try {
      const nextState = !product.manual_sold_out;
      const updated = await adminApi.products.updateSoldOut(product.id, nextState);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(
        nextState ? "Marked as Sold Out" : "Restored In-Stock",
        `Product '${product.name}' is now ${nextState ? "Sold Out" : "Available"}.`
      );
    } catch (err: unknown) {
      toast.error("Failed to toggle sold out", (err as Error).message);
    }
  };

  const soldOutCount = products.filter((p) => !p.is_available).length;
  const publishedCount = products.filter((p) => p.lifecycle_state === "PUBLISHED").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Store Dashboard</h1>
          <p className="text-sm text-zinc-600 mt-1">
            Real-time physical showroom overview, operating status, and catalog controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/products/new">
            <Button variant="primary" size="md">
              <PlusCircle className="w-4 h-4" />
              <span>Add Garment</span>
            </Button>
          </Link>
          <Link href="/admin/shop">
            <Button variant="outline" size="md">
              <Clock className="w-4 h-4" />
              <span>Store Hours</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-Time Shop Status Card */}
      <Card className="border-rose-100 bg-gradient-to-r from-rose-50/70 via-rose-50/40 to-amber-50/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`p-3.5 rounded-xl border flex-shrink-0 ${
                  storeStatus?.is_open
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {storeStatus?.is_open ? <CheckCircle className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-zinc-900">
                    Physical Store is {storeStatus?.is_open ? "OPEN NOW" : "CLOSED"}
                  </h2>
                  {storeStatus && (
                    <Badge variant={storeStatus.is_open ? "success" : "danger"}>
                      {storeStatus.effective_mode === "AUTO" ? "Schedule Active" : `Override: ${storeStatus.effective_mode}`}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-zinc-600 mt-1">
                  Current IST Time: <span className="text-zinc-900 font-medium">{formatISTTime(storeStatus?.current_time_ist)}</span>
                  {storeStatus?.today_schedule && !storeStatus.today_schedule.is_closed && (
                    <>
                      {" • "}Today: {storeStatus.today_schedule.open_time} - {storeStatus.today_schedule.close_time}
                    </>
                  )}
                </p>

                {storeStatus?.banner_message && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-burgundy bg-rose-100/60 border border-rose-200 px-3 py-1.5 rounded-lg max-w-xl font-medium">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Customer Notice: {storeStatus.banner_message}</span>
                  </div>
                )}
              </div>
            </div>

            <Link href="/admin/shop">
              <Button variant="outline" size="sm" className="w-full md:w-auto">
                <span>Manage Override</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Products */}
        <Card className="hover:border-zinc-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-semibold">Total Catalog</CardDescription>
              <Shirt className="w-4 h-4 text-burgundy" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold mt-1">
              {loading ? "..." : totalProducts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">{publishedCount} published to digital showroom</p>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="hover:border-zinc-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-semibold">Categories</CardDescription>
              <FolderTree className="w-4 h-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold mt-1">
              {loading ? "..." : categories.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">
              {categories.reduce((acc, c) => acc + c.subcategories.length, 0)} subcategories active
            </p>
          </CardContent>
        </Card>

        {/* Custom Sections */}
        <Card className="hover:border-zinc-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-semibold">Promotional Sections</CardDescription>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold mt-1">
              {loading ? "..." : sections.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">
              {sections.filter((s) => s.is_active).length} active on customer showcase
            </p>
          </CardContent>
        </Card>

        {/* Sold-Out Items */}
        <Card className="hover:border-zinc-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-semibold">Sold Out In Sample</CardDescription>
              <TrendingUp className="w-4 h-4 text-rose-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold mt-1 text-rose-700">
              {loading ? "..." : soldOutCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">Master or variant stock exhausted</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products & Quick Toggles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200">
          <div>
            <CardTitle className="text-lg font-bold">Catalog Management Preview</CardTitle>
            <CardDescription className="text-xs">
              Quick 1-click availability toggles for showroom products.
            </CardDescription>
          </div>
          <Link href="/admin/products">
            <Button variant="ghost" size="sm" className="text-xs text-burgundy hover:text-burgundy-700">
              <span>View Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600 text-xs uppercase font-semibold border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-6">Product</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">State</th>
                <th className="py-3.5 px-6">Availability</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    Loading catalog items...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    No products added yet. Click &quot;Add Garment&quot; to begin.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const primaryImg = product.images.find((i) => i.is_primary)?.url || product.images[0]?.url;
                  return (
                    <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {primaryImg ? (
                              <img src={resolveImageUrl(primaryImg)} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Shirt className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-900 block">{product.name}</span>
                            <span className="text-xs text-zinc-500">{product.material || "Garment"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-xs text-zinc-600 font-medium">
                          {product.subcategory?.name || "General"}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <Badge
                          variant={
                            product.lifecycle_state === "PUBLISHED"
                              ? "success"
                              : product.lifecycle_state === "DRAFT"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {product.lifecycle_state}
                        </Badge>
                      </td>

                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleSoldOut(product)}
                          className="group inline-flex items-center gap-1.5 focus:outline-none"
                          title="Click to toggle sold out state"
                        >
                          <Badge variant={product.is_available ? "success" : "danger"}>
                            {product.is_available ? "In Stock" : "Sold Out"}
                          </Badge>
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
