import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center sm:px-6">
      <span className="font-display text-7xl text-gold-500">404</span>
      <h1 className="mt-4 font-display text-2xl text-ink-900">Sayfa Bulunamadı</h1>
      <p className="mt-2 text-sm text-ink-500">Aradığınız sayfa kaldırılmış veya hiç var olmamış olabilir.</p>
      <Link to="/" className={buttonVariants({ className: "mt-8" })}>
        Anasayfaya Dön
      </Link>
    </div>
  );
}
