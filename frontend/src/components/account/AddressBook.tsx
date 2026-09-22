import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
} from "@/services/addresses.service";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { Address } from "@/types";

const addressSchema = z.object({
  title: z.string().min(2, "Bir başlık giriniz (ör. Ev, İş)"),
  fullName: z.string().min(3, "Ad soyad giriniz"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  city: z.string().min(2, "Şehir giriniz"),
  district: z.string().min(2, "İlçe giriniz"),
  addressLine: z.string().min(10, "Adresinizi detaylı yazınız"),
  zip: z.string().min(5, "Posta kodu giriniz").max(5),
});

type AddressForm = z.infer<typeof addressSchema>;

const inputClass =
  "w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-800 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500";

export function AddressBook() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });

  function load() {
    fetchAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreateForm() {
    setEditingId(null);
    reset({ title: "", fullName: "", phone: "", city: "", district: "", addressLine: "", zip: "" });
    setFormOpen(true);
  }

  function openEditForm(address: Address) {
    setEditingId(address.id);
    reset(address);
    setFormOpen(true);
  }

  async function onSubmit(data: AddressForm) {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateAddress(editingId, data);
      } else {
        await createAddress({ ...data, isDefault: (addresses?.length ?? 0) === 0 });
      }
      setFormOpen(false);
      load();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteAddress(id);
    load();
  }

  async function handleSetDefault(id: string) {
    await setDefaultAddress(id);
    load();
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-8 shadow-elevated">
      <div className="flex items-center gap-2.5">
        <MapPin size={18} className="text-bronze-600" />
        <h2 className="font-display text-lg text-ink-900">Adreslerim</h2>
        {!formOpen && (
          <Button size="sm" variant="outline" className="ml-auto" onClick={openCreateForm}>
            <Plus size={14} /> Yeni Adres
          </Button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-ink-100 bg-ink-50/50 p-5 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600 sm:col-span-2">
            Başlık
            <input {...register("title")} className={inputClass} placeholder="Ev, İş…" />
            {errors.title && <span className="text-[11px] font-normal text-red-600">{errors.title.message}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600 sm:col-span-2">
            Ad Soyad
            <input {...register("fullName")} className={inputClass} />
            {errors.fullName && <span className="text-[11px] font-normal text-red-600">{errors.fullName.message}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600">
            Telefon
            <input {...register("phone")} className={inputClass} />
            {errors.phone && <span className="text-[11px] font-normal text-red-600">{errors.phone.message}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600">
            Posta Kodu
            <input {...register("zip")} className={inputClass} />
            {errors.zip && <span className="text-[11px] font-normal text-red-600">{errors.zip.message}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600">
            Şehir
            <input {...register("city")} className={inputClass} />
            {errors.city && <span className="text-[11px] font-normal text-red-600">{errors.city.message}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600">
            İlçe
            <input {...register("district")} className={inputClass} />
            {errors.district && <span className="text-[11px] font-normal text-red-600">{errors.district.message}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600 sm:col-span-2">
            Açık Adres
            <textarea {...register("addressLine")} rows={2} className={inputClass} />
            {errors.addressLine && (
              <span className="text-[11px] font-normal text-red-600">{errors.addressLine.message}</span>
            )}
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" isLoading={isSubmitting}>
              {editingId ? "Güncelle" : "Kaydet"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Vazgeç
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {addresses === null && (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        )}

        {addresses?.length === 0 && !formOpen && (
          <p className="py-6 text-center text-sm text-ink-500">Henüz kayıtlı adresiniz yok.</p>
        )}

        {addresses?.map((address) => (
          <div
            key={address.id}
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between",
              address.isDefault ? "border-gold-400 bg-gold-50/50" : "border-ink-100",
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink-900">{address.title}</p>
                {address.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-bronze-700">
                    <Star size={10} className="fill-bronze-700" /> Varsayılan
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-600">{address.fullName} · {address.phone}</p>
              <p className="mt-0.5 text-sm text-ink-500">
                {address.addressLine}, {address.district}/{address.city} {address.zip}
              </p>
            </div>
            <div className="flex flex-none items-center gap-1.5">
              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => handleSetDefault(address.id)}
                  className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-gold-500 hover:text-bronze-600"
                >
                  Varsayılan yap
                </button>
              )}
              <button
                type="button"
                aria-label="Düzenle"
                onClick={() => openEditForm(address)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-bronze-600"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                aria-label="Sil"
                onClick={() => handleDelete(address.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
