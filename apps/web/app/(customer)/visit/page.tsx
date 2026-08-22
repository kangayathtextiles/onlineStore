"use client";

import * as React from "react";
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Car,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { publicApi } from "@/lib/api";
import { formatISTTime } from "@/lib/utils";
import type { DayOfWeek, StoreProfile, StoreStatusResponse } from "@/types/api";

const DAYS_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default function VisitStorePage() {
  const [profile, setProfile] = React.useState<StoreProfile | null>(null);
  const [status, setStatus] = React.useState<StoreStatusResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function loadStoreInfo() {
      try {
        setLoading(true);
        const [profData, statusData] = await Promise.all([
          publicApi.store.getProfile().catch(() => null),
          publicApi.store.getStatus().catch(() => null),
        ]);
        if (isMounted) {
          setProfile(profData);
          setStatus(statusData);
        }
      } catch {
        // Ignored
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadStoreInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  const whatsappNumber = profile?.whatsapp_number
    ? profile.whatsapp_number.replace(/[^0-9]/g, "")
    : "919876543210";

  const sortedSchedules = profile?.schedules
    ? [...profile.schedules].sort(
        (a, b) => DAYS_ORDER.indexOf(a.day_of_week) - DAYS_ORDER.indexOf(b.day_of_week)
      )
    : [];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-wine border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-400 font-mono text-xs">Loading store hours & directions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 pb-20">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-burgundy">
          Physical Retail Location
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900">
          Visit Our Store in {profile?.city || "Thrissur"}
        </h1>
        <p className="text-sm text-zinc-600">
          Explore our complete collection in person. Try garments in our fitting rooms and get styling
          assistance from our staff.
        </p>
      </div>

      {/* Real-Time Operating Status Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50/70 via-rose-50/40 to-amber-50/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-200/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-zinc-900">Physical Store Status</h2>
              <Badge variant={status?.is_open ? "success" : "danger"} className="text-xs shadow-xs">
                {status?.is_open ? "OPEN NOW" : "CURRENTLY CLOSED"}
              </Badge>
            </div>
            <p className="text-xs text-zinc-600">
              Current Time in IST:{" "}
              <strong className="text-zinc-900">{formatISTTime(status?.current_time_ist)}</strong>
            </p>
          </div>

          <a
            href={`https://wa.me/${whatsappNumber}?text=Hi%20Kangayath%2C%20I%20am%20planning%20to%20visit%20your%20store.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        {status?.banner_message && (
          <div className="p-3 rounded-xl bg-burgundy text-white text-xs flex items-center gap-2 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-200 flex-shrink-0" />
            <span>{status.banner_message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Address, Phone, Google Maps */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4 text-burgundy" />
                <span>Store Address & Contact</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Located in the main shopping district with convenient parking.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs text-zinc-600">
              <address className="not-italic space-y-1 bg-zinc-50 p-4 rounded-xl border border-zinc-200 leading-relaxed">
                <p className="font-bold text-sm text-zinc-900">{profile?.name || "KANGAYATH"}</p>
                <p>{profile?.address_line1}</p>
                {profile?.address_line2 && <p>{profile.address_line2}</p>}
                <p>
                  {profile?.city}, {profile?.state} - {profile?.pincode}
                </p>
              </address>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <span>Primary Phone:</span>
                  </div>
                  <a
                    href={`tel:${profile?.phone_primary}`}
                    className="font-bold text-zinc-900 hover:text-burgundy transition-colors"
                  >
                    {profile?.phone_primary || "+91 98765 43210"}
                  </a>
                </div>

                {profile?.whatsapp_number && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                    <div className="flex items-center gap-2.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Direct:</span>
                    </div>
                    <span className="font-bold text-emerald-700">{profile.whatsapp_number}</span>
                  </div>
                )}
              </div>

              {profile?.google_maps_url && (
                <div className="pt-2">
                  <a
                    href={profile.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-burgundy hover:bg-burgundy-700 text-white font-bold transition-colors shadow-xs"
                  >
                    <MapPin className="w-4 h-4 text-rose-200" />
                    <span>Open in Google Maps Directions</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Store Experience Amenities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-zinc-200 bg-white text-center space-y-1 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
              <p className="font-bold text-xs text-zinc-900">Fitting Rooms</p>
              <p className="text-[10px] text-zinc-500">Try before purchase</p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 bg-white text-center space-y-1 shadow-xs">
              <CreditCard className="w-5 h-5 text-burgundy mx-auto" />
              <p className="font-bold text-xs text-zinc-900">All Payments</p>
              <p className="text-[10px] text-zinc-500">UPI, Cards & Cash</p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 bg-white text-center space-y-1 shadow-xs">
              <Car className="w-5 h-5 text-amber-600 mx-auto" />
              <p className="font-bold text-xs text-zinc-900">Free Parking</p>
              <p className="text-[10px] text-zinc-500">Customer parking area</p>
            </div>
          </div>
        </div>

        {/* Right Column: 7-Day Weekly Operating Hours */}
        <div>
          <Card>
            <CardHeader className="border-b border-zinc-200">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-burgundy" />
                <span>Weekly Store Hours (IST)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Indian Standard Time (UTC+05:30)
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-zinc-100">
                {sortedSchedules.map((s) => (
                  <div
                    key={s.day_of_week}
                    className="p-4 flex items-center justify-between text-xs hover:bg-zinc-50 transition-colors"
                  >
                    <span className="font-bold uppercase tracking-wider text-zinc-800">
                      {s.day_of_week}
                    </span>

                    {s.is_closed ? (
                      <Badge variant="neutral" className="text-[10px]">
                        CLOSED
                      </Badge>
                    ) : (
                      <span className="font-mono text-zinc-600">
                        {s.open_time} – {s.close_time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
