"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shirt,
  FolderTree,
  Palette,
  Sparkles,
  Store,
  QrCode,
  Printer,
  Menu,
  X,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import type { StoreStatusResponse, OverrideMode } from "@/types/api";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Shirt },
  { name: "QR Scanner", href: "/admin/qr/scanner", icon: QrCode },
  { name: "QR Print", href: "/admin/qr/print", icon: Printer },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Sizes & Colors", href: "/admin/attributes", icon: Palette },
  { name: "Custom Sections", href: "/admin/sections", icon: Sparkles },
  { name: "Shop Status & Info", href: "/admin/shop", icon: Store },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [storeStatus, setStoreStatus] = React.useState<StoreStatusResponse | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false);
  const [overrideMode, setOverrideMode] = React.useState<OverrideMode>("AUTO");
  const [overrideBanner, setOverrideBanner] = React.useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const toast = useToast();

  const fetchStatus = React.useCallback(async (isMountedRef?: { current: boolean }) => {
    try {
      const data = await adminApi.store.getStatus();
      if (!isMountedRef || isMountedRef.current) {
        setStoreStatus(data);
        setOverrideMode(data.effective_mode);
        setOverrideBanner(data.banner_message || "");
      }
    } catch {
      // Ignored if offline in dev
    }
  }, []);

  React.useEffect(() => {
    const isMounted = { current: true };
    fetchStatus(isMounted);
    const interval = setInterval(() => fetchStatus(isMounted), 30000); // 30s live poll
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchStatus]);

  const handleApplyOverride = async () => {
    setIsUpdatingStatus(true);
    try {
      const updated = await adminApi.store.setOverride({
        override_mode: overrideMode,
        override_banner: overrideBanner || undefined,
      });
      setStoreStatus(updated);
      setIsOverrideModalOpen(false);
      toast.success("Shop status updated", `Current mode: ${updated.effective_mode}`);
    } catch (err: unknown) {
      toast.error("Failed to update status", (err as Error).message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 bg-white sticky top-0 h-screen z-30 shadow-xs">
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-200 flex items-center gap-3">
          <Link href="/admin" className="block" title="KANGAYATH Admin">
            <img
              src="/brand/logo.png"
              alt="KANGAYATH Admin"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-burgundy text-white shadow-xs font-semibold"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-800"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-zinc-200 text-xs text-zinc-500 flex flex-col gap-1">
          <span className="font-medium text-zinc-700">Physical Store Control</span>
          <span>Timezone: Asia/Kolkata (IST)</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between shadow-xs">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <img
              src="/brand/logo.png"
              alt="KANGAYATH"
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Quick Real-Time Shop Status Pill */}
          <div className="flex items-center gap-4 ml-auto">
            {storeStatus ? (
              <button
                onClick={() => setIsOverrideModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-all text-xs"
                title="Click to toggle emergency shop status override"
              >
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full animate-pulse",
                    storeStatus.is_open ? "bg-emerald-500" : "bg-rose-500"
                  )}
                />
                <span className="font-semibold text-zinc-800">
                  {storeStatus.is_open ? "Shop Open" : "Shop Closed"}
                </span>
                {storeStatus.effective_mode !== "AUTO" && (
                  <Badge variant="warning" className="text-[10px] py-0 px-1.5">
                    {storeStatus.effective_mode}
                  </Badge>
                )}
                <Clock className="w-3.5 h-3.5 text-zinc-500 ml-1" />
              </button>
            ) : (
              <Badge variant="neutral">Connecting API...</Badge>
            )}

            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors border border-zinc-200 bg-white px-3 py-1.5 rounded-lg shadow-xs"
            >
              <span>Customer Preview</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 bg-white px-4 py-4 space-y-1 shadow-lg">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-burgundy text-white font-semibold" : "text-zinc-600 hover:bg-zinc-100 text-zinc-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Fast Emergency Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Emergency Shop Status Control"
        description="Override regular weekly schedule for temple holidays, unexpected weather, or festival extensions."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase text-zinc-500">Operating Mode</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setOverrideMode("AUTO")}
                className={cn(
                  "p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all",
                  overrideMode === "AUTO"
                    ? "bg-rose-50 border-burgundy text-burgundy"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                )}
              >
                <span>AUTO</span>
                <span className="text-[10px] font-normal text-zinc-500">Weekly Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => setOverrideMode("FORCE_OPEN")}
                className={cn(
                  "p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all",
                  overrideMode === "FORCE_OPEN"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                )}
              >
                <span>FORCE OPEN</span>
                <span className="text-[10px] font-normal text-zinc-500">Extended Hours</span>
              </button>

              <button
                type="button"
                onClick={() => setOverrideMode("FORCE_CLOSED")}
                className={cn(
                  "p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all",
                  overrideMode === "FORCE_CLOSED"
                    ? "bg-rose-50 border-rose-500 text-rose-800"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                )}
              >
                <span>FORCE CLOSED</span>
                <span className="text-[10px] font-normal text-zinc-500">Emergency Holiday</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">Customer Notice Banner (Optional)</label>
            <input
              type="text"
              value={overrideBanner}
              onChange={(e) => setOverrideBanner(e.target.value)}
              placeholder="e.g., Closed today for Onam Temple Celebrations"
              className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-burgundy"
            />
            <p className="text-[11px] text-zinc-500">Displayed prominently to customers on the digital showroom.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
            <Button variant="outline" onClick={() => setIsOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApplyOverride} isLoading={isUpdatingStatus}>
              Apply Override
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}
