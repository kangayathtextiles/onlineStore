"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import { formatISTTime } from "@/lib/utils";
import type {
  DayOfWeek,
  OperatingSchedule,
  OverrideMode,
  StoreProfile,
  StoreStatusResponse,
} from "@/types/api";

const DAYS_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default function AdminShopPage() {
  const toast = useToast();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<StoreProfile | null>(null);
  const [status, setStatus] = React.useState<StoreStatusResponse | null>(null);

  // Override Form
  const [overrideMode, setOverrideMode] = React.useState<OverrideMode>("AUTO");
  const [overrideBanner, setOverrideBanner] = React.useState("");
  const [isSavingOverride, setIsSavingOverride] = React.useState(false);

  // Profile Form
  const [name, setName] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [phonePrimary, setPhonePrimary] = React.useState("");
  const [phoneSecondary, setPhoneSecondary] = React.useState("");
  const [whatsappNumber, setWhatsappNumber] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [addressLine1, setAddressLine1] = React.useState("");
  const [addressLine2, setAddressLine2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [pincode, setPincode] = React.useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = React.useState("");
  const [showPrices, setShowPrices] = React.useState(true);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // Schedule State
  const [schedules, setSchedules] = React.useState<OperatingSchedule[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = React.useState(false);

  const loadStoreData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [profData, statusData] = await Promise.all([
        adminApi.store.get(),
        adminApi.store.getStatus(),
      ]);

      setProfile(profData);
      setName(profData.name || "");
      setTagline(profData.tagline || "");
      setPhonePrimary(profData.phone_primary || profData.primary_phone || "");
      setPhoneSecondary(profData.phone_secondary || "");
      setWhatsappNumber(profData.whatsapp_number || "");
      setEmail(profData.email || "");
      setAddressLine1(profData.address_line1 || "");
      setAddressLine2(profData.address_line2 || "");
      setCity(profData.city || profData.locality || profData.district || profData.panchayat || "");
      setState(profData.state || "Kerala");
      setPincode(profData.pincode || "");
      setGoogleMapsUrl(profData.google_maps_url || "");
      setShowPrices(profData.show_prices !== undefined ? profData.show_prices : true);

      setStatus(statusData);
      setOverrideMode(statusData.effective_mode);
      setOverrideBanner(statusData.banner_message || "");

      // Sort schedules
      const sorted = [...(profData.schedules || [])].sort(
        (a, b) => DAYS_ORDER.indexOf(a.day_of_week) - DAYS_ORDER.indexOf(b.day_of_week)
      );
      setSchedules(sorted);
    } catch (err: unknown) {
      toast.error("Failed to load store settings", (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // --- Handlers ---
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingOverride(true);
      const updated = await adminApi.store.setOverride({
        override_mode: overrideMode,
        override_banner: overrideBanner || undefined,
      });
      setStatus(updated);
      toast.success(
        "Operating Override Saved",
        `Current physical shop status is now ${updated.is_open ? "OPEN" : "CLOSED"}.`
      );
    } catch (err: unknown) {
      toast.error("Override failed", (err as Error).message);
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const updated = await adminApi.store.update({
        name: name.trim(),
        tagline: tagline.trim() || undefined,
        phone_primary: phonePrimary.trim(),
        primary_phone: phonePrimary.trim(),
        phone_secondary: phoneSecondary.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
        email: email.trim() || undefined,
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || undefined,
        city: city.trim(),
        locality: city.trim(),
        district: city.trim(),
        panchayat: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        google_maps_url: googleMapsUrl.trim() || undefined,
        show_prices: showPrices,
      });
      setProfile(updated);
      setName(updated.name || "");
      setTagline(updated.tagline || "");
      setPhonePrimary(updated.phone_primary || updated.primary_phone || "");
      setCity(updated.city || updated.locality || updated.district || "");
      setState(updated.state || "");
      setPincode(updated.pincode || "");
      setGoogleMapsUrl(updated.google_maps_url || "");
      toast.success("Store Profile Updated", "Contact and address information saved.");
    } catch (err: unknown) {
      toast.error("Profile save failed", (err as Error).message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleScheduleChange = (
    day: DayOfWeek,
    field: "is_closed" | "open_time" | "close_time",
    val: boolean | string
  ) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day_of_week === day ? { ...s, [field]: val } : s))
    );
  };

  const handleSaveSchedule = async () => {
    try {
      setIsSavingSchedule(true);
      const payload = schedules.map((s) => ({
        day_of_week: s.day_of_week,
        is_closed: s.is_closed,
        open_time: s.is_closed ? null : s.open_time,
        close_time: s.is_closed ? null : s.close_time,
      }));

      const updated = await adminApi.store.updateSchedule(payload);
      setSchedules(updated);
      toast.success("Weekly Hours Saved", "Store operating schedule updated.");
      loadStoreData();
    } catch (err: unknown) {
      toast.error("Schedule update failed", (err as Error).message);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="py-16 text-center text-zinc-500">
        <p>Loading physical store configuration and schedules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
          Shop Status & Store Profile
        </h1>
        <p className="text-sm text-zinc-600 mt-1">
          Manage live open/closed emergency overrides, address, WhatsApp contact, and weekly hours.
        </p>
      </div>

      {/* 1. Emergency Override & Status Control */}
      <Card className="border-rose-100 bg-gradient-to-r from-rose-50/70 via-rose-50/40 to-amber-50/30">
        <CardHeader className="border-b border-rose-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <CardTitle className="text-lg text-zinc-900">Real-Time Physical Store Status</CardTitle>
                <Badge variant={status?.is_open ? "success" : "danger"}>
                  {status?.is_open ? "STORE OPEN" : "STORE CLOSED"}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Current Time in IST: <span className="text-zinc-900 font-medium">{formatISTTime(status?.current_time_ist)}</span>
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Effective Mode:</span>
              <Badge variant="brand">{status?.effective_mode}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSaveOverride} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-700 mb-2">
                Select Operating Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setOverrideMode("AUTO")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    overrideMode === "AUTO"
                      ? "bg-rose-50 border-burgundy text-burgundy shadow-xs"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className="font-bold block text-sm">AUTO</span>
                  <span className="text-xs text-zinc-500 mt-1 block">
                    Follow regular weekly operating hours automatically.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOverrideMode("FORCE_OPEN")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    overrideMode === "FORCE_OPEN"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className="font-bold block text-sm">FORCE OPEN</span>
                  <span className="text-xs text-zinc-500 mt-1 block">
                    Keep store open for festival rush, late sales, or special events.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOverrideMode("FORCE_CLOSED")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    overrideMode === "FORCE_CLOSED"
                      ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className="font-bold block text-sm">FORCE CLOSED</span>
                  <span className="text-xs text-zinc-500 mt-1 block">
                    Emergency closure for temple festival, inventory day, or holiday.
                  </span>
                </button>
              </div>
            </div>

            <Input
              label="Customer Notice Banner (Optional)"
              placeholder="e.g., Happy Onam! Store open until 10:00 PM for festive shopping."
              value={overrideBanner}
              onChange={(e) => setOverrideBanner(e.target.value)}
              helperText="This banner is displayed on the customer digital showroom."
            />

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="md" type="submit" isLoading={isSavingOverride}>
                <Save className="w-4 h-4" />
                <span>Apply Status Override</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Weekly Operating Hours Editor */}
      <Card>
        <CardHeader className="border-b border-zinc-200">
          <CardTitle>Weekly Operating Hours (IST)</CardTitle>
          <CardDescription>
            Configure standard opening and closing times for each day of the week.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600 text-xs uppercase font-semibold border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-6">Day</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Open Time</th>
                <th className="py-3.5 px-6">Close Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {schedules.map((item) => (
                <tr key={item.day_of_week} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-zinc-900 uppercase text-xs">
                    {item.day_of_week}
                  </td>

                  <td className="py-3.5 px-6">
                    <Switch
                      checked={!item.is_closed}
                      onCheckedChange={(checked) =>
                        handleScheduleChange(item.day_of_week, "is_closed", !checked)
                      }
                      label={item.is_closed ? "Closed" : "Open"}
                    />
                  </td>

                  <td className="py-3.5 px-6">
                    <input
                      type="time"
                      disabled={item.is_closed}
                      value={item.open_time || "09:30"}
                      onChange={(e) =>
                        handleScheduleChange(item.day_of_week, "open_time", e.target.value)
                      }
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 disabled:opacity-30 shadow-xs"
                    />
                  </td>

                  <td className="py-3.5 px-6">
                    <input
                      type="time"
                      disabled={item.is_closed}
                      value={item.close_time || "21:00"}
                      onChange={(e) =>
                        handleScheduleChange(item.day_of_week, "close_time", e.target.value)
                      }
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 disabled:opacity-30 shadow-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-6 border-t border-zinc-200 flex justify-end">
            <Button variant="primary" size="md" onClick={handleSaveSchedule} isLoading={isSavingSchedule}>
              <Save className="w-4 h-4" />
              <span>Save Weekly Operating Hours</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Physical Store Profile Information */}
      <Card>
        <CardHeader className="border-b border-zinc-200">
          <CardTitle>Physical Store Details & Contact</CardTitle>
          <CardDescription>
            Contact numbers, WhatsApp communication line, and shop address displayed to nearby customers.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Store Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Tagline / Slogan"
                placeholder="e.g., Traditional Handlooms & Contemporary Silk"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Primary Phone"
                required
                value={phonePrimary}
                onChange={(e) => setPhonePrimary(e.target.value)}
              />
              <Input
                label="Secondary Phone (Optional)"
                value={phoneSecondary}
                onChange={(e) => setPhoneSecondary(e.target.value)}
              />
              <Input
                label="WhatsApp Number (For Direct Inquiries)"
                placeholder="+91 98765 43210"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
            </div>

            <Input
              label="Email Address (Optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Street Address Line 1"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
              <Input
                label="Address Line 2 (Landmark)"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City / Town"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                label="State"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <Input
                label="PIN Code"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </div>

            <Input
              label="Google Maps Location URL"
              placeholder="https://maps.google.com/?q=..."
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
            />

            {/* Global Price Visibility Master Switch */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl">
              <div>
                <span className="text-sm font-semibold text-zinc-900 block">Customer Product Prices</span>
                <span className="text-xs text-zinc-500 block mt-0.5">
                  When disabled, product prices are hidden across the entire customer website.
                </span>
              </div>
              <Switch
                checked={showPrices}
                onCheckedChange={setShowPrices}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-200">
              <Button variant="primary" size="md" type="submit" isLoading={isSavingProfile}>
                <Save className="w-4 h-4" />
                <span>Save Store Information</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
