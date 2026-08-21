import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "neutral" | "brand" | "outline";
}

export function Badge({ className, variant = "neutral", children, ...props }: BadgeProps) {
  const variants = {
    success: "bg-emerald-950/80 text-emerald-300 border-emerald-800/60",
    warning: "bg-amber-950/80 text-amber-300 border-amber-800/60",
    danger: "bg-rose-950/80 text-rose-300 border-rose-800/60",
    neutral: "bg-zinc-800/80 text-zinc-300 border-zinc-700/60",
    brand: "bg-burgundy/80 text-rose-100 border-burgundy-600/60",
    outline: "bg-transparent text-zinc-300 border-zinc-700",
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
