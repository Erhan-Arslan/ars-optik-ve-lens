import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, CreditCard, Lock, MapPin, Plus } from "lucide-react";
import { useCartStore, cartTotal } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { formatPrice, cn } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { createOrder } from "@/services/orders.service";
import { fetchAddresses } from "@/services/addresses.service";
import type { Address } from "@/types";

const checkoutSchema = z.object({
  fullName: z.string().min(3, "Ad soyad giriniz"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  city: z.string().min(2, "Şehir giriniz"),
  district: z.string().min(2, "İlçe giriniz"),
  addressLine: z.string().min(10, "Adresinizi detaylı yazınız"),
  zip: z.string().min(5, "Posta kodu giriniz").max(5),
  cardName: z.string().min(3, "Kart üzerindeki ismi giriniz"),
  cardNumber: z
    .string()
    .min(16, "Kart numarası 16 haneli olmalı")
    .max(19)
    .regex(/^[\d\s]+$/, "Sadece rakam giriniz"),
  cardExpiry: z.string().regex(/^\d{2}\/\d{2}$/, "AA/YY formatında giriniz"),
  cardCvc: z.string().min(3, "CVC 3 haneli olmalı").max(4),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const user = useAuthStore((s) => s.user);
  const total = cartTotal(items);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new" | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckoutForm>({ resolver: zodResolver(checkoutSchema) });

  useEffect(() => {
    if (!user) return;
    fetchAddresses().then((addresses) => {
      setSavedAddresses(addresses);
      const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (preferred) {
        setSelectedAddressId(preferred.id);
        reset((prev) => ({ ...prev, ...preferred }));
      } else {
        setSelectedAddressId("new");
      }
    });
  }, [user, reset]);

  function selectSavedAddress(address: Address) {
    setSelectedAddressId(address.id);
    reset((prev) => ({ ...prev, ...address }));
  }

  function selectNewAddress() {
    setSelectedAddressId("new");
    reset({ fullName: "", phone: "", city: "", district: "", addressLine: "", zip: "" });
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  if (items.length === 0) {
    return <Navigate to="/sepet" replace />;
  }

  const shipping = total >= 750 ? 0 : 60;
  const grandTotal = total + shipping;

  async function onSubmit(data: CheckoutForm) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const order = await createOrder({
        address: {
          fullName: data.fullName,
          phone: data.phone,
          city: data.city,
          district: data.district,
          addressLine: data.addressLine,
          zip: data.zip,
        },
        card: {
          cardName: data.cardName,
          cardNumber: data.cardNumber,
          cardExpiry: data.cardExpiry,
          cardCvc: data.cardCvc,
        },
        items,
      });
      // Cart is cleared on the confirmation page, not here — clearing it in this
      // component would flip the "empty cart" guard above while we're still
      // mounted and race with this navigation (it would win intermittently).
      navigate(`/siparis-onay/${order.orderNumber}`);
    } catch (error) {
      setFormError(
        extractErrorMessage(error, "Ödeme alınamadı. Kart bilgilerinizi kontrol edip tekrar deneyin."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-ink-900">Ödeme</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-elevated">
            <div className="mb-5 flex items-center gap-2.5">
              <MapPin size={18} className="text-bronze-600" />
              <h2 className="font-display text-lg text-ink-900">Teslimat Adresi</h2>
            </div>

            {savedAddresses.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2.5">
                {savedAddresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => selectSavedAddress(address)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors duration-150",
                      selectedAddressId === address.id
                        ? "border-gold-500 bg-gold-50"
                        : "border-ink-200 hover:border-ink-300",
                    )}
                  >
                    {selectedAddressId === address.id && <Check size={13} className="text-bronze-600" />}
                    <span>
                      <span className="font-semibold text-ink-900">{address.title}</span>
                      <span className="block text-ink-500">{address.district}/{address.city}</span>
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={selectNewAddress}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-colors duration-150",
                    selectedAddressId === "new"
                      ? "border-gold-500 bg-gold-50 text-bronze-700"
                      : "border-dashed border-ink-300 text-ink-500 hover:border-ink-400",
                  )}
                >
                  <Plus size={13} /> Yeni Adres
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Ad Soyad" error={errors.fullName?.message} className="sm:col-span-2">
                <input {...register("fullName")} className={inputClass} placeholder="Ayşe Yılmaz" />
              </Field>
              <Field label="Telefon" error={errors.phone?.message}>
                <input {...register("phone")} className={inputClass} placeholder="05XX XXX XX XX" />
              </Field>
              <Field label="Posta Kodu" error={errors.zip?.message}>
                <input {...register("zip")} className={inputClass} placeholder="34000" />
              </Field>
              <Field label="Şehir" error={errors.city?.message}>
                <input {...register("city")} className={inputClass} placeholder="İstanbul" />
              </Field>
              <Field label="İlçe" error={errors.district?.message}>
                <input {...register("district")} className={inputClass} placeholder="Kadıköy" />
              </Field>
              <Field label="Açık Adres" error={errors.addressLine?.message} className="sm:col-span-2">
                <textarea {...register("addressLine")} rows={3} className={inputClass} placeholder="Mahalle, sokak, bina no, daire no" />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-elevated">
            <div className="mb-5 flex items-center gap-2.5">
              <CreditCard size={18} className="text-bronze-600" />
              <h2 className="font-display text-lg text-ink-900">Ödeme Bilgileri</h2>
              <span className="ml-auto flex items-center gap-1 text-xs text-ink-400">
                <Lock size={12} /> Güvenli test ortamı
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Kart Üzerindeki İsim" error={errors.cardName?.message} className="sm:col-span-2">
                <input {...register("cardName")} className={inputClass} placeholder="AYŞE YILMAZ" />
              </Field>
              <Field label="Kart Numarası" error={errors.cardNumber?.message} className="sm:col-span-2">
                <input {...register("cardNumber")} className={inputClass} placeholder="4242 4242 4242 4242" />
              </Field>
              <Field label="Son Kullanma (AA/YY)" error={errors.cardExpiry?.message}>
                <input {...register("cardExpiry")} className={inputClass} placeholder="12/28" />
              </Field>
              <Field label="CVC" error={errors.cardCvc?.message}>
                <input {...register("cardCvc")} className={inputClass} placeholder="123" />
              </Field>
            </div>
          </section>
        </div>

        <div className="h-fit rounded-2xl border border-ink-100 bg-white p-6 shadow-elevated">
          <h2 className="font-display text-lg text-ink-900">Sipariş Özeti</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-600">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="line-clamp-1">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="flex-none">
                  {formatPrice((item.product.price + (item.lensType?.priceModifier ?? 0) + (item.lensCoating?.priceModifier ?? 0)) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-ink-100 pt-4 text-sm text-ink-600">
            <div className="flex justify-between">
              <span>Ara Toplam</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kargo</span>
              <span>{shipping === 0 ? "Ücretsiz" : formatPrice(shipping)}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-ink-100 pt-4 font-display text-lg text-ink-900">
            <span>Toplam</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
          {formError && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" className="mt-6 w-full" isLoading={isSubmitting}>
            {isSubmitting ? "İşleniyor…" : `Siparişi Onayla`}
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-800 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500";

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-xs font-medium text-ink-600", className)}>
      {label}
      {children}
      {error && <span className="text-[11px] font-normal text-red-600">{error}</span>}
    </label>
  );
}
