import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { fetchProducts } from "@/services/products.service";
import { ProductGrid } from "@/components/product/ProductGrid";
import { buttonVariants } from "@/components/ui/Button";
import { FrameIllustration } from "@/components/product/FrameIllustration";
import type { Product } from "@/types";

const categories = [
  { label: "Çerçeveler", to: "/katalog?kategori=cerceve", shape: "kelebek" as const, category: "cerceve" as const, color: "#C89A3E" },
  { label: "Güneş Gözlükleri", to: "/katalog?kategori=gunes-gozlugu", shape: "pilot" as const, category: "gunes-gozlugu" as const, color: "#9C6024" },
  { label: "Lensler", to: "/katalog?kategori=lens", shape: undefined, category: "lens" as const, color: "#E4D878" },
];

const perks = [
  { icon: ShieldCheck, title: "2 Yıl Garanti", desc: "Tüm çerçevelerde üretim hatalarına karşı garanti." },
  { icon: Truck, title: "Ücretsiz Kargo", desc: "750₺ ve üzeri siparişlerde kargo bedava." },
  { icon: Sparkles, title: "Uzman Optisyenler", desc: "Reçete kontrolü ve kişisel danışmanlık." },
];

const heroStats = [
  { value: "1998", label: "Kuruluş Yılı" },
  { value: "50.000+", label: "Mutlu Müşteri" },
  { value: "42", label: "Mağaza" },
  { value: "4.8/5", label: "Müşteri Puanı" },
];

const heroParticles = [
  { left: "8%", top: "18%", size: 6, duration: 4.5, delay: 0 },
  { left: "92%", top: "28%", size: 4, duration: 5.5, delay: 0.6 },
  { left: "48%", top: "8%", size: 5, duration: 6, delay: 1.1 },
  { left: "18%", top: "72%", size: 4, duration: 5, delay: 0.3 },
  { left: "82%", top: "68%", size: 6, duration: 4.8, delay: 0.9 },
];

