import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "neutral" | "brand" | "outline";
}

export function Badge({ className, variant = "neutral", children, ...props }: BadgeProps) {
    const variants = {
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      warning: "bg-amber-50 text-amber-700 border-amber-200",
      danger: "bg-rose-50 text-rose-700 border-rose-200",
      neutral: "bg-zinc-100 text-zinc-700 border-zinc-200",
      brand: "bg-burgundy/10 text-burgundy border-burgundy/20",
      outline: "bg-white text-zinc-700 border-zinc-200",
    };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
