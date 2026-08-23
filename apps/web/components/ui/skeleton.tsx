"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-zinc-200/80",
        shimmer && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white overflow-hidden flex flex-col justify-between shadow-xs">
      {/* Aspect 3:4 / 4:5 Image Canvas Skeleton */}
      <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full bg-zinc-200/50 overflow-hidden flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-none bg-zinc-200/50" />
        {/* Heart button placeholder */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10">
          <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-300/80" />
        </div>
        {/* Floating Stock Badge placeholder */}
        <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-10">
          <Skeleton className="h-4.5 w-16 sm:w-20 rounded-full bg-zinc-300/80" />
        </div>
        {/* Floating Color Swatch placeholder */}
        <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 z-10">
          <Skeleton className="h-4.5 w-8 rounded-full bg-zinc-300/80" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-2.5 sm:p-4 space-y-1.5 bg-white">
        {/* Category tag */}
        <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 rounded-full bg-zinc-200/80" />
        {/* Product Title */}
        <Skeleton className="h-3.5 sm:h-4 w-4/5 rounded bg-zinc-200/90" />
        {/* Material / Style Code row */}
        <div className="flex items-center justify-between pt-0.5">
          <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-24 rounded bg-zinc-200/60" />
          <Skeleton className="h-2.5 sm:h-3 w-10 sm:w-14 rounded bg-zinc-200/60" />
        </div>
        {/* Sizes preview row */}
        <div className="flex items-center gap-1 pt-0.5">
          <Skeleton className="h-3.5 w-6 rounded bg-zinc-200/50" />
          <Skeleton className="h-3.5 w-6 rounded bg-zinc-200/50" />
          <Skeleton className="h-3.5 w-6 rounded bg-zinc-200/50" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-24 sm:pb-12 space-y-8 sm:space-y-12 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Skeleton className="h-3.5 w-12 rounded" />
        <Skeleton className="h-3.5 w-3 rounded" />
        <Skeleton className="h-3.5 w-16 rounded" />
        <Skeleton className="h-3.5 w-3 rounded" />
        <Skeleton className="h-3.5 w-32 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-[#F0EFED] border border-zinc-200/90 aspect-[4/5] relative">
            <Skeleton className="w-full h-full rounded-none bg-zinc-200/60" />
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
              <Skeleton className="h-6 w-32 rounded-full bg-white/95 border border-zinc-200/60" />
            </div>
          </div>

          {/* Carousel dots & actions skeleton */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-4 h-2 rounded-full" />
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="w-2 h-2 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-16 sm:w-20 aspect-[4/5] rounded-xl bg-zinc-200/60 flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Right Column: Garment Information (5 cols) */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          <div className="space-y-2 border-b border-zinc-200 pb-5 sm:pb-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <div className="flex items-center gap-4 pt-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>

          {/* Color Selection Cards skeleton (Reference Image 3) */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center p-2 rounded-2xl border border-zinc-200 bg-white flex-shrink-0 space-y-1.5">
                  <Skeleton className="w-16 aspect-[4/5] rounded-xl" />
                  <Skeleton className="h-3 w-12 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Size Selector Pills skeleton (Reference Image 3) */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded" />
            <div className="flex items-center gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 min-w-[48px] rounded-xl" />
              ))}
            </div>
          </div>

          {/* Live Availability Box skeleton */}
          <Skeleton className="h-14 sm:h-16 w-full rounded-2xl" />

          {/* CTAs */}
          <div className="hidden sm:block space-y-3 pt-2">
            <Skeleton className="h-13 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-11 rounded-xl" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
          </div>

          {/* Store notice box skeleton */}
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>

      {/* Mobile Sticky Action Bar skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 sm:hidden shadow-lg flex items-center gap-2">
        <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>
    </div>
  );
}
