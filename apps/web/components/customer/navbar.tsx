"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Heart,
  Menu,
  X,
  Clock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSavedItems } from "@/lib/saved-items-context";
import { publicApi } from "@/lib/api";
import type { StoreStatusResponse } from "@/types/api";

export function CustomerNavbar() {
  const pathname = usePathname();
  const { savedCount } = useSavedItems();
  const [status, setStatus] = React.useState<StoreStatusResponse | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await publicApi.store.getStatus();
        setStatus(data);
      } catch {
        // Ignored
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "All Garments", href: "/products" },
    { label: "Store & Hours", href: "/visit" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      {/* Top Notification Bar (If override banner or open notice) */}
      {status?.banner_message && (
        <div className="bg-burgundy px-4 py-1.5 text-center text-xs font-medium text-rose-100 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{status.banner_message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-burgundy to-wine border border-zinc-700 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-lg text-white tracking-wider">K</span>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-100 group-hover:text-rose-200 transition-colors">
                KANGAYATH
              </span>
              <span className="block text-[10px] uppercase font-semibold text-rose-400/90 tracking-widest -mt-1">
                Digital Showroom
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-zinc-800/80 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Live Status */}
          <div className="flex items-center gap-3">
            {/* Live Physical Store Status Pill */}
            <Link href="/visit" className="hidden sm:flex items-center" title="Click to view shop location & hours">
              <Badge
                variant={status?.is_open ? "success" : "danger"}
                className="py-1 px-3 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm hover:opacity-90"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status?.is_open ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                  }`}
                />
                <span>{status?.is_open ? "STORE OPEN" : "STORE CLOSED"}</span>
              </Badge>
            </Link>

            {/* Search Icon */}
            <Link
              href="/products"
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors"
              title="Search Catalog"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Saved Products Heart Icon with Badge */}
            <Link
              href="/saved"
              className="relative p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-colors"
              title="Saved Garments"
            >
              <Heart className={`w-5 h-5 ${savedCount > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                  {savedCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 text-zinc-400 hover:text-zinc-100 md:hidden rounded-lg hover:bg-zinc-900 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 pt-3 pb-6 space-y-3">
          {/* Mobile Store Status Card */}
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-300">Physical Store:</span>
            </div>
            <Badge variant={status?.is_open ? "success" : "danger"} className="text-xs">
              {status?.is_open ? "OPEN NOW" : "CLOSED NOW"}
            </Badge>
          </div>

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === link.href
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
            >
              <span>Saved Garments</span>
              {savedCount > 0 && <Badge variant="brand">{savedCount}</Badge>}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
