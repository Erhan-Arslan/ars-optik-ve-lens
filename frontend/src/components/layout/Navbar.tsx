import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore, cartItemCount } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useFavoritesStore } from "@/store/favorites";

const navLinks = [
  { to: "/katalog?kategori=cerceve", label: "Çerçeveler" },
  { to: "/katalog?kategori=gunes-gozlugu", label: "Güneş Gözlükleri" },
  { to: "/katalog?kategori=lens", label: "Lensler" },
  { to: "/katalog", label: "Tüm Ürünler" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const user = useAuthStore((s) => s.user);
  const count = cartItemCount(items);
  const favoritesCount = useFavoritesStore((s) => s.ids.size);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/katalog?arama=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-ink-50/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="ARS Optik ve Lens" className="h-14 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium tracking-wide text-ink-600 transition-colors duration-200 hover:text-bronze-600",
                  isActive && "text-bronze-700",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label={searchOpen ? "Aramayı kapat" : "Ara"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
            className={cn(
              "hidden h-10 w-10 items-center justify-center rounded-full text-ink-600 transition-colors duration-200 hover:bg-ink-100 hover:text-bronze-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 sm:flex",
              searchOpen && "bg-ink-100 text-bronze-600",
            )}
          >
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </button>
          <Link
            to={user ? "/favoriler" : "/giris"}
            aria-label="Favorilerim"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink-600 transition-colors duration-200 hover:bg-ink-100 hover:text-bronze-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 sm:flex"
          >
            <Heart size={19} />
            {favoritesCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink-950">
                {favoritesCount}
              </span>
            )}
          </Link>
          <Link
            to={user ? "/hesabim" : "/giris"}
            aria-label="Hesabım"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-ink-600 transition-colors duration-200 hover:bg-ink-100 hover:text-bronze-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 sm:flex"
          >
            <User size={19} />
          </Link>
          <Link
            to="/sepet"
            aria-label="Sepetim"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-600 transition-colors duration-200 hover:bg-ink-100 hover:text-bronze-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
          >
            <ShoppingBag size={19} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink-950">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-600 transition-colors duration-200 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 lg:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="hidden overflow-hidden border-t border-ink-100 bg-white sm:block"
          >
            <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <Search size={18} className="flex-none text-ink-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün veya marka ara…"
                className="flex-1 border-none bg-transparent text-base text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-gold-500 px-5 py-2 text-sm font-medium text-ink-950 transition-colors duration-200 hover:bg-gold-400"
              >
                Ara
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-ink-100 bg-ink-50 px-4 py-3 lg:hidden">
          <form
            onSubmit={handleSearchSubmit}
            className="mb-2 flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2"
          >
            <Search size={15} className="flex-none text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün veya marka ara…"
              className="flex-1 border-none bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
          </form>
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to={user ? "/hesabim" : "/giris"}
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            Hesabım
          </Link>
        </nav>
      )}
    </header>
  );
}
