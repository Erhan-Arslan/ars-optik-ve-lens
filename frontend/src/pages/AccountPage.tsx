import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchMyOrders } from "@/services/orders.service";
import { formatPrice, cn } from "@/lib/utils";
import { AddressBook } from "@/components/account/AddressBook";
import type { Order, OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  hazirlaniyor: "Hazırlanıyor",
  kargoda: "Kargoda",
  "teslim-edildi": "Teslim Edildi",
  iptal: "İptal Edildi",
};

const TABS = [
  { id: "siparisler", label: "Siparişlerim", icon: Package },
  { id: "adresler", label: "Adreslerim", icon: MapPin },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<TabId>("siparisler");

  useEffect(() => {
    if (!user) return;
    fetchMyOrders()
      .then(setOrders)
      .catch(() => setLoadError(true));
  }, [user]);

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-100 text-bronze-700">
          <UserIcon size={26} />
        </div>
        <div>
          <h1 className="font-display text-2xl text-ink-900">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-ink-500">{user.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/favoriler"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-600 hover:border-bronze-400 hover:text-bronze-600"
            aria-label="Favorilerim"
          >
            <Heart size={15} />
          </Link>
          {user.role === "admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-full border border-ink-200 px-3.5 py-2 text-xs font-medium text-ink-600 hover:border-bronze-400 hover:text-bronze-600"
            >
              <LayoutDashboard size={14} /> Yönetim Paneli
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut size={14} /> Çıkış Yap
          </Button>
        </div>
      </div>

      <div className="mt-8 flex gap-2 border-b border-ink-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150",
              tab === t.id
                ? "border-gold-500 text-bronze-700"
                : "border-transparent text-ink-500 hover:text-ink-700",
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "siparisler" && (
          <div className="rounded-2xl border border-ink-100 bg-white p-8 shadow-elevated">
            <div className="flex items-center gap-2.5">
              <Package size={18} className="text-bronze-600" />
              <h2 className="font-display text-lg text-ink-900">Siparişlerim</h2>
            </div>

            {orders === null && !loadError && (
              <div className="mt-6 flex flex-col gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {loadError && <p className="mt-6 text-center text-sm text-ink-500">Siparişler yüklenemedi.</p>}

            {orders?.length === 0 && (
              <div className="mt-6 flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-sm text-ink-500">Henüz siparişiniz bulunmuyor.</p>
              </div>
            )}

            {orders && orders.length > 0 && (
              <ul className="mt-6 flex flex-col divide-y divide-ink-100">
                {orders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-ink-900">#{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {" · "}
                        {order.items.length} ürün
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={order.status === "iptal" ? "outline" : "ink"}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                      <span className="font-display text-sm text-ink-900">{formatPrice(order.total)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "adresler" && <AddressBook />}
      </div>
    </div>
  );
}
