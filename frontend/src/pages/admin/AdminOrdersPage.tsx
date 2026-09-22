import { useEffect, useState } from "react";
import { fetchAdminOrders, updateAdminOrderStatus } from "@/services/admin.service";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AdminOrder, OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  hazirlaniyor: "Hazırlanıyor",
  kargoda: "Kargoda",
  "teslim-edildi": "Teslim Edildi",
  iptal: "İptal Edildi",
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    fetchAdminOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(id: string, status: OrderStatus) {
    setUpdatingId(id);
    try {
      const updated = await updateAdminOrderStatus(id, status);
      setOrders((prev) => (prev ? prev.map((o) => (o.id === id ? updated : o)) : prev));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">Siparişler</h1>
      <p className="mt-1 text-sm text-ink-500">{orders ? `${orders.length} sipariş` : "Yükleniyor…"}</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-elevated">
        {orders === null ? (
          <div className="flex flex-col gap-2 p-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-500">Henüz sipariş yok.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Sipariş</th>
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">Tutar</th>
                <th className="px-4 py-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">#{order.orderNumber}</td>
                  <td className="px-4 py-3 text-ink-600">
                    {order.user.firstName} {order.user.lastName}
                    <span className="block text-xs text-ink-400">{order.user.email}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-ink-900">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs text-ink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
