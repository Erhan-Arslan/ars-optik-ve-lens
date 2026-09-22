import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-[linear-gradient(90deg,var(--color-ink-100)_25%,var(--color-ink-200)_37%,var(--color-ink-100)_63%)] bg-[length:200%_100%] animate-shimmer",
        className,
      )}
    />
  );
}
