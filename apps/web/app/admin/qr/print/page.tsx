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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { QRCodeSVG } from "@/components/ui/qr-code";
import { adminApi } from "@/lib/api";
import type { Category, SubcategorySummary, QRPrintItem } from "@/types/api";

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

  // Label Size Config
  const [labelSize, setLabelSize] = React.useState<"standard" | "compact" | "large">("standard");

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

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Screen-Only Navigation & Header */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin/products" className="text-zinc-500 hover:text-zinc-800">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 font-serif flex items-center gap-3">
                <Printer className="w-8 h-8 text-burgundy" />
                QR Tag Printing Center
              </h1>
            </div>
            <p className="text-sm text-zinc-600 ml-8">
              Generate, preview, and print physical QR garment tags with unique Style Codes and showroom details.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrint}
              disabled={selectedIds.size === 0}
              className="bg-burgundy hover:bg-burgundy/90 text-white font-bold gap-2 px-6 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Selected ({selectedIds.size})
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <Card className="border-zinc-200 shadow-xs">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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

              {/* Label Size */}
              <Select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as "standard" | "compact" | "large")}
                className="text-sm"
              >
                <option value="standard">Standard Tag (2x3 in)</option>
                <option value="compact">Compact Tag (1.5x2 in)</option>
                <option value="large">Large Shelf Tag (3x4 in)</option>
              </Select>
            </div>

            {/* Selection Toolbar */}
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 font-medium text-zinc-800 hover:text-burgundy"
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
          Physical Label Sheets Preview ({selectedPrintItems.length} tags)
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
            className={`grid gap-4 print:gap-2 ${
              labelSize === "compact"
                ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 print:grid-cols-4"
                : labelSize === "large"
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
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer select-none bg-white text-zinc-950 flex flex-col items-center justify-between text-center print:border-zinc-800 print:rounded-none print:shadow-none ${
                    isSelected
                      ? "border-zinc-800 shadow-sm ring-1 ring-zinc-800"
                      : "border-zinc-200 opacity-40 hover:opacity-75 print:hidden"
                  }`}
                >
                  {/* Selection Indicator on Screen */}
                  <div className="absolute top-2.5 right-2.5 print:hidden">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-burgundy" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>

                  {/* Brand Header */}
                  <div className="w-full border-b border-zinc-100 pb-1.5 mb-2.5 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                    <span className="font-serif font-bold text-zinc-900 tracking-wider">KANGAYATH</span>
                    <span className="truncate max-w-[90px]">{item.category_name}</span>
                  </div>

                  {/* High-Resolution Vector QR Code */}
                  <div className="p-2 bg-white rounded border border-zinc-100 my-1 flex items-center justify-center">
                    <QRCodeSVG
                      value={item.qr_code}
                      size={labelSize === "compact" ? 90 : labelSize === "large" ? 140 : 110}
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                  </div>

                  {/* Style Code Underneath QR Code (CRITICAL REQUIREMENT) */}
                  <div className="my-2 w-full">
                    <span className="block font-mono font-bold text-xs tracking-wider text-zinc-950 px-1 py-0.5 bg-zinc-50 border border-zinc-200 rounded">
                      {item.style_code}
                    </span>
                  </div>

                  {/* Product Details & Price */}
                  <div className="w-full pt-1.5 border-t border-zinc-100 space-y-0.5">
                    <p className="font-semibold text-xs text-zinc-900 truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[11px] font-bold text-zinc-900">
                      {item.price ? `₹${Number(item.price).toLocaleString("en-IN")}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Print-specific style rules */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
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
