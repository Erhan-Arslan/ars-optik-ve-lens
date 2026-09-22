import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { FrameIllustration } from "@/components/product/FrameIllustration";
import { useFavoritesStore } from "@/store/favorites";
import { useAuthStore } from "@/store/auth";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [activeColor, setActiveColor] = useState(product.colors[0]);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isFavorite = useFavoritesStore((s) => s.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-elevated transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-floating"
    >
      <Link to={`/urun/${product.slug}`} className="relative block aspect-[4/3.4] overflow-hidden bg-gradient-to-br from-ink-50 to-champagne-50">
        <div className="absolute inset-0 flex items-center justify-center p-6 transition-transform duration-500 ease-out group-hover:scale-105">
          <FrameIllustration
            category={product.category}
            shape={product.shape}
            colorHex={activeColor.hex}
            className="h-full w-full drop-shadow-[0_12px_20px_rgba(74,54,24,0.18)]"
          />
        </div>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && <Badge variant="ink">Yeni</Badge>}
          {product.isBestseller && <Badge variant="gold">Çok Satan</Badge>}
          {product.compareAtPrice && (
            <Badge variant="outline" className="border-bronze-400 bg-white/80 text-bronze-700 backdrop-blur">
              İndirim
            </Badge>
          )}
        </div>

        <button
          type="button"
          aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          aria-pressed={isFavorite}
          onClick={(e) => {
            e.preventDefault();
            if (!user) {
              navigate("/giris");
              return;
            }
            toggleFavorite(product.id);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-600 shadow-elevated backdrop-blur transition-[transform,color] duration-200 hover:scale-110 hover:text-bronze-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 active:scale-95"
        >
          <Heart size={16} className={cn(isFavorite && "fill-bronze-600 text-bronze-600")} />
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-bronze-500">
          {product.brand}
        </span>
        <Link to={`/urun/${product.slug}`} className="font-display text-lg leading-snug text-ink-900 hover:text-bronze-700">
          {product.name}
        </Link>
        <StarRating rating={product.rating} reviewCount={product.reviewCount} />

        <div className="mt-1 flex items-center gap-2">
          {product.colors.map((color) => (
            <button
              key={color.name}
              type="button"
              aria-label={color.name}
              aria-pressed={activeColor.name === color.name}
              onClick={() => setActiveColor(color)}
              className={cn(
                "h-5 w-5 rounded-full ring-offset-2 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
                activeColor.name === color.name ? "ring-2 ring-ink-800" : "ring-1 ring-ink-200",
              )}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-xl text-ink-900">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-ink-400 line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
