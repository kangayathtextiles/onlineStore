import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "brand";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary: "bg-burgundy text-white hover:bg-burgundy-700 focus-visible:ring-burgundy",
      brand: "bg-burgundy text-white hover:bg-burgundy-600 focus-visible:ring-burgundy-500 shadow-sm",
      secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus-visible:ring-zinc-600",
      outline: "border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800/60 focus-visible:ring-zinc-500",
      danger: "bg-rose-700 text-white hover:bg-rose-800 focus-visible:ring-rose-600",
      ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800/80 hover:text-white focus-visible:ring-zinc-600",
    };

    const sizes = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-5 py-2.5 gap-2.5",
      icon: "p-2 aspect-square",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
