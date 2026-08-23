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
    <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden flex flex-col justify-between p-0 shadow-xs">
      {/* 4:5 Image Skeleton */}
      <div className="relative aspect-[4/5] w-full bg-zinc-100/90 overflow-hidden flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-none bg-zinc-200/60" />
        {/* Floating Stock Badge placeholder */}
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-5 w-20 rounded-full bg-zinc-300/60" />
        </div>
        {/* Heart button placeholder */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-8 w-8 rounded-full bg-zinc-300/60" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Category tag */}
        <Skeleton className="h-3 w-24 rounded-full bg-zinc-200/70" />
        {/* Product Title */}
        <Skeleton className="h-4.5 w-4/5 rounded-md bg-zinc-200/90" />
        {/* Material / Style Code row */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3.5 w-28 rounded-md bg-zinc-200/60" />
          <Skeleton className="h-4 w-12 rounded-sm bg-zinc-200/50" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-12 rounded" />
        <Skeleton className="h-3.5 w-3 rounded" />
        <Skeleton className="h-3.5 w-16 rounded" />
        <Skeleton className="h-3.5 w-3 rounded" />
        <Skeleton className="h-3.5 w-32 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200 aspect-[4/5] relative">
            <Skeleton className="w-full h-full rounded-none bg-zinc-200/70" />
            <div className="absolute top-4 left-4">
              <Skeleton className="h-6 w-32 rounded-full bg-zinc-300/80" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-20 aspect-[4/5] rounded-xl bg-zinc-200/60 flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Right Column: Garment Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3 border-b border-zinc-200 pb-6">
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

          {/* Size Selector skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-12 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Color Selector skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            <div className="flex items-center gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Live Availability Box skeleton */}
          <Skeleton className="h-16 w-full rounded-2xl" />

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <Skeleton className="h-13 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-11 rounded-xl" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
