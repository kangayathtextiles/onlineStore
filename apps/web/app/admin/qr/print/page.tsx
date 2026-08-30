"use client";

import * as React from "react";
import Link from "next/link";
import {
  Printer,
  Search,
  CheckSquare,
  Square,
  QrCode,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Scissors,
  CircleDot,
  Tag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { QRCodeSVG } from "@/components/ui/qr-code";
import { adminApi } from "@/lib/api";
import type { Category, SubcategorySummary, QRPrintItem } from "@/types/api";

type TagTheme = "luxury" | "modern" | "vintage";
type TagSize = "standard" | "compact" | "large";

export default function AdminQRPrintPage() {
  const toast = useToast();

  const [items, setItems] = React.useState<QRPrintItem[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [subcategories, setSubcategories] = React.useState<SubcategorySummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [selectedSubcategory, setSelectedSubcategory] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState("");

  // Selected Items for Printing
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Label Styling Config
  const [tagTheme, setTagTheme] = React.useState<TagTheme>("luxury");
  const [tagSize, setTagSize] = React.useState<TagSize>("standard");
  const [showHolePunch, setShowHolePunch] = React.useState(true);
  const [showCutGuides, setShowCutGuides] = React.useState(true);
  const [showPrice, setShowPrice] = React.useState(true);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [catData, printData] = await Promise.all([
        adminApi.categories.list(),
        adminApi.qr.getPrintData({
          category_id: selectedCategory || undefined,
          subcategory_id: selectedSubcategory || undefined,
          operational_status: selectedStatus || undefined,
          search: search.trim() || undefined,
        }),
      ]);

      setCategories(catData);
      setItems(printData);

      // Select all by default when refreshed
      setSelectedIds(new Set(printData.map((i) => i.product_id)));
    } catch (err: unknown) {
      toast.error("Failed to load print data", (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSubcategory, selectedStatus, search, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory("");
    const cat = categories.find((c) => c.id === catId);
    setSubcategories(cat ? cat.subcategories : []);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.product_id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handlePrint = () => {
    if (selectedIds.size === 0) {
      toast.info("No Labels Selected", "Please select at least one garment label to print.");
      return;
    }
    window.print();
  };

  const selectedPrintItems = items.filter((i) => selectedIds.has(i.product_id));

  // QR Code pixel dimensions based on tag size
  const qrPixelSize = tagSize === "compact" ? 85 : tagSize === "large" ? 140 : 105;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Screen-Only Navigation & Header */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin/products" className="text-zinc-500 hover:text-zinc-800 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 font-serif flex items-center gap-3">
                <Printer className="w-8 h-8 text-burgundy" />
                QR Tag Printing Center
              </h1>
            </div>
            <p className="text-sm text-zinc-600 ml-8">
              Generate, preview, and print physical luxury garment swing tags with unique QR identifiers and Style Codes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrint}
              disabled={selectedIds.size === 0}
              className="bg-burgundy hover:bg-burgundy/90 text-white font-bold gap-2 px-6 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Selected ({selectedIds.size})
            </Button>
          </div>
        </div>

        {/* Filters & Styling Customizer Bar */}
        <Card className="border-zinc-200 shadow-xs">
          <CardContent className="p-4 space-y-4">
            {/* Top Row: Data Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search name, Style Code, QR..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

              {/* Category */}
              <Select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>

              {/* Subcategory */}
              <Select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory || subcategories.length === 0}
                className="text-sm"
              >
                <option value="">All Subcategories</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>

              {/* Status */}
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm"
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="SOLD_OUT">Sold Out</option>
                <option value="DAMAGED">Damaged</option>
              </Select>
            </div>

            {/* Bottom Row: Tag Style & Size Controls */}
            <div className="pt-3 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
              {/* Tag Theme */}
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold shrink-0" />
                <Select
                  value={tagTheme}
                  onChange={(e) => setTagTheme(e.target.value as TagTheme)}
                  className="text-xs font-medium"
                >
                  <option value="luxury">Luxury Swing Tag (Gold/Burgundy)</option>
                  <option value="modern">Modern Retail Barcode</option>
                  <option value="vintage">Vintage Handloom Heritage</option>
                </Select>
              </div>

              {/* Tag Size */}
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-zinc-500 shrink-0" />
                <Select
                  value={tagSize}
                  onChange={(e) => setTagSize(e.target.value as TagSize)}
                  className="text-xs font-medium"
                >
                  <option value="standard">Standard Swing Tag (2.25 × 3.5 in)</option>
                  <option value="compact">Compact Sticker Tag (1.75 × 2.25 in)</option>
                  <option value="large">Large Shelf / Stack Tag (3.5 × 4.5 in)</option>
                </Select>
              </div>

              {/* Toggle Options */}
              <div className="flex items-center gap-4 col-span-1 lg:col-span-3 justify-end text-xs text-zinc-700">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showHolePunch}
                    onChange={(e) => setShowHolePunch(e.target.checked)}
                    className="rounded border-zinc-300 text-burgundy focus:ring-burgundy"
                  />
                  <CircleDot className="w-3.5 h-3.5 text-zinc-500" />
                  Hole Punch Guide
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCutGuides}
                    onChange={(e) => setShowCutGuides(e.target.checked)}
                    className="rounded border-zinc-300 text-burgundy focus:ring-burgundy"
                  />
                  <Scissors className="w-3.5 h-3.5 text-zinc-500" />
                  Cut Guides
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded border-zinc-300 text-burgundy focus:ring-burgundy"
                  />
                  Showroom Price
                </label>
              </div>
            </div>

            {/* Selection Toolbar */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 font-medium text-zinc-800 hover:text-burgundy transition-colors"
              >
                {selectedIds.size === items.length && items.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-burgundy" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-400" />
                )}
                {selectedIds.size === items.length ? "Deselect All" : "Select All Available"}
              </button>

              <span>
                Showing {items.length} items &bull; <strong>{selectedIds.size}</strong> selected for print
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Label Print Grid (Used for screen preview and print media output) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700 print:hidden flex items-center gap-2">
          <QrCode className="w-4 h-4 text-zinc-500" />
          Physical Garment Tag Preview ({selectedPrintItems.length} tags)
        </h3>

        {loading ? (
          <div className="py-16 text-center text-zinc-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-burgundy" />
            Loading print labels...
          </div>
        ) : selectedPrintItems.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50 text-zinc-500">
            No products match the selected criteria or no items selected.
          </div>
        ) : (
          <div
            className={`grid gap-4 print:gap-3 ${
              tagSize === "compact"
                ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 print:grid-cols-4"
                : tagSize === "large"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3"
            }`}
          >
            {items.map((item) => {
              const isSelected = selectedIds.has(item.product_id);
              if (!isSelected && typeof window !== "undefined" && window.matchMedia("print").matches) {
                return null;
              }

              return (
                <div
                  key={item.product_id}
                  onClick={() => toggleSelectItem(item.product_id)}
                  className={`relative p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none bg-white text-zinc-950 flex flex-col items-center justify-between text-center print:rounded-lg print:shadow-none print:break-inside-avoid ${
                    showCutGuides ? "border-dashed" : "border-solid"
                  } ${
                    tagTheme === "luxury"
                      ? "border-zinc-300 ring-1 ring-zinc-100 print:border-zinc-800"
                      : tagTheme === "vintage"
                      ? "border-amber-700/30 bg-[#FAF7F2] print:border-zinc-800"
                      : "border-zinc-400 print:border-zinc-900"
                  } ${
                    isSelected
                      ? "shadow-md ring-2 ring-burgundy/40"
                      : "opacity-40 hover:opacity-75 print:hidden"
                  }`}
                  style={{
                    minHeight: tagSize === "compact" ? "200px" : tagSize === "large" ? "320px" : "260px",
                  }}
                >
                  {/* Selection Checkbox on Screen */}
                  <div className="absolute top-2.5 right-2.5 print:hidden z-10">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-burgundy" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>

                  {/* Hole Punch Indicator Guide */}
                  {showHolePunch && (
                    <div className="mb-2 flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full border border-dashed border-zinc-400 bg-zinc-50 print:border-zinc-600 print:bg-white" />
                    </div>
                  )}

                  {/* Luxury Brand Header */}
                  <div className="w-full pb-2 mb-2 border-b border-zinc-200/80">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-serif font-extrabold text-[12px] sm:text-[13px] tracking-widest text-zinc-950 uppercase">
                        KANGAYATH
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">
                      <span>TEXTILES</span>
                      <span>&bull;</span>
                      <span>KERALA</span>
                    </div>
                    {item.category_name && (
                      <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[9px] font-bold text-zinc-700 uppercase tracking-wider">
                        {item.category_name} {item.subcategory_name ? `• ${item.subcategory_name}` : ""}
                      </div>
                    )}
                  </div>

                  {/* QR Code Container with High Contrast & Register Guides */}
                  <div className="p-2 bg-white rounded-lg border border-zinc-200 shadow-xs my-1 relative flex items-center justify-center">
                    {/* Decorative Corner Guides */}
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-zinc-400" />
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-zinc-400" />
                    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-zinc-400" />
                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-zinc-400" />

                    <QRCodeSVG
                      value={item.qr_code}
                      size={qrPixelSize}
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                  </div>

                  {/* Style Code Underneath QR Code (Authoritative Monospace Badge) */}
                  <div className="my-1.5 w-full">
                    <span className="block font-mono font-bold text-[11px] sm:text-[12px] tracking-wider text-zinc-950 px-2 py-0.5 bg-zinc-100 border border-zinc-300 rounded shadow-2xs truncate">
                      {item.style_code}
                    </span>
                  </div>

                  {/* Garment Title */}
                  <div className="w-full pt-1">
                    <p className="font-bold text-[11px] sm:text-[12px] text-zinc-900 truncate leading-tight">
                      {item.name}
                    </p>
                  </div>

                  {/* Showroom Price & Verification Footer */}
                  {showPrice && (
                    <div className="w-full pt-1.5 mt-1 border-t border-zinc-200/80 flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-tight">
                        SHOWROOM MRP
                      </span>
                      <span className="font-bold text-[12px] sm:text-[13px] text-zinc-950 font-mono">
                        {item.price ? `₹${Number(item.price).toLocaleString("en-IN")}` : "SCAN IN-STORE"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clean Global Print Style Directives */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav,
          aside,
          header,
          footer,
          button,
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 0.5cm;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}
