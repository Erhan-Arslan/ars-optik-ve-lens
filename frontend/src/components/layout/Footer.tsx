import { Link } from "react-router-dom";

function InstagramGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 21v-8.2h2.75l.41-3.2h-3.16V7.5c0-.93.26-1.56 1.59-1.56h1.7V3.1C15.98 3.04 15.02 3 13.9 3c-2.35 0-3.96 1.43-3.96 4.06v2.54H7.18v3.2h2.76V21h3.56Z" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.2 2h3.1l-6.8 7.77L22.5 22h-6.3l-4.9-6.4L5.6 22H2.5l7.28-8.32L2 2h6.46l4.44 5.87L18.2 2Zm-1.1 18.2h1.72L7 3.7H5.15l11.95 16.5Z" />
    </svg>
  );
}

const columns = [
  {
    title: "Alışveriş",
    links: [
      { label: "Çerçeveler", to: "/katalog?kategori=cerceve" },
      { label: "Güneş Gözlükleri", to: "/katalog?kategori=gunes-gozlugu" },
      { label: "Lensler", to: "/katalog?kategori=lens" },
    ],
  },
  {
    title: "Yardım",
    links: [
      { label: "Kargo ve Teslimat", to: "#" },
      { label: "İade ve Değişim", to: "#" },
      { label: "Sıkça Sorulan Sorular", to: "#" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { label: "Hakkımızda", to: "#" },
      { label: "Mağazalarımız", to: "#" },
      { label: "İletişim", to: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950 text-ink-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <img src="/logo.png" alt="ARS Optik ve Lens" className="h-16 w-auto brightness-125" />
            <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-ink-400">
              1998'den beri Türkiye'nin dört bir yanında görme sağlığına ve zarafete eşlik ediyoruz.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                { Icon: InstagramGlyph, label: "Instagram" },
                { Icon: FacebookGlyph, label: "Facebook" },
                { Icon: XGlyph, label: "X (Twitter)" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-300 transition-colors duration-200 hover:border-gold-500 hover:text-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-medium text-champagne-200">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink-400 transition-colors duration-200 hover:text-gold-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-8 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} ARS Optik ve Lens. Tüm hakları saklıdır.</p>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-ink-300">
              Gizlilik Politikası
            </Link>
            <Link to="#" className="hover:text-ink-300">
              Kullanım Şartları
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
