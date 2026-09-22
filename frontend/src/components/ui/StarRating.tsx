import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  className?: string;
}

export function StarRating({ rating, reviewCount, size = 14, className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.round(rating);
          return (
            <Star
              key={i}
              size={size}
              className={filled ? "fill-gold-500 text-gold-500" : "fill-ink-200 text-ink-200"}
            />
          );
        })}
      </div>
      <span className="text-xs text-ink-500">
        {rating.toFixed(1)}
        {reviewCount !== undefined ? ` (${reviewCount})` : ""}
      </span>
    </div>
  );
}
