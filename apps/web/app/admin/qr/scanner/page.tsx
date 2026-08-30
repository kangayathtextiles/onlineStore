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
  ScanLine,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import type { QRScanResponse, QRActionType } from "@/types/api";

// ─── Native ZXing Stream Decoder Hook ─────────────────────────────────────────
//
// Uses ZXing's built-in decodeFromConstraints which is highly optimized for
// continuously streaming and decoding video feeds across both PC and mobile.
//
function useQRScanner(onDetected: (text: string) => void) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  // Store the controls returned by ZXing to properly stop the scanner later
  const controlsRef = React.useRef<{ stop: () => void } | null>(null);
  const lastCodeRef = React.useRef<string | null>(null);
  const lockRef = React.useRef(false);

  const [active, setActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [flashGreen, setFlashGreen] = React.useState(false);

  const stop = React.useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    lastCodeRef.current = null;
    lockRef.current = false;
    setActive(false);
  }, []);

  const start = React.useCallback(async () => {
    setError(null);
    lastCodeRef.current = null;
    lockRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported in this browser.");
      return;
    }

    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      // Use the dedicated QR reader which is significantly faster and more accurate
      // than the MultiFormatReader because it doesn't try to run 1D barcode decoders.
      const reader = new BrowserQRCodeReader();

      if (videoRef.current) {
        // Use constraints to explicitly request the environment camera without
        // forcing a specific resolution, allowing the phone to provide its native stream.
        controlsRef.current = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: "environment",
              // Providing ideal constraints helps some iOS devices pick a better frame rate/resolution
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText();
              // Prevent firing multiple times for the same QR code rapidly
              if (text && text !== lastCodeRef.current && !lockRef.current) {
                lockRef.current = true;
                lastCodeRef.current = text;

                // Visual success flash
                setFlashGreen(true);
                setTimeout(() => setFlashGreen(false), 600);

                onDetected(text);

                // Unlock after 2s to allow scanning the exact same code again if needed
                setTimeout(() => { lockRef.current = false; }, 2000);
              }
            }
          }
        );
        setActive(true);
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || "Could not access device camera.";
      setError(msg);
      setActive(false);
    }
  }, [onDetected]);

  // Cleanup on unmount
  React.useEffect(() => () => stop(), [stop]);

  // Expose an empty canvasRef to keep TS happy with the previous page structure,
  // although we no longer use it in the DOM.
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  return { videoRef, canvasRef, active, error, flashGreen, start, stop };
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminQRScannerPage() {
  const toast = useToast();

  const [inputCode, setInputCode] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [isActing, setIsActing] = React.useState(false);
  const [scannedProduct, setScannedProduct] = React.useState<QRScanResponse | null>(null);
  const [scanHistory, setScanHistory] = React.useState<QRScanResponse[]>([]);

  // ── Lookup ────────────────────────────────────────────────────────────────
  const handleLookup = React.useCallback(
    async (raw: string) => {
      const code = raw.trim().toUpperCase();
      if (!code) return;

      setIsSearching(true);
      try {
        const product = await adminApi.qr.lookup(code);
        setScannedProduct(product);
        setInputCode(product.qr_code);
        setScanHistory((prev) => {
          const filtered = prev.filter((p) => p.product_id !== product.product_id);
          return [product, ...filtered].slice(0, 10);
        });
        toast.success("Product Identified", `${product.name} (${product.style_code})`);
      } catch (err: unknown) {
        toast.error(
          "Not Found",
          (err as Error).message || "Could not find product with this QR code."
        );
      } finally {
        setIsSearching(false);
      }
    },
    [toast]
  );

  // Camera scanner with canvas polling
  const scanner = useQRScanner(handleLookup);

  // ── Lifecycle Actions ─────────────────────────────────────────────────────
  const handleAction = async (action: QRActionType) => {
    if (!scannedProduct) return;
    setIsActing(true);
    try {
      const updated = await adminApi.qr.executeAction({
        qr_code: scannedProduct.qr_code,
        action,
      });
      setScannedProduct(updated);
      setScanHistory((prev) =>
        prev.map((p) => (p.product_id === updated.product_id ? updated : p))
      );
      const messages: Record<QRActionType, () => void> = {
        SOLD_OUT: () => toast.success("Marked SOLD OUT", `${updated.name} is now sold out.`),
        DAMAGED: () => toast.info("Marked DAMAGED", `${updated.name} hidden from customers.`),
        RETURN: () =>
          toast.success("RETURN Processed", `${updated.name} is back in available stock.`),
      };
      messages[action]?.();
    } catch (err: unknown) {
      toast.error("Action Failed", (err as Error).message);
    } finally {
      setIsActing(false);
    }
  };

  // ── Status Badge ──────────────────────────────────────────────────────────
  const StatusBadge = ({ p }: { p: QRScanResponse }) => {
    if (p.is_damaged)
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5" /> DAMAGED
        </span>
      );
    if (p.operational_status === "SOLD_OUT" || p.manual_sold_out)
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
          <Ban className="w-3.5 h-3.5" /> SOLD OUT
        </span>
      );
    if (p.operational_status === "RETIRED")
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-300">
          RETIRED
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5" /> AVAILABLE
      </span>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 font-serif flex items-center gap-3">
            <QrCode className="w-8 h-8 text-burgundy" />
            Physical QR Scanner
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Scan physical garment QR labels to identify products and update their showroom status.
          </p>
        </div>
        <Link href="/admin/qr/print">
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Print QR Labels
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── LEFT: Camera + Manual Input + History ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Camera Card */}
          <Card className="overflow-hidden border-zinc-200 shadow-sm">
            <CardHeader className="bg-zinc-50/80 border-b border-zinc-200 py-3.5 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-zinc-700" />
                Live Camera Scanner
                {scanner.active && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </CardTitle>

              {scanner.active ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={scanner.stop}
                  className="h-7 text-xs gap-1 text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  <CameraOff className="w-3.5 h-3.5" /> Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={scanner.start}
                  className="h-7 text-xs gap-1 text-burgundy border-burgundy/30 hover:bg-burgundy/5"
                >
                  <Camera className="w-3.5 h-3.5" /> Start Camera
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-4">
              {/* Hidden canvas for QR decoding (not visible to user) */}
              <canvas ref={scanner.canvasRef} className="hidden" />

              <div
                className={`relative aspect-[3/4] sm:aspect-video bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center border-2 transition-all duration-300 ${
                  scanner.flashGreen
                    ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                    : scanner.active
                    ? "border-zinc-700"
                    : "border-zinc-800"
                }`}
              >
                {/* Video feed */}
                <video
                  ref={scanner.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain ${scanner.active ? "block" : "hidden"}`}
                />

                {/* Idle placeholder */}
                {!scanner.active && (
                  <div className="text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto">
                      <QrCode className="w-8 h-8 text-zinc-500 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-300">Camera is off</p>
                      <p className="text-xs text-zinc-500 max-w-[200px] mx-auto">
                        Tap &quot;Start Camera&quot; then point at a garment QR label.
                      </p>
                    </div>
                    {scanner.error && (
                      <div className="text-xs text-rose-400 bg-rose-950/60 border border-rose-800 p-2 rounded-lg">
                        {scanner.error}
                      </div>
                    )}
                  </div>
                )}

                {/* Active overlay: corner brackets + scan line */}
                {scanner.active && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Dim vignette */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.5)_100%)]" />

                    {/* Viewfinder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-52 h-52">
                        {/* Corners */}
                        {[
                          "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg",
                          "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg",
                          "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg",
                          "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg",
                        ].map((cls, i) => (
                          <div
                            key={i}
                            className={`absolute w-7 h-7 ${
                              scanner.flashGreen ? "border-emerald-400" : "border-white/80"
                            } ${cls} transition-colors duration-200`}
                          />
                        ))}

                        {/* Scan line animation */}
                        {!scanner.flashGreen && (
                          <div
                            className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                            style={{ animation: "scanLine 2.5s ease-in-out infinite" }}
                          />
                        )}

                        {/* Success flash */}
                        {scanner.flashGreen && (
                          <div className="absolute inset-0 flex items-center justify-center bg-emerald-400/10 rounded-lg">
                            <CheckCircle2 className="w-14 h-14 text-emerald-400 drop-shadow-lg" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hint */}
                    {!scanner.flashGreen && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <span className="text-[11px] text-zinc-200 bg-black/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <ScanLine className="w-3 h-3 text-emerald-400" />
                          Align QR code in the frame
                        </span>
                      </div>
                    )}

                    {/* Loading indicator while searching */}
                    {isSearching && (
                      <div className="absolute top-3 left-0 right-0 flex justify-center">
                        <span className="text-[11px] text-white bg-burgundy/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Looking up product…
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Scan line animation keyframe */}
              <style>{`
                @keyframes scanLine {
                  0%   { top: 4px; opacity: 0; }
                  10%  { opacity: 1; }
                  90%  { opacity: 1; }
                  100% { top: calc(100% - 4px); opacity: 0; }
                }
              `}</style>
            </CardContent>
          </Card>

          {/* Manual / Gun Input */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="py-3 px-4 bg-zinc-50 border-b border-zinc-200">
              <CardTitle className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                Manual / Barcode Gun Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputCode.trim()) handleLookup(inputCode.trim());
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    name="query"
                    type="text"
                    placeholder="Scan or enter QR token / Style Code…"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="pl-9 font-mono uppercase text-sm tracking-wide"
                  />
                  {inputCode && (
                    <button
                      type="button"
                      onClick={() => setInputCode("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSearching || !inputCode.trim()}
                  className="bg-burgundy hover:bg-burgundy/90 gap-2 shrink-0"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Identify
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Session History */}
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
                  className="text-[11px] text-zinc-400 hover:text-zinc-700 underline"
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

        {/* ── RIGHT: Product Details & Actions ── */}
        <div className="lg:col-span-7">
          {isSearching && !scannedProduct ? (
            /* Searching state */
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center gap-4 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
              <RefreshCw className="w-8 h-8 animate-spin text-burgundy" />
              <p className="text-sm text-zinc-600 font-medium">Looking up product…</p>
            </div>
          ) : scannedProduct ? (
            /* Product card */
            <Card className="border-zinc-300 shadow-md bg-white overflow-hidden">
              {/* Dark header */}
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[11px] font-mono font-semibold border border-white/20">
                      QR IDENTIFIED
                    </span>
                    <span className="text-zinc-400 text-xs font-mono truncate">
                      {scannedProduct.qr_code}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-serif leading-tight">
                    {scannedProduct.name}
                  </h2>
                </div>
                <div className="shrink-0">
                  <StatusBadge p={scannedProduct} />
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Info grid */}
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm">
                  <div>
                    <p className="text-[11px] text-zinc-500 font-medium mb-0.5">Style Code</p>
                    <p className="font-mono font-bold text-zinc-900">
                      {scannedProduct.style_code || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 font-medium mb-0.5">Category</p>
                    <p className="font-semibold text-zinc-800 text-xs">
                      {scannedProduct.category_name} › {scannedProduct.subcategory_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 font-medium mb-0.5">Price</p>
                    <p className="font-bold text-burgundy">
                      {scannedProduct.price
                        ? `₹${Number(scannedProduct.price).toLocaleString("en-IN")}`
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Variants */}
                {scannedProduct.variants.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                      Variants ({scannedProduct.variants.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {scannedProduct.variants.map((v) => (
                        <span
                          key={v.id}
                          className={`px-3 py-1 rounded-md text-xs font-medium border ${
                            v.is_available
                              ? "bg-white text-zinc-800 border-zinc-300"
                              : "bg-zinc-100 text-zinc-400 border-zinc-200 line-through"
                          }`}
                        >
                          {v.size?.name || "—"} / {v.color?.name || "—"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 3 Lifecycle Action Buttons ── */}
                <div className="border-t border-zinc-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-burgundy" />
                      Showroom Actions
                    </h3>
                    <span className="text-xs text-zinc-400">Tap to update status instantly</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* SOLD OUT */}
                    <button
                      type="button"
                      disabled={
                        isActing ||
                        scannedProduct.operational_status === "SOLD_OUT" ||
                        scannedProduct.manual_sold_out
                      }
                      onClick={() => handleAction("SOLD_OUT")}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 text-center transition-all ${
                        scannedProduct.operational_status === "SOLD_OUT" ||
                        scannedProduct.manual_sold_out
                          ? "bg-rose-50 border-rose-400 text-rose-800 cursor-default ring-1 ring-rose-300"
                          : "bg-white border-zinc-200 text-zinc-700 hover:border-rose-400 hover:bg-rose-50/60 hover:text-rose-800 active:scale-95"
                      } disabled:opacity-60`}
                    >
                      <Ban
                        className={`w-7 h-7 ${
                          scannedProduct.manual_sold_out
                            ? "text-rose-500"
                            : "text-rose-400"
                        }`}
                      />
                      <div>
                        <p className="font-bold text-sm">SOLD OUT</p>
                        <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                          Physical piece sold in store
                        </p>
                      </div>
                    </button>

                    {/* DAMAGED */}
                    <button
                      type="button"
                      disabled={isActing || scannedProduct.is_damaged}
                      onClick={() => handleAction("DAMAGED")}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 text-center transition-all ${
                        scannedProduct.is_damaged
                          ? "bg-amber-50 border-amber-400 text-amber-800 cursor-default ring-1 ring-amber-300"
                          : "bg-white border-zinc-200 text-zinc-700 hover:border-amber-400 hover:bg-amber-50/60 hover:text-amber-800 active:scale-95"
                      } disabled:opacity-60`}
                    >
                      <AlertTriangle
                        className={`w-7 h-7 ${
                          scannedProduct.is_damaged ? "text-amber-500" : "text-amber-400"
                        }`}
                      />
                      <div>
                        <p className="font-bold text-sm">DAMAGED</p>
                        <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                          Hide from customer site
                        </p>
                      </div>
                    </button>

                    {/* RETURN */}
                    <button
                      type="button"
                      disabled={
                        isActing ||
                        (!scannedProduct.manual_sold_out && !scannedProduct.is_damaged)
                      }
                      onClick={() => handleAction("RETURN")}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 text-center transition-all ${
                        !scannedProduct.manual_sold_out && !scannedProduct.is_damaged
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default"
                          : "bg-white border-zinc-200 text-zinc-700 hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-800 active:scale-95"
                      } disabled:opacity-60`}
                    >
                      <RotateCcw
                        className={`w-7 h-7 ${
                          !scannedProduct.manual_sold_out && !scannedProduct.is_damaged
                            ? "text-emerald-400"
                            : "text-emerald-500"
                        }`}
                      />
                      <div>
                        <p className="font-bold text-sm">RETURN</p>
                        <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                          Back to available stock
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Action loading indicator */}
                  {isActing && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-zinc-500">
                      <RefreshCw className="w-4 h-4 animate-spin text-burgundy" />
                      Updating status…
                    </div>
                  )}
                </div>

                {/* Footer links */}
                <div className="border-t border-zinc-100 pt-4 flex items-center justify-between text-xs text-zinc-400">
                  <span>ID: {scannedProduct.product_id}</span>
                  <Link
                    href={`/admin/products/${scannedProduct.product_id}`}
                    className="text-burgundy hover:underline flex items-center gap-1 font-medium"
                  >
                    Open Product Editor
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Awaiting scan state */
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center p-8 bg-zinc-50/80 rounded-2xl border-2 border-dashed border-zinc-200 text-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-zinc-300 stroke-[1.5]" />
              </div>
              <div className="max-w-xs space-y-1">
                <h3 className="font-bold text-zinc-800 text-base">Awaiting QR Scan</h3>
                <p className="text-xs text-zinc-500">
                  Start the camera and point it at a garment QR label — or type a code manually
                  above. The product details and action buttons will appear here instantly.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
