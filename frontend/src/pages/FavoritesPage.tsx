import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { fetchFavorites } from "@/services/favorites.service";
import { ProductGrid } from "@/components/product/ProductGrid";
import { buttonVariants } from "@/components/ui/Button";
import type { Product } from "@/types";

export function FavoritesPage() {
  const user = useAuthStore((s) => s.user);
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchFavorites()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [user]);

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-ink-900">Favorilerim</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        {products ? `${products.length} ürün` : "Yükleniyor…"}
      </p>

      <div className="mt-8">
        {products?.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-200 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400">
              <Heart size={24} />
            </div>
            <p className="font-display text-xl text-ink-700">Favori listeniz boş</p>
            <p className="text-sm text-ink-500">Beğendiğiniz ürünlerin kalp ikonuna dokunarak buraya ekleyin.</p>
            <Link to="/katalog" className={buttonVariants({ className: "mt-2" })}>
              Koleksiyonu Keşfet
            </Link>
          </div>
        ) : (
          <ProductGrid products={products ?? []} isLoading={products === null} />
        )}
      </div>
    </div>
  );
}
