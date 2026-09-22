import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowLeft, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin/urunler", label: "Ürünler", icon: Package },
  { to: "/admin/siparisler", label: "Siparişler", icon: ShoppingBag },
];

export function AdminLayout() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
      <aside className="flex-none lg:w-56">
        <img src="/logo.png" alt="ARS Optik ve Lens" className="h-12 w-auto" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-bronze-500">
          Yönetim Paneli
        </p>
        <nav className="mt-5 flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-150",
                  isActive ? "bg-gold-100 text-bronze-700" : "text-ink-600 hover:bg-ink-100",
                )
              }
            >
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/"
          className="mt-6 flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-bronze-600"
        >
          <ArrowLeft size={13} /> Mağazaya dön
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
