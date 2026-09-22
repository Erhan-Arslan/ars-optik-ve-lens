import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";
import { registerRequest } from "@/services/auth.service";
import { extractErrorMessage } from "@/lib/api";

const schema = z.object({
  firstName: z.string().min(2, "Ad giriniz"),
  lastName: z.string().min(2, "Soyad giriniz"),
  email: z.string().email("Geçerli bir e-posta giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const { user, accessToken, refreshToken } = await registerRequest(data);
      setSession(user, { accessToken, refreshToken });
      navigate("/hesabim");
    } catch (error) {
      setFormError(extractErrorMessage(error, "Kayıt oluşturulamadı. Lütfen tekrar deneyin."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl text-ink-900">Hesap Oluşturun</h1>
      <p className="mt-2 text-sm text-ink-500">ARS Optik ve Lens ailesine katılın.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600">
            Ad
            <input {...register("firstName")} className={inputClass} placeholder="Ayşe" />
            {errors.firstName && <span className="text-[11px] font-normal text-red-600">{errors.firstName.message}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600">
            Soyad
            <input {...register("lastName")} className={inputClass} placeholder="Yılmaz" />
            {errors.lastName && <span className="text-[11px] font-normal text-red-600">{errors.lastName.message}</span>}
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600">
          E-posta
          <input {...register("email")} type="email" className={inputClass} placeholder="ornek@eposta.com" />
          {errors.email && <span className="text-[11px] font-normal text-red-600">{errors.email.message}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-600">
          Şifre
          <input {...register("password")} type="password" className={inputClass} placeholder="••••••••" />
          {errors.password && <span className="text-[11px] font-normal text-red-600">{errors.password.message}</span>}
        </label>
        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" className="mt-2" isLoading={isSubmitting}>
          Kayıt Ol
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Zaten hesabınız var mı?{" "}
        <Link to="/giris" className="font-medium text-bronze-600 hover:text-bronze-700">
          Giriş Yapın
        </Link>
      </p>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-800 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500";
