import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "gold" | "ink" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  gold: "bg-gold-500 text-ink-950",
  ink: "bg-ink-900 text-champagne-100",
  outline: "border border-ink-300 text-ink-600",
};

export function Badge({ className, variant = "gold", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
