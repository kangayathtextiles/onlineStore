"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { publicApi } from "@/lib/api";
import type { StoreProfile } from "@/types/api";

export function CustomerFooter() {
  const [store, setStore] = React.useState<StoreProfile | null>(null);

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await publicApi.store.getProfile();
        setStore(data);
      } catch {
        // Ignored
      }
    }
    fetchProfile();
  }, []);

  const whatsappCleanNumber = store?.whatsapp_number
    ? store.whatsapp_number.replace(/[^0-9]/g, "")
    : "919876543210";

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-burgundy to-wine border border-zinc-700 flex items-center justify-center shadow-glow">
                <span className="font-extrabold text-base text-white">K</span>
              </div>
              <span className="text-lg font-extrabold tracking-tight text-zinc-100">
                {store?.name || "KANGAYATH"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {store?.tagline ||
                "Traditional handlooms, festive silks, and contemporary apparel curated for your family."}
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${whatsappCleanNumber}?text=Hi%20Kangayath%2C%20I%20am%20exploring%20your%20digital%20showroom.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-xs font-semibold hover:bg-emerald-900/80 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Col 2: Physical Store Location */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Visit Our Retail Store</span>
            </h3>
            <address className="not-italic text-xs text-zinc-400 space-y-1 leading-relaxed">
              <p className="font-semibold text-zinc-200">{store?.name || "Kangayath Clothing"}</p>
              <p>{store?.address_line1 || "Main Commercial Street"}</p>
              {store?.address_line2 && <p>{store.address_line2}</p>}
              <p>
                {store?.city || "Thrissur"}, {store?.state || "Kerala"} - {store?.pincode || "680001"}
              </p>
            </address>

            {store?.google_maps_url && (
              <div className="pt-1">
                <a
                  href={store.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Col 3: Quick Showroom Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Digital Showroom
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/products" className="hover:text-zinc-100 transition-colors">
                  All Garments Catalog
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-zinc-100 transition-colors">
                  Saved Garments Wishlist
                </Link>
              </li>
              <li>
                <Link href="/visit" className="hover:text-zinc-100 transition-colors">
                  Physical Store Hours & Map
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-zinc-600 hover:text-zinc-400 transition-colors">
                  Store Management Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Digital Discovery Policy */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Physical Retail Policy</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This website is an online catalog to discover current stock availability before visiting.
              We do not provide online checkout or shipping. Try on and purchase in store!
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} KANGAYATH. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Physical Store Product Discovery Platform</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
