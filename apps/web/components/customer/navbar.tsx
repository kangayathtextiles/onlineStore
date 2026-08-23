"use client";

import * as React from "react";
import Image from "next/image";
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

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "All Garments", href: "/products" },
    { label: "Store & Hours", href: "/visit" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Top Notification Bar (If override banner or open notice) */}
      {status?.banner_message && (
        <div className="bg-burgundy px-4 py-1.5 text-center text-xs font-medium text-white flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{status.banner_message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center group py-2" title="KANGAYATH — Style For Everyone">
            <Image
              src="/brand/logo.png"
              alt="KANGAYATH"
              width={200}
              height={60}
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
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
                      ? "bg-zinc-100 text-zinc-900 font-bold"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
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
                className="py-1 px-3 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs hover:opacity-90"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status?.is_open ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
                />
                <span>{status?.is_open ? "STORE OPEN" : "STORE CLOSED"}</span>
              </Badge>
            </Link>

            {/* Search Icon */}
            <Link
              href="/products"
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              title="Search Catalog"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Saved Products Heart Icon with Badge */}
            <Link
              href="/saved"
              className="relative p-2 text-zinc-600 hover:text-rose-600 hover:bg-zinc-100 rounded-lg transition-colors"
              title="Saved Garments"
            >
              <Heart className={`w-5 h-5 ${savedCount > 0 ? "fill-rose-600 text-rose-600" : ""}`} />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in shadow-xs">
                  {savedCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 text-zinc-600 hover:text-zinc-900 md:hidden rounded-lg hover:bg-zinc-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          {/* Mobile Store Status Card */}
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-700 font-medium">Physical Store:</span>
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
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
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
