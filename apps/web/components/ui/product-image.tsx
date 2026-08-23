"use client";

import * as React from "react";
import Image from "next/image";
import { Shirt } from "lucide-react";
import { cn, resolveImageUrl } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface ProductImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt: string;
  aspectRatio?: "4/5" | "3/4" | "square" | "16/9" | "responsive" | "auto";
  fit?: "cover" | "contain";
  zoomOnHover?: boolean;
  priority?: boolean;
  containerClassName?: string;
}

export function ProductImage({
  src,
  alt,
  aspectRatio = "square",
  fit = "cover",
  zoomOnHover = true,
  priority = false,
  className,
  containerClassName,
  ...props
}: ProductImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const resolvedUrl = React.useMemo(() => {
    return resolveImageUrl(src);
  }, [src]);

  // Reset states if src changes
  React.useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const aspectClass =
    aspectRatio === "square" || aspectRatio === "responsive"
      ? "aspect-square"
      : aspectRatio === "4/5"
      ? "aspect-[4/5]"
      : aspectRatio === "3/4"
      ? "aspect-[3/4]"
      : aspectRatio === "16/9"
      ? "aspect-[16/9]"
      : "";

  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[#F0EFED] flex items-center justify-center select-none",
        aspectClass,
        containerClassName
      )}
    >
      {/* Loading Skeleton */}
      {isLoading && !hasError && resolvedUrl && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full rounded-none bg-zinc-200/70" />
        </div>
      )}

      {/* Image Render */}
      {resolvedUrl && !hasError ? (
        <Image
          src={resolvedUrl}
          alt={alt || "Product image"}
          fill
          unoptimized
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          priority={priority}
          className={cn(
            "object-center transition-all duration-500",
            fitClass,
            isLoading ? "opacity-0 scale-98" : "opacity-100 scale-100",
            zoomOnHover && "group-hover:scale-105",
            className
          )}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        /* Graceful Branded Fallback (No broken-image icon or blank box) */
        <div className="flex flex-col items-center justify-center p-4 text-center w-full h-full bg-[#F0EFED] border border-zinc-200/60 rounded-inherit select-none">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-xs border border-zinc-200/80 flex items-center justify-center text-burgundy mb-2 transition-transform duration-300 group-hover:scale-105">
            <Shirt className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.25] text-burgundy" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500">
            Photo Coming Soon
          </span>
        </div>
      )}
    </div>
  );
}