export function HomePage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  const bestsellers = (products ?? []).filter((p) => p.isBestseller).slice(0, 4);
  const newArrivals = (products ?? []).filter((p) => p.isNew).slice(0, 4);
  const isLoading = products === null;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="bg-noise absolute inset-0" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 20% 20%, rgba(200,154,62,0.35), transparent 60%), radial-gradient(ellipse 50% 60% at 85% 80%, rgba(156,96,36,0.3), transparent 60%), radial-gradient(ellipse 40% 40% at 60% 10%, rgba(228,216,120,0.14), transparent 60%)",
          }}
        />
        {/* drifting accent dots */}
        {heroParticles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute hidden rounded-full bg-gold-400/70 sm:block"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
            animate={{ y: [0, -14, 0], opacity: [0.25, 0.7, 0.25] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-14 pt-20 sm:px-6 lg:grid-cols-2 lg:pt-32 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-400">
              1998'den beri Türkiye'de
            </span>
            <h1 className="mt-6 font-display text-4xl font-medium leading-[1.1] text-champagne-50 sm:text-5xl lg:text-[3.75rem]">
              Görüşünüz kadar
              <br />
              <span className="italic text-gold-400">zarif</span> bir tarz.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-300">
              ARS Optik ve Lens'in el işçiliği çerçeveleri, polarize güneş gözlükleri ve konforlu lensleriyle
              tanışın. Uzman optisyenlerimizle reçeteden teslimata her adımda yanınızdayız.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/katalog" className={buttonVariants({ size: "lg" })}>
                Koleksiyonu Keşfet
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/katalog?kategori=gunes-gozlugu"
                className="text-sm font-medium text-champagne-100 underline decoration-gold-500/50 decoration-2 underline-offset-4 transition-colors hover:text-gold-400"
              >
                Güneş gözlüklerine göz at
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative flex items-center justify-center"
          >
            <div className="absolute h-72 w-72 rounded-full bg-gold-500/20 blur-3xl sm:h-96 sm:w-96" />

            <motion.div
              className="absolute -left-2 top-6 hidden w-24 rounded-2xl border border-white/10 bg-white/5 p-2.5 shadow-floating backdrop-blur-sm sm:block"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <FrameIllustration category="cerceve" shape="yuvarlak" colorHex="#E4D878" className="h-full w-full" />
            </motion.div>
            <motion.div
              className="absolute -right-4 bottom-10 hidden w-28 rounded-2xl border border-white/10 bg-white/5 p-2.5 shadow-floating backdrop-blur-sm sm:block"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            >
              <FrameIllustration category="gunes-gozlugu" shape="pilot" colorHex="#9C6024" className="h-full w-full" />
            </motion.div>

            <img
              src="/logo.png"
              alt="ARS Optik ve Lens"
              className="relative h-56 w-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] sm:h-72 lg:h-80"
            />
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-7xl border-t border-white/10 px-4 pb-32 pt-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl text-gold-400 sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-ink-400 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks — floating card overlapping the hero/white section seam */}
      <section className="relative bg-white pt-14 pb-2 sm:pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="-mt-24 grid grid-cols-1 gap-8 rounded-3xl border border-ink-100 bg-white p-8 shadow-floating sm:grid-cols-3 sm:p-10"
          >
            {perks.map((perk) => (
              <div key={perk.title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gold-100 text-bronze-600 ring-4 ring-gold-50">
                  <perk.icon size={21} />
                </div>
                <div>
                  <p className="font-display text-base text-ink-900">{perk.title}</p>
                  <p className="mt-0.5 text-sm text-ink-500">{perk.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-bronze-500">Kategoriler</span>
            <h2 className="mt-2 font-display text-3xl text-ink-900">Size uygun stili bulun</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={cat.to}
                className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 to-ink-800 p-6 shadow-elevated transition-shadow duration-300 hover:shadow-floating"
              >
                <div className="absolute inset-0 flex items-center justify-center p-10 opacity-90 transition-transform duration-500 ease-out group-hover:scale-110">
                  <FrameIllustration category={cat.category} shape={cat.shape} colorHex={cat.color} className="h-full w-full" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="relative flex items-center justify-between">
                  <span className="font-display text-xl text-champagne-50">{cat.label}</span>
                  <ArrowRight size={18} className="text-gold-400 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-bronze-500">Öne Çıkanlar</span>
              <h2 className="mt-2 font-display text-3xl text-ink-900">Çok Satanlar</h2>
            </div>
            <Link to="/katalog" className="hidden items-center gap-1.5 text-sm font-medium text-bronze-600 hover:text-bronze-700 sm:flex">
              Tümünü Gör <ArrowRight size={15} />
            </Link>
          </div>
          <ProductGrid products={bestsellers} isLoading={isLoading} />
        </div>
      </section>

      {/* Brand story */}
      <section className="relative overflow-hidden bg-ink-950 py-20 lg:py-28">
        <div className="bg-noise absolute inset-0" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 45% 55% at 15% 50%, rgba(200,154,62,0.25), transparent 60%), radial-gradient(ellipse 40% 45% at 90% 20%, rgba(228,216,120,0.12), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -110 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center"
          >
            <div className="absolute h-64 w-64 rounded-full bg-gold-500/15 blur-3xl sm:h-80 sm:w-80" />
            <img
              src="/logo.png"
              alt="ARS Optik ve Lens aslan amblemi"
              className="relative h-52 w-auto opacity-95 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:h-64"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 110 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-gold-400">Hikayemiz</span>
            <h2 className="mt-3 font-display text-3xl leading-tight text-champagne-50 sm:text-4xl">
              Zanaatkarlıkla şekillenen, <span className="italic text-gold-400">güvenle</span> taşınan gözlükler.
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-ink-300">
              ARS Optik ve Lens, İtalyan asetat ve titanyum alaşımlarını Anadolu'nun optisyenlik geleneğiyle
              buluşturuyor. Her çerçeve, uzman gözüyle seçilir; her reçete, özenle karşılanır.
            </p>
            <Link to="/katalog" className={buttonVariants({ variant: "secondary", size: "lg", className: "mt-8" })}>
              Mağazayı Ziyaret Et
            </Link>
          </motion.div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-bronze-500">Yeni Sezon</span>
              <h2 className="mt-2 font-display text-3xl text-ink-900">Yeni Gelenler</h2>
            </div>
            <Link to="/katalog" className="hidden items-center gap-1.5 text-sm font-medium text-bronze-600 hover:text-bronze-700 sm:flex">
              Tümünü Gör <ArrowRight size={15} />
            </Link>
          </div>
          <ProductGrid products={newArrivals} isLoading={isLoading} />
        </div>
      </section>
    </div>
  );
}
