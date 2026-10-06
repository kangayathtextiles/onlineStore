"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { publicApi } from "@/lib/api";
import { siteConfig } from "@/lib/site-config";
import type { StoreProfile } from "@/types/api";

export function CustomerFooter() {
  const [store, setStore] = React.useState<StoreProfile | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      try {
        const data = await publicApi.store.getProfile();
        if (isMounted) {
          setStore(data);
        }
      } catch {
        // Ignored
      }
    }
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const whatsappCleanNumber = store?.whatsapp_number
    ? store.whatsapp_number.replace(/[^0-9]/g, "")
    : siteConfig.contact.whatsapp;

  const storeAddress1 = store?.address_line1 || siteConfig.location.streetAddress;
  const storeLocality =
    store?.locality || store?.city || store?.district || siteConfig.location.locality;
  const storeDistrict = store?.district || siteConfig.location.district;
  const storeState = store?.state || siteConfig.location.state;
  const storePincode = store?.pincode || siteConfig.location.postalCode;
  const storeMapsUrl = store?.google_maps_url || siteConfig.location.googleMapsUrl;

  return (
    <footer className="border-t border-amber-950/10 bg-sand/80 text-zinc-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-4">
            <Link href="/" className="inline-block" title="KANGAYATH">
              <Image
                src="/brand/logo.png"
                alt="KANGAYATH"
                width={200}
                height={60}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {store?.tagline ||
                "Traditional handlooms, festive silks, and contemporary apparel curated for your family in Kerala."}
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${whatsappCleanNumber}?text=Hi%20Kangayath%2C%20I%20am%20exploring%20your%20digital%20showroom.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Col 2: Physical Store Location */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-zinc-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-burgundy" />
              <span>Visit Our Retail Store</span>
            </h3>
            <address className="not-italic text-xs text-zinc-600 space-y-1 leading-relaxed">
              <p className="font-semibold text-zinc-900">{store?.name || siteConfig.legalName}</p>
              <p>{storeAddress1}</p>
              {store?.address_line2 && <p>{store.address_line2}</p>}
              <p>
                {storeLocality}, {storeDistrict !== storeLocality ? `${storeDistrict}, ` : ""}
                {storeState} - {storePincode}
              </p>
            </address>

            {storeMapsUrl && (
              <div className="pt-1">
                <a
                  href={storeMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-burgundy hover:text-burgundy-700 transition-colors font-semibold"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Col 3: Quick Showroom Links */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-zinc-900">
              Digital Showroom
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/products" className="hover:text-burgundy transition-colors">
                  All Garments Catalog
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-burgundy transition-colors">
                  Saved Garments Wishlist
                </Link>
              </li>
              <li>
                <Link href="/visit" className="hover:text-burgundy transition-colors">
                  Physical Store Hours &amp; Map
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Digital Discovery Policy */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-zinc-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Physical Retail Policy</span>
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              This website is an online catalog to discover current stock availability before visiting.
              We do not provide online checkout or shipping. Try on and purchase in store!
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} KANGAYATH. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Physical Store Product Discovery Platform</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
