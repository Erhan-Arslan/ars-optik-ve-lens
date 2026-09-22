import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { fetchProducts } from "@/services/products.service";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters, type FilterState } from "@/components/product/ProductFilters";
import type { Product, ProductCategory } from "@/types";

const categoryLabels: Record<ProductCategory, string> = {
  cerceve: "Çerçeveler",
  "gunes-gozlugu": "Güneş Gözlükleri",
  lens: "Lensler",
};

export function CatalogPage() {
  const [searchParams] = useSearchParams();
  const urlCategory = (searchParams.get("kategori") as ProductCategory | null) ?? "all";
  const search = searchParams.get("arama") ?? "";

  const [filters, setFilters] = useState<FilterState>({
    category: urlCategory,
    gender: "all",
    maxPrice: 4000,
    sort: "onerilen",
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [products, setProducts] = useState<Product[] | null>(null);

  // The nav links change only the URL's "kategori" query param without
  // remounting this page, so the active category has to be re-synced from
  // the URL whenever it changes — otherwise clicking between category links
  // while already on /katalog appears to do nothing.
  useEffect(() => {
    setFilters((prev) => ({ ...prev, category: urlCategory }));
  }, [urlCategory]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts({
        category: filters.category === "all" ? undefined : filters.category,
        gender: filters.gender === "all" ? undefined : filters.gender,
        maxPrice: filters.maxPrice,
        sort: filters.sort,
        search: search || undefined,
      })
        .then(setProducts)
        .catch(() => setProducts([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [filters, search]);

  const title = search
    ? `"${search}" için sonuçlar`
    : filters.category !== "all"
      ? categoryLabels[filters.category]
      : "Tüm Ürünler";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900">{title}</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {products ? `${products.length} ürün listeleniyor` : "Yükleniyor…"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <ProductFilters filters={filters} onChange={setFilters} />
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 rounded-full border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 lg:hidden"
            >
              <SlidersHorizontal size={15} /> Filtrele
            </button>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value as FilterState["sort"] })}
              className="ml-auto rounded-full border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
              aria-label="Sırala"
            >
              <option value="onerilen">Önerilen</option>
              <option value="yeni">Yeniler</option>
              <option value="artan-fiyat">Fiyat: Artan</option>
              <option value="azalan-fiyat">Fiyat: Azalan</option>
            </select>
          </div>

          <ProductGrid products={products ?? []} isLoading={products === null} />
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-white p-6 shadow-floating">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg text-ink-900">Filtrele</h2>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink-100"
              >
                <X size={18} />
              </button>
            </div>
            <ProductFilters filters={filters} onChange={setFilters} />
          </div>
        </div>
      )}
    </div>
  );
}
