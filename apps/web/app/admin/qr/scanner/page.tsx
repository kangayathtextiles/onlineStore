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

  // Camera / Decoder State
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [lastScannedRaw, setLastScannedRaw] = React.useState<string | null>(null);
  const [scanFlash, setScanFlash] = React.useState(false); // visual feedback on decode

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const readerRef = React.useRef<InstanceType<typeof import("@zxing/browser").BrowserMultiFormatReader> | null>(null);
  const scanLockRef = React.useRef(false); // prevent concurrent lookups for same code

  // ── Lookup ───────────────────────────────────────────────────────────────
  const handleLookup = React.useCallback(
    async (codeToLookup?: string) => {
      const query = (codeToLookup ?? inputCode).trim();
      if (!query) {
        toast.info("Enter QR Code", "Please enter or scan a valid QR Code or Style Code.");
        return;
      }

      try {
        setIsSearching(true);
        const product = await adminApi.qr.lookup(query);
        setScannedProduct(product);
        setInputCode(product.qr_code);
        setScanHistory((prev) => {
          const filtered = prev.filter((p) => p.product_id !== product.product_id);
          return [product, ...filtered].slice(0, 10);
        });
        toast.success("Product Identified", `${product.name} (${product.style_code})`);
      } catch (err: unknown) {
        toast.error(
          "Lookup Failed",
          (err as Error).message || "Could not find physical product with this QR code."
        );
      } finally {
        setIsSearching(false);
        scanLockRef.current = false;
      }
    },
    [inputCode, toast]
  );

  // ── Lifecycle Actions ─────────────────────────────────────────────────────
  const handleAction = async (action: QRActionType) => {
    if (!scannedProduct) return;
    try {
      setIsActing(true);
      const updated = await adminApi.qr.executeAction({ qr_code: scannedProduct.qr_code, action });
      setScannedProduct(updated);
      setScanHistory((prev) =>
        prev.map((p) => (p.product_id === updated.product_id ? updated : p))
      );
      if (action === "SOLD_OUT")
        toast.success("Marked SOLD OUT", `${updated.name} has been marked sold out.`);
      else if (action === "DAMAGED")
        toast.info("Marked DAMAGED", `${updated.name} has been removed from customer showroom.`);
      else if (action === "RETURN")
        toast.success("RETURN Processed", `${updated.name} is now back in available showroom stock.`);
    } catch (err: unknown) {
      toast.error("Action Failed", (err as Error).message);
    } finally {
      setIsActing(false);
    }
  };

  // ── Camera: Start ─────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);
    setLastScannedRaw(null);
    scanLockRef.current = false;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported by your browser.");
      }

      // Dynamically import ZXing so it doesn't break SSR/build
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { NotFoundException } = await import("@zxing/library");
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);

      // Continuously decode frames
      reader.decodeFromStream(stream, videoRef.current!, (result, error) => {
        if (result) {
          const decoded = result.getText();

          // Debounce: skip if same code is still being processed
          if (scanLockRef.current || decoded === lastScannedRaw) return;

          scanLockRef.current = true;
          setLastScannedRaw(decoded);

          // Visual flash feedback
          setScanFlash(true);
          setTimeout(() => setScanFlash(false), 400);

          // Trigger lookup
          setInputCode(decoded);
          handleLookup(decoded);
        }

        // Swallow "no barcode found in frame" errors (expected every frame)
        if (error && !(error instanceof NotFoundException)) {
          console.warn("[QR Scanner] decode error:", error);
        }
      });
    } catch (err: unknown) {
      const msg = (err as Error).message || "Could not access device camera.";
      setCameraError(msg);
      setCameraActive(false);
      toast.error("Camera Unavailable", msg);
    }
  };

  // ── Camera: Stop ─────────────────────────────────────────────────────────
  const stopCamera = () => {
    if (readerRef.current) {
      readerRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setLastScannedRaw(null);
    scanLockRef.current = false;
  };

  // Cleanup on unmount
  React.useEffect(() => () => stopCamera(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Status Badge ──────────────────────────────────────────────────────────
  const getStatusBadge = (status: string, isDamaged: boolean, manualSoldOut: boolean) => {
    if (isDamaged)
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5" /> DAMAGED (UNSELLABLE)
        </span>
      );
    if (status === "SOLD_OUT" || manualSoldOut)
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
          <Ban className="w-3.5 h-3.5" /> SOLD OUT
        </span>
      );
    if (status === "RETIRED")
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-300">
          RETIRED (2-YR RETENTION)
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5" /> AVAILABLE IN SHOWROOM
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
            Scan physical garment QR labels to immediately identify products and perform lifecycle
            actions: SOLD OUT, DAMAGED, or RETURN.
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
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Camera Viewfinder */}
          <Card className="overflow-hidden border-zinc-200 shadow-sm">
            <CardHeader className="bg-zinc-50/80 border-b border-zinc-200 py-3.5 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-zinc-700" />
                  Live Camera Scanner
                  {cameraActive && (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                      ACTIVE
                    </span>
                  )}
                </CardTitle>
              </div>
              {cameraActive ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopCamera}
                  className="h-7 text-xs gap-1 text-rose-700 border-rose-200"
                >
                  <CameraOff className="w-3.5 h-3.5" /> Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startCamera}
                  className="h-7 text-xs gap-1 text-burgundy border-burgundy/30"
                >
                  <Camera className="w-3.5 h-3.5" /> Start Camera
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-4">
              <div
                className={`relative aspect-video sm:aspect-square bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center border transition-colors ${
                  scanFlash ? "border-emerald-400 ring-2 ring-emerald-400/50" : "border-zinc-800"
                }`}
              >
                {/* Video element always mounted so ref is stable */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />

                {/* Idle / error state */}
                {!cameraActive && (
                  <div className="text-center p-6 text-zinc-400 space-y-3">
                    <QrCode className="w-12 h-12 mx-auto text-zinc-600 stroke-[1.5]" />
                    <p className="text-xs text-zinc-400 max-w-xs">
                      Click &quot;Start Camera&quot; to scan product tags directly, or use a
                      handheld barcode gun / manual input below.
                    </p>
                    {cameraError && (
                      <p className="text-xs text-rose-400 bg-rose-950/50 p-2 rounded border border-rose-800">
                        {cameraError}
                      </p>
                    )}
                  </div>
                )}

                {/* Scan overlay when active */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-3">
                    {/* Corner bracket viewfinder */}
                    <div
                      className={`w-48 h-48 relative transition-all ${
                        scanFlash ? "opacity-100 scale-105" : "opacity-80"
                      }`}
                    >
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br" />

                      {/* Scanning line animation */}
                      {!scanFlash && (
                        <div
                          className="absolute left-2 right-2 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          style={{ animation: "scanLine 2s ease-in-out infinite" }}
                        />
                      )}

                      {/* Flash indicator on successful decode */}
                      {scanFlash && (
                        <div className="absolute inset-0 bg-emerald-400/20 rounded flex items-center justify-center">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                      )}
                    </div>

                    {/* Hint text */}
                    {!scanFlash && (
                      <p className="text-[11px] text-zinc-300 bg-black/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
                        Point at QR code to scan automatically
                      </p>
                    )}

                    {/* Last decoded value */}
                    {lastScannedRaw && (
                      <p className="text-[10px] font-mono text-emerald-300 bg-black/50 px-2 py-0.5 rounded">
                        {lastScannedRaw}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Scan animation keyframe */}
              <style>{`
                @keyframes scanLine {
                  0%   { top: 8px;   opacity: 1; }
                  50%  { top: calc(100% - 8px); opacity: 1; }
                  100% { top: 8px;   opacity: 1; }
                }
              `}</style>
            </CardContent>
          </Card>

          {/* Manual / Gun Scanner Input */}
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
                  disabled={isSearching}
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

          {/* Recent Scan History */}
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

        {/* ── RIGHT COLUMN: Product Card & Actions ── */}
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
                {/* Product Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm">
                  <div>
                    <span className="text-xs text-zinc-500 font-medium block">Style Code</span>
                    <span className="font-mono font-bold text-zinc-900 text-base">
                      {scannedProduct.style_code || "N/A"}
                    </span>
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
                      {scannedProduct.price
                        ? `₹${Number(scannedProduct.price).toLocaleString("en-IN")}`
                        : "Unset"}
                    </span>
                  </div>
                </div>

                {/* Variants */}
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

                {/* 3 Lifecycle Actions */}
                <div className="border-t border-zinc-200 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-burgundy" />
                      Physical Showroom Lifecycle Actions
                    </h3>
                    <span className="text-xs text-zinc-400">Click to update status</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* SOLD OUT */}
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

                    {/* DAMAGED */}
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

                    {/* RETURN */}
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

                {/* Footer Links */}
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
                  Scan a garment&apos;s physical QR Code with your camera or enter the code above
                  to view product details and execute lifecycle actions.
                </p>
              </div>
              {isSearching && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <RefreshCw className="w-4 h-4 animate-spin text-burgundy" />
                  Looking up product…
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
