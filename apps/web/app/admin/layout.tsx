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
  Menu,
  X,
  Clock,
  ExternalLink,
  Store as StoreIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import type { StoreStatusResponse, OverrideMode } from "@/types/api";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Shirt },
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

  const fetchStatus = React.useCallback(async () => {
    try {
      const data = await adminApi.store.getStatus();
      setStoreStatus(data);
      setOverrideMode(data.effective_mode);
      setOverrideBanner(data.banner_message || "");
    } catch {
      // Ignored if offline in dev
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30s live poll
    return () => clearInterval(interval);
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-burgundy to-wine flex items-center justify-center shadow-glow">
            <StoreIcon className="w-5 h-5 text-rose-100" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider text-zinc-100 uppercase">KANGAYATH</h1>
            <p className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase">Admin Control Center</p>
          </div>
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
                    ? "bg-burgundy text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-zinc-800/60 text-xs text-zinc-500 flex flex-col gap-1">
          <span className="font-medium text-zinc-400">Physical Store Control</span>
          <span>Timezone: Asia/Kolkata (IST)</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 text-zinc-100"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-sm tracking-wider uppercase">KANGAYATH</span>
          </div>

          {/* Quick Real-Time Shop Status Pill */}
          <div className="flex items-center gap-4 ml-auto">
            {storeStatus ? (
              <button
                onClick={() => setIsOverrideModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 transition-all text-xs"
                title="Click to toggle emergency shop status override"
              >
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full animate-pulse",
                    storeStatus.is_open ? "bg-emerald-400" : "bg-rose-500"
                  )}
                />
                <span className="font-semibold text-zinc-200">
                  {storeStatus.is_open ? "Shop Open" : "Shop Closed"}
                </span>
                {storeStatus.effective_mode !== "AUTO" && (
                  <Badge variant="warning" className="text-[10px] py-0 px-1.5">
                    {storeStatus.effective_mode}
                  </Badge>
                )}
                <Clock className="w-3.5 h-3.5 text-zinc-400 ml-1" />
              </button>
            ) : (
              <Badge variant="neutral">Connecting API...</Badge>
            )}

            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors border border-zinc-800 bg-zinc-900 px-3 py-1.5 rounded-lg"
            >
              <span>Customer Preview</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-800 bg-zinc-900 px-4 py-4 space-y-1">
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
                    isActive ? "bg-burgundy text-white font-semibold" : "text-zinc-400 hover:bg-zinc-800 text-zinc-200"
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
            <label className="block text-xs font-semibold uppercase text-zinc-400">Operating Mode</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setOverrideMode("AUTO")}
                className={cn(
                  "p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all",
                  overrideMode === "AUTO"
                    ? "bg-burgundy/20 border-burgundy text-rose-100"
                    : "bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                )}
              >
                <span>AUTO</span>
                <span className="text-[10px] font-normal text-zinc-400">Weekly Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => setOverrideMode("FORCE_OPEN")}
                className={cn(
                  "p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all",
                  overrideMode === "FORCE_OPEN"
                    ? "bg-emerald-950/40 border-emerald-500 text-emerald-200"
                    : "bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                )}
              >
                <span>FORCE OPEN</span>
                <span className="text-[10px] font-normal text-zinc-400">Extended Hours</span>
              </button>

              <button
                type="button"
                onClick={() => setOverrideMode("FORCE_CLOSED")}
                className={cn(
                  "p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all",
                  overrideMode === "FORCE_CLOSED"
                    ? "bg-rose-950/40 border-rose-500 text-rose-200"
                    : "bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                )}
              >
                <span>FORCE CLOSED</span>
                <span className="text-[10px] font-normal text-zinc-400">Emergency Holiday</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">Customer Notice Banner (Optional)</label>
            <input
              type="text"
              value={overrideBanner}
              onChange={(e) => setOverrideBanner(e.target.value)}
              placeholder="e.g., Closed today for Onam Temple Celebrations"
              className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-burgundy"
            />
            <p className="text-[11px] text-zinc-500">Displayed prominently to customers on the digital showroom.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
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
  return (
    <ToastProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ToastProvider>
  );
}
