import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronRight, Heart, Minus, Plus, ShieldCheck, Truck, Upload } from "lucide-react";
import { fetchLensOptions, fetchProductBySlug } from "@/services/products.service";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { FrameIllustration } from "@/components/product/FrameIllustration";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";
import { useAuthStore } from "@/store/auth";
import type { LensCoating, LensType, PrescriptionInfo, Product } from "@/types";

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const authUser = useAuthStore((s) => s.user);
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [lensTypes, setLensTypes] = useState<LensType[]>([]);
  const [lensCoatings, setLensCoatings] = useState<LensCoating[]>([]);
  const [selectedColor, setSelectedColor] = useState<Product["colors"][number]>();
  const [selectedLensType, setSelectedLensType] = useState<LensType>();
  const [selectedCoating, setSelectedCoating] = useState<LensCoating>();
  const [quantity, setQuantity] = useState(1);
  const [prescription, setPrescription] = useState<PrescriptionInfo>({ odSphere: "", osSphere: "" });
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        setSelectedColor(p.colors[0]);
      })
      .catch(() => setProduct(null));
    fetchLensOptions().then(({ lensTypes, lensCoatings }) => {
      setLensTypes(lensTypes);
      setLensCoatings(lensCoatings);
      setSelectedLensType(lensTypes[0]);
      setSelectedCoating(lensCoatings[0]);
    });
  }, [slug]);

  if (product === null) {
    return <Navigate to="/katalog" replace />;
  }

  if (product === undefined || !selectedColor) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const lensSurcharge = (selectedLensType?.priceModifier ?? 0) + (selectedCoating?.priceModifier ?? 0);
  const unitPrice = product.price + (product.requiresPrescription ? lensSurcharge : 0);
  const totalPrice = unitPrice * quantity;

  function handleAddToCart() {
    if (!product || !selectedColor) return;
    addItem({
      product,
      selectedColor: selectedColor.name,
      quantity,
      lensType: product.requiresPrescription ? selectedLensType : undefined,
      lensCoating: product.requiresPrescription ? selectedCoating : undefined,
      prescription: product.requiresPrescription ? prescription : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-ink-500">
        <Link to="/" className="hover:text-bronze-600">Anasayfa</Link>
        <ChevronRight size={12} />
        <Link to="/katalog" className="hover:text-bronze-600">Katalog</Link>
        <ChevronRight size={12} />
        <span className="text-ink-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-ink-100 bg-gradient-to-br from-ink-50 to-champagne-50 p-10"
        >
          <FrameIllustration
            category={product.category}
            shape={product.shape}
            colorHex={selectedColor.hex}
            className="h-full w-full drop-shadow-[0_20px_40px_rgba(74,54,24,0.2)]"
          />
        </motion.div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-bronze-500">{product.brand}</span>
            <button
              type="button"
              aria-label={favoriteIds.has(product.id) ? "Favorilerden çıkar" : "Favorilere ekle"}
              aria-pressed={favoriteIds.has(product.id)}
              onClick={() => {
                if (!authUser) {
                  navigate("/giris");
                  return;
                }
                toggleFavorite(product.id);
              }}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-ink-200 text-ink-600 transition-colors duration-200 hover:border-bronze-400 hover:text-bronze-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            >
              <Heart size={17} className={cn(favoriteIds.has(product.id) && "fill-bronze-600 text-bronze-600")} />
            </button>
          </div>
          <h1 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={product.rating} reviewCount={product.reviewCount} />
            {product.isBestseller && <Badge variant="gold">Çok Satan</Badge>}
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-3xl text-ink-900">{formatPrice(totalPrice)}</span>
            {product.compareAtPrice && (
              <span className="text-base text-ink-400 line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
          </div>

          <p className="mt-5 max-w-lg leading-relaxed text-ink-600">{product.description}</p>

          {/* Color */}
          <div className="mt-8">
            <h3 className="mb-3 text-sm font-medium text-ink-900">
              Renk: <span className="font-normal text-ink-500">{selectedColor.name}</span>
            </h3>
            <div className="flex items-center gap-2.5">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  aria-label={color.name}
                  aria-pressed={selectedColor.name === color.name}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-9 w-9 rounded-full ring-offset-2 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
                    selectedColor.name === color.name ? "ring-2 ring-ink-800" : "ring-1 ring-ink-200",
                  )}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>

          {product.requiresPrescription && (
            <>
              {/* Lens type */}
              <div className="mt-8">
                <h3 className="mb-3 text-sm font-medium text-ink-900">Lens Tipi</h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {lensTypes.map((lt) => (
                    <button
                      key={lt.id}
                      type="button"
                      onClick={() => setSelectedLensType(lt)}
                      aria-pressed={selectedLensType?.id === lt.id}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors duration-150",
                        selectedLensType?.id === lt.id
                          ? "border-gold-500 bg-gold-50"
                          : "border-ink-200 hover:border-ink-300",
                      )}
                    >
                      <p className="text-sm font-medium text-ink-900">{lt.name}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {lt.priceModifier > 0 ? `+${formatPrice(lt.priceModifier)}` : "Ücretsiz"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coating */}
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-ink-900">Cam Kaplaması</h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {lensCoatings.map((lc) => (
                    <button
                      key={lc.id}
                      type="button"
                      onClick={() => setSelectedCoating(lc)}
                      aria-pressed={selectedCoating?.id === lc.id}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors duration-150",
                        selectedCoating?.id === lc.id
                          ? "border-gold-500 bg-gold-50"
                          : "border-ink-200 hover:border-ink-300",
                      )}
                    >
                      <p className="text-sm font-medium text-ink-900">{lc.name}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {lc.priceModifier > 0 ? `+${formatPrice(lc.priceModifier)}` : "Ücretsiz"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prescription */}
              <div className="mt-6 rounded-xl border border-ink-200 p-4">
                <h3 className="mb-3 text-sm font-medium text-ink-900">Reçete Bilgisi</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-ink-500">
                    Sağ Göz (OD) Sferik
                    <input
                      type="text"
                      placeholder="ör. -1.25"
                      value={prescription.odSphere}
                      onChange={(e) => setPrescription({ ...prescription, odSphere: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
                    />
                  </label>
                  <label className="text-xs text-ink-500">
                    Sol Göz (OS) Sferik
                    <input
                      type="text"
                      placeholder="ör. -1.50"
                      value={prescription.osSphere}
                      onChange={(e) => setPrescription({ ...prescription, osSphere: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 py-2.5 text-xs font-medium text-ink-500 transition-colors duration-150 hover:border-gold-500 hover:text-bronze-600"
                >
                  <Upload size={14} /> Reçete Dosyası Yükle (opsiyonel)
                </button>
              </div>
            </>
          )}

          {/* Quantity + add to cart */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center rounded-full border border-ink-200">
              <button
                type="button"
                aria-label="Azalt"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center text-ink-600 hover:text-bronze-600"
              >
                <Minus size={15} />
              </button>
              <span className="w-8 text-center text-sm font-medium text-ink-900">{quantity}</span>
              <button
                type="button"
                aria-label="Artır"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-11 w-11 items-center justify-center text-ink-600 hover:text-bronze-600"
              >
                <Plus size={15} />
              </button>
            </div>
            <Button size="lg" className="flex-1" onClick={handleAddToCart}>
              {added ? (
                <>
                  <Check size={18} /> Sepete Eklendi
                </>
              ) : (
                `Sepete Ekle — ${formatPrice(totalPrice)}`
              )}
            </Button>
          </div>

          {added && (
            <button
              type="button"
              onClick={() => navigate("/sepet")}
              className="mt-3 text-sm font-medium text-bronze-600 hover:text-bronze-700"
            >
              Sepete git →
            </button>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-ink-100 pt-6 text-sm text-ink-600">
            <div className="flex items-center gap-2.5">
              <Truck size={16} className="text-bronze-500" /> 750₺ üzeri siparişlerde ücretsiz kargo
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-bronze-500" /> 2 yıl üretim garantisi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
