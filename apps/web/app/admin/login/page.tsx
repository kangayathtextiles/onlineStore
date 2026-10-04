"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const key = localStorage.getItem("ADMIN_API_KEY");
    if (key) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsLoading(true);
    setError("");
    
    // Optimistically save it
    localStorage.setItem("ADMIN_API_KEY", password);
    
    try {
      // Test the API key against the backend
      await adminApi.store.getStatus();
      // If success, redirect
      router.replace("/admin");
    } catch (err: unknown) {
      // If failed, remove it and show error
      localStorage.removeItem("ADMIN_API_KEY");
      setError("Invalid Admin API Key. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
              {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 bg-burgundy hover:bg-burgundy/90 text-white font-medium"
              isLoading={isLoading}
            >
              Sign In to Admin Panel
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
