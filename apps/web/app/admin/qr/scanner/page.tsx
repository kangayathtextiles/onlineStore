"use client";

import * as React from "react";
import Link from "next/link";
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Ban,
  Camera,
  CameraOff,
  History,
  Tag,
  Printer,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { QRScanResponse, QRActionType } from "@/types/api";

export default function AdminQRScannerPage() {
  const toast = useToast();

  const [inputCode, setInputCode] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [isActing, setIsActing] = React.useState(false);
  const [scannedProduct, setScannedProduct] = React.useState<QRScanResponse | null>(null);
  const [scanHistory, setScanHistory] = React.useState<QRScanResponse[]>([]);

  // Camera Scanner State
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  // Search/Lookup by QR Code or Style Code
  const handleLookup = async (codeToLookup?: string) => {
    let query = (typeof codeToLookup === "string" ? codeToLookup : "").trim();
    if (!query) {
      query = inputCode.trim();
    }
    if (!query && typeof document !== "undefined") {
      const inputEl = document.querySelector('input[placeholder*="Scan or enter"]') as HTMLInputElement | null;
      if (inputEl && inputEl.value) {
        query = inputEl.value.trim();
      }
    }

    if (!query) {
      toast.info("Enter QR Code", "Please enter or scan a valid QR Code or Style Code.");
      return;
    }

    try {
      setIsSearching(true);
      const product = await adminApi.qr.lookup(query);
      setScannedProduct(product);
      setInputCode(product.qr_code);

      // Add to session history
      setScanHistory((prev) => {
        const filtered = prev.filter((p) => p.product_id !== product.product_id);
        return [product, ...filtered].slice(0, 10);
      });

      toast.success("Product Identified", `${product.name} (${product.style_code})`);
    } catch (err: unknown) {
      toast.error("Lookup Failed", (err as Error).message || "Could not find physical product with this QR code.");
    } finally {
      setIsSearching(false);
    }
  };

  // Execute one of the 3 authoritative lifecycle actions
  const handleAction = async (action: QRActionType) => {
    if (!scannedProduct) return;

    try {
      setIsActing(true);
      const updated = await adminApi.qr.executeAction({
        qr_code: scannedProduct.qr_code,
        action,
      });

      setScannedProduct(updated);

      // Update in history
      setScanHistory((prev) =>
        prev.map((p) => (p.product_id === updated.product_id ? updated : p))
      );

      if (action === "SOLD_OUT") {
        toast.success("Marked SOLD OUT", `${updated.name} has been marked sold out.`);
      } else if (action === "DAMAGED") {
        toast.info("Marked DAMAGED", `${updated.name} has been removed from customer showroom.`);
      } else if (action === "RETURN") {
        toast.success("RETURN Processed", `${updated.name} is now back in available showroom stock.`);
      }
    } catch (err: unknown) {
      toast.error("Action Failed", (err as Error).message);
    } finally {
      setIsActing(false);
    }
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera video access is not supported by your browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const msg = (err as Error).message || "Could not access device camera.";
      setCameraError(msg);
      setCameraActive(false);
      toast.error("Camera Unavailable", msg);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const getStatusBadge = (status: string, isDamaged: boolean, manualSoldOut: boolean) => {
    if (isDamaged) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5" />
          DAMAGED (UNSELLABLE)
        </span>
      );
    }
    if (status === "SOLD_OUT" || manualSoldOut) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
          <Ban className="w-3.5 h-3.5" />
          SOLD OUT
        </span>
      );
    }
    if (status === "RETIRED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-300">
          RETIRED (2-YR RETENTION)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5" />
        AVAILABLE IN SHOWROOM
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 font-serif flex items-center gap-3">
            <QrCode className="w-8 h-8 text-burgundy" />
            Physical QR Scanner
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Scan physical garment QR labels to immediately identify products and perform lifecycle actions: SOLD OUT, DAMAGED, or RETURN.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/qr/print">
            <Button variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              Print QR Labels
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Scanner View & Manual Input */}
        <div className="lg:col-span-5 space-y-6">
          {/* Camera Viewfinder Card */}
          <Card className="overflow-hidden border-zinc-200 shadow-sm">
            <CardHeader className="bg-zinc-50/80 border-b border-zinc-200 py-3.5 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-zinc-700" />
                  Live Camera Scanner
                </CardTitle>
              </div>
              {cameraActive ? (
                <Button size="sm" variant="outline" onClick={stopCamera} className="h-7 text-xs gap-1 text-rose-700 border-rose-200">
                  <CameraOff className="w-3.5 h-3.5" /> Stop
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={startCamera} className="h-7 text-xs gap-1 text-burgundy border-burgundy/30">
                  <Camera className="w-3.5 h-3.5" /> Start Camera
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-4">
              <div className="relative aspect-video sm:aspect-square bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />

                {!cameraActive && (
                  <div className="text-center p-6 text-zinc-400 space-y-3">
                    <QrCode className="w-12 h-12 mx-auto text-zinc-600 stroke-[1.5]" />
                    <p className="text-xs text-zinc-400 max-w-xs">
                      Click &quot;Start Camera&quot; to scan product tags directly, or use a handheld barcode gun / manual input below.
                    </p>
                    {cameraError && (
                      <p className="text-xs text-rose-400 bg-rose-950/50 p-2 rounded border border-rose-800">
                        {cameraError}
                      </p>
                    )}
                  </div>
                )}

                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-emerald-400 rounded-xl relative shadow-[0_0_15px_rgba(52,211,153,0.3)] animate-pulse">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Input Card / Barcode Gun Input */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="py-3 px-4 bg-zinc-50 border-b border-zinc-200">
              <CardTitle className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                Manual / Gun Scanner Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookup();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    name="query"
                    type="text"
                    placeholder="Scan or enter QR token / Style Code..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="pl-9 font-mono uppercase text-sm tracking-wide"
                  />
                </div>
                <Button
                  type="submit"
                  onClick={() => handleLookup()}
                  disabled={isSearching}
                  className="bg-burgundy hover:bg-burgundy/90 gap-2 shrink-0"
                >
                  {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Identify
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Scans Session History */}
          {scanHistory.length > 0 && (
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="py-3 px-4 bg-zinc-50 border-b border-zinc-200 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-zinc-500" />
                  Recent Scans ({scanHistory.length})
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setScanHistory([])}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 underline"
                >
                  Clear
                </button>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-zinc-100 max-h-56 overflow-y-auto">
                {scanHistory.map((item) => (
                  <button
                    key={item.product_id}
                    type="button"
                    onClick={() => handleLookup(item.qr_code)}
                    className="w-full text-left p-3 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate">
                      <p className="font-semibold text-zinc-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">{item.style_code}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">
                      {item.operational_status}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Scanned Product Identification & 3 Actions */}
        <div className="lg:col-span-7">
          {scannedProduct ? (
            <Card className="border-zinc-300 shadow-md bg-white overflow-hidden">
              {/* Product Header */}
              <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded bg-white/10 text-white text-[11px] font-mono tracking-wider font-semibold border border-white/20">
                      QR IDENTIFIED
                    </span>
                    <span className="text-zinc-400 text-xs font-mono">{scannedProduct.qr_code}</span>
                  </div>
                  <h2 className="text-xl font-bold font-serif">{scannedProduct.name}</h2>
                </div>

                <div>
                  {getStatusBadge(
                    scannedProduct.operational_status,
                    scannedProduct.is_damaged,
                    scannedProduct.manual_sold_out
                  )}
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Product Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm">
                  <div>
                    <span className="text-xs text-zinc-500 font-medium block">Style Code</span>
                    <span className="font-mono font-bold text-zinc-900 text-base">{scannedProduct.style_code || "N/A"}</span>
                  </div>

                  <div>
                    <span className="text-xs text-zinc-500 font-medium block">Category / Section</span>
                    <span className="font-semibold text-zinc-800">
                      {scannedProduct.category_name} &rsaquo; {scannedProduct.subcategory_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-zinc-500 font-medium block">Retail Price</span>
                    <span className="font-bold text-burgundy text-base">
                      {scannedProduct.price ? `₹${Number(scannedProduct.price).toLocaleString("en-IN")}` : "Unset"}
                    </span>
                  </div>
                </div>

                {/* Available Variants */}
                {scannedProduct.variants.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                      Registered Variants ({scannedProduct.variants.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {scannedProduct.variants.map((v) => (
                        <span
                          key={v.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border ${
                            v.is_available
                              ? "bg-white text-zinc-800 border-zinc-300 shadow-xs"
                              : "bg-zinc-100 text-zinc-400 border-zinc-200 line-through"
                          }`}
                        >
                          {v.size?.name || "Standard"} / {v.color?.name || "Standard"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Authoritative 3-Action Panel */}
                <div className="border-t border-zinc-200 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-burgundy" />
                      Physical Showroom Lifecycle Actions
                    </h3>
                    <span className="text-xs text-zinc-400">Click to update status</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1. SOLD OUT */}
                    <button
                      type="button"
                      disabled={isActing || scannedProduct.operational_status === "SOLD_OUT"}
                      onClick={() => handleAction("SOLD_OUT")}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                        scannedProduct.operational_status === "SOLD_OUT"
                          ? "bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20 opacity-90 cursor-default"
                          : "bg-white hover:bg-rose-50/50 hover:border-rose-300 text-zinc-800 border-zinc-200 shadow-xs active:scale-98"
                      }`}
                    >
                      <Ban className="w-6 h-6 text-rose-600" />
                      <span className="font-bold text-sm">SOLD OUT</span>
                      <span className="text-[11px] text-zinc-500 leading-tight">
                        Mark physical piece as sold in store
                      </span>
                    </button>

                    {/* 2. DAMAGED */}
                    <button
                      type="button"
                      disabled={isActing || scannedProduct.is_damaged}
                      onClick={() => handleAction("DAMAGED")}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                        scannedProduct.is_damaged
                          ? "bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-500/20 opacity-90 cursor-default"
                          : "bg-white hover:bg-amber-50/50 hover:border-amber-300 text-zinc-800 border-zinc-200 shadow-xs active:scale-98"
                      }`}
                    >
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                      <span className="font-bold text-sm">DAMAGED</span>
                      <span className="text-[11px] text-zinc-500 leading-tight">
                        Hide from customer site immediately
                      </span>
                    </button>

                    {/* 3. RETURN */}
                    <button
                      type="button"
                      disabled={isActing || (!scannedProduct.manual_sold_out && !scannedProduct.is_damaged)}
                      onClick={() => handleAction("RETURN")}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                        !scannedProduct.manual_sold_out && !scannedProduct.is_damaged
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20 opacity-90 cursor-default"
                          : "bg-white hover:bg-emerald-50/50 hover:border-emerald-300 text-zinc-800 border-zinc-200 shadow-xs active:scale-98"
                      }`}
                    >
                      <RotateCcw className="w-6 h-6 text-emerald-600" />
                      <span className="font-bold text-sm">RETURN</span>
                      <span className="text-[11px] text-zinc-500 leading-tight">
                        Restore item back to available stock
                      </span>
                    </button>
                  </div>
                </div>

                {/* Direct Product Links */}
                <div className="border-t border-zinc-200 pt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span>Product ID: {scannedProduct.product_id}</span>
                  <Link
                    href={`/admin/products/${scannedProduct.product_id}`}
                    className="text-burgundy hover:underline flex items-center gap-1 font-medium"
                  >
                    Open Product Editor <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center p-8 bg-zinc-50/70 rounded-2xl border-2 border-dashed border-zinc-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <QrCode className="w-8 h-8 text-zinc-400 stroke-[1.5]" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="font-bold text-zinc-800 text-base">Awaiting QR Scan</h3>
                <p className="text-xs text-zinc-500">
                  Scan a garment&apos;s physical QR Code with your camera or enter the QR Code string above to view product details and execute actions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
