import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteAdminProduct, fetchAdminProducts } from "@/services/admin.service";
import { formatPrice } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetchAdminProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteAdminProduct(id);
      load();
    } catch {
      setError("Ürün silinemedi. Geçmiş siparişlerde kullanılıyor olabilir.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink-900">Ürünler</h1>
          <p className="mt-1 text-sm text-ink-500">{products ? `${products.length} ürün` : "Yükleniyor…"}</p>
        </div>
        <Link to="/admin/urunler/yeni" className={buttonVariants({ size: "sm" })}>
          <Plus size={15} /> Yeni Ürün
        </Link>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-elevated">
        {products === null ? (
          <div className="flex flex-col gap-2 p-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ürün</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Fiyat</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{product.name}</p>
                    <p className="text-xs text-ink-500">{product.brand}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{product.category}</td>
                  <td className="px-4 py-3 text-ink-900">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/admin/urunler/${product.id}`}
                        aria-label="Düzenle"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-bronze-600"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        type="button"
                        aria-label="Sil"
                        disabled={deletingId === product.id}
                        onClick={() => handleDelete(product.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
