"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";

function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [wakeUpNotice, setWakeUpNotice] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const performLogin = async (key: string, attempt = 1, maxAttempts = 3): Promise<void> => {
    try {
      await adminApi.auth.login(key);
      setWakeUpNotice(null);
      const from = searchParams.get("from") || "/admin";
      window.location.replace(from);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string };
      const isStandby =
        apiErr?.status === 429 ||
        apiErr?.status === 502 ||
        apiErr?.status === 503 ||
        apiErr?.status === 504;

      if (isStandby && attempt < maxAttempts) {
        setWakeUpNotice(
          `Digital showroom backend is waking up from standby (attempt ${attempt}/${maxAttempts}). Connecting automatically in 8 seconds...`
        );
        setError("");
        await new Promise((resolve) => setTimeout(resolve, 8000));
        return performLogin(key, attempt + 1, maxAttempts);
      }

      setWakeUpNotice(null);
      setIsLoading(false);
      if (apiErr?.status === 429) {
        setError("The server is still waking up from standby. Please wait 10 seconds and try again.");
      } else if (apiErr?.status === 502 || apiErr?.status === 503 || apiErr?.status === 504) {
        setError("Backend service is waking up from standby. Please wait a moment and try again.");
      } else {
        setError("Invalid Admin API Key. Please try again.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError("");
    setWakeUpNotice(null);

    await performLogin(password);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-burgundy/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-burgundy" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900">Admin Login</h1>
            <p className="text-sm text-zinc-500">
              Enter your secure API key to access the Kangayath Web digital showroom backend.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Admin API Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter key..."
                className="w-full h-11 px-4 rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-burgundy transition-all"
                disabled={isLoading}
                autoFocus
              />
              {wakeUpNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <span>{wakeUpNotice}</span>
                </div>
              )}
              {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-burgundy hover:bg-burgundy/90 text-white font-medium"
              isLoading={isLoading}
            >
              {wakeUpNotice ? "Connecting to Backend..." : "Sign In to Admin Panel"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
