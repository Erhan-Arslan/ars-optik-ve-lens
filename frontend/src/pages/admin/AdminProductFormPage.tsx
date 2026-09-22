import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import {
  createAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
} from "@/services/admin.service";
import { extractErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const productSchema = z.object({
  slug: z.string().min(2, "Slug giriniz").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanın"),
  name: z.string().min(2, "Ürün adı giriniz"),
  brand: z.string().min(2, "Marka giriniz"),
  category: z.enum(["cerceve", "gunes-gozlugu", "lens"]),
  gender: z.enum(["kadin", "erkek", "unisex"]),
  shape: z.enum(["yuvarlak", "kare", "kelebek", "pilot", "oval", "dikdortgen", ""]).optional(),
  price: z.number().positive("Fiyat giriniz"),
  compareAtPrice: z.string().optional(),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalı"),
  material: z.string().optional(),
  isNew: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  requiresPrescription: z.boolean().optional(),
  colors: z
    .array(z.object({ name: z.string().min(1, "Renk adı giriniz"), hex: z.string().min(3, "Hex kodu giriniz") }))
    .min(1, "En az bir renk ekleyin"),
});

type ProductForm = z.infer<typeof productSchema>;

const inputClass =
  "w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-800 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500";

export function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!isEdit);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: "cerceve",
      gender: "unisex",
      colors: [{ name: "", hex: "#C89A3E" }],
      isNew: false,
      isBestseller: false,
      requiresPrescription: false,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "colors" });

  useEffect(() => {
    if (!isEdit || !id) return;
    fetchAdminProducts().then((products) => {
      const product = products.find((p) => p.id === id);
      if (product) {
        reset({
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          category: product.category,
          gender: product.gender,
          shape: product.shape ?? "",
          price: product.price,
          compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
          description: product.description,
          material: product.material ?? "",
          isNew: product.isNew ?? false,
          isBestseller: product.isBestseller ?? false,
          requiresPrescription: product.requiresPrescription,
          colors: product.colors,
        });
      }
      setLoaded(true);
    });
  }, [id, isEdit, reset]);

  async function onSubmit(data: ProductForm) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        ...data,
        shape: data.shape || undefined,
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
      };
      if (isEdit && id) {
        await updateAdminProduct(id, payload);
      } else {
        await createAdminProduct(payload);
      }
      navigate("/admin/urunler");
    } catch (error) {
      setFormError(extractErrorMessage(error, "Ürün kaydedilemedi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!loaded) {
    return <p className="text-sm text-ink-500">Yükleniyor…</p>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">{isEdit ? "Ürünü Düzenle" : "Yeni Ürün"}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-6">
        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-elevated">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ürün Adı" error={errors.name?.message} className="sm:col-span-2">
              <input {...register("name")} className={inputClass} />
            </Field>
            <Field label="Slug (URL)" error={errors.slug?.message}>
              <input {...register("slug")} className={inputClass} placeholder="leo-yuvarlak-cerceve" />
            </Field>
            <Field label="Marka" error={errors.brand?.message}>
              <input {...register("brand")} className={inputClass} />
            </Field>
            <Field label="Kategori" error={errors.category?.message}>
              <select {...register("category")} className={inputClass}>
                <option value="cerceve">Çerçeve</option>
                <option value="gunes-gozlugu">Güneş Gözlüğü</option>
                <option value="lens">Lens</option>
              </select>
            </Field>
            <Field label="Cinsiyet" error={errors.gender?.message}>
              <select {...register("gender")} className={inputClass}>
                <option value="unisex">Unisex</option>
                <option value="kadin">Kadın</option>
                <option value="erkek">Erkek</option>
              </select>
            </Field>
            <Field label="Çerçeve Şekli" error={errors.shape?.message}>
              <select {...register("shape")} className={inputClass}>
                <option value="">—</option>
                <option value="yuvarlak">Yuvarlak</option>
                <option value="oval">Oval</option>
                <option value="kare">Kare</option>
                <option value="dikdortgen">Dikdörtgen</option>
                <option value="pilot">Pilot</option>
                <option value="kelebek">Kelebek</option>
              </select>
            </Field>
            <Field label="Malzeme (opsiyonel)" error={errors.material?.message}>
              <input {...register("material")} className={inputClass} />
            </Field>
            <Field label="Fiyat (₺)" error={errors.price?.message}>
              <input type="number" step="0.01" {...register("price", { valueAsNumber: true })} className={inputClass} />
            </Field>
            <Field label="İndirim Öncesi Fiyat (opsiyonel)" error={errors.compareAtPrice?.message}>
              <input type="number" step="0.01" {...register("compareAtPrice")} className={inputClass} />
            </Field>
            <Field label="Açıklama" error={errors.description?.message} className="sm:col-span-2">
              <textarea {...register("description")} rows={4} className={inputClass} />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" {...register("isNew")} className="h-4 w-4 accent-gold-500" /> Yeni ürün
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" {...register("isBestseller")} className="h-4 w-4 accent-gold-500" /> Çok satan
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" {...register("requiresPrescription")} className="h-4 w-4 accent-gold-500" />{" "}
              Reçete gerektirir
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-elevated">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink-900">Renk Seçenekleri</h2>
            <button
              type="button"
              onClick={() => append({ name: "", hex: "#C89A3E" })}
              className="flex items-center gap-1.5 text-xs font-medium text-bronze-600 hover:text-bronze-700"
            >
              <Plus size={13} /> Renk Ekle
            </button>
          </div>
          {errors.colors?.message && (
            <p className="mb-3 text-xs text-red-600">{errors.colors.message}</p>
          )}
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3">
                <input
                  type="color"
                  {...register(`colors.${index}.hex`)}
                  className="h-10 w-10 flex-none cursor-pointer rounded-lg border border-ink-200"
                />
                <input
                  {...register(`colors.${index}.name`)}
                  className={cn(inputClass, "flex-1")}
                  placeholder="Renk adı (ör. Antik Altın)"
                />
                <button
                  type="button"
                  aria-label="Rengi kaldır"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? "Değişiklikleri Kaydet" : "Ürünü Oluştur"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/urunler")}>
            Vazgeç
          </Button>
        </div>
      </form>
    </div>
  );
}

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
