import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore, cartTotal } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/Button";
import { FrameIllustration } from "@/components/product/FrameIllustration";

export function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = cartTotal(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          <ShoppingBag size={28} />
        </div>
        <h1 className="font-display text-2xl text-ink-900">Sepetiniz boş</h1>
        <p className="text-sm text-ink-500">Koleksiyonumuza göz atın ve beğendiğiniz ürünleri sepete ekleyin.</p>
        <Link to="/katalog" className={buttonVariants({ className: "mt-2" })}>
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-ink-900">Sepetim</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col divide-y divide-ink-100">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 py-6">
              <div className="h-24 w-28 flex-none overflow-hidden rounded-xl bg-gradient-to-br from-ink-50 to-champagne-50 p-2">
                <FrameIllustration
                  category={item.product.category}
                  shape={item.product.shape}
                  colorHex={item.product.colors.find((c) => c.name === item.selectedColor)?.hex ?? item.product.colors[0].hex}
                  className="h-full w-full"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link to={`/urun/${item.product.slug}`} className="font-display text-base text-ink-900 hover:text-bronze-700">
                        {item.product.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {item.selectedColor}
                        {item.lensType && item.lensType.priceModifier >= 0 ? ` · ${item.lensType.name}` : ""}
                        {item.lensCoating ? ` · ${item.lensCoating.name}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Kaldır"
                      onClick={() => removeItem(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors duration-150 hover:bg-ink-100 hover:text-bronze-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink-200">
                    <button
                      type="button"
                      aria-label="Azalt"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-ink-600 hover:text-bronze-600"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-ink-900">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Artır"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-ink-600 hover:text-bronze-600"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="font-display text-base text-ink-900">
                    {formatPrice((item.product.price + (item.lensType?.priceModifier ?? 0) + (item.lensCoating?.priceModifier ?? 0)) * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-2xl border border-ink-100 bg-white p-6 shadow-elevated">
          <h2 className="font-display text-lg text-ink-900">Sipariş Özeti</h2>
          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Ara Toplam</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Kargo</span>
              <span className={total >= 750 ? "text-bronze-600" : ""}>{total >= 750 ? "Ücretsiz" : formatPrice(60)}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-ink-100 pt-4 font-display text-lg text-ink-900">
            <span>Toplam</span>
            <span>{formatPrice(total + (total >= 750 ? 0 : 60))}</span>
          </div>
          <Link to="/odeme" className={buttonVariants({ className: "mt-6 w-full" })}>
            Ödemeye Geç
          </Link>
        </div>
      </div>
    </div>
  );
}
