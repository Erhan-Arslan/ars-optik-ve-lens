import { Fragment, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { fetchAdminOrders, updateAdminOrderStatus } from "@/services/admin.service";
import { cn, formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderItemsDetail } from "@/components/admin/OrderItemsDetail";
import { useOrdersPageFeed, type FeedMessage } from "@/hooks/useAdminOrderFeed";
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Orders that arrived live during this visit, marked "Yeni" until the page is left.
  const [newOrderIds, setNewOrderIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    fetchAdminOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  // Live updates refetch from NestJS (the source of truth); on failure keep what is shown.
  const handleFeed = useCallback((message: FeedMessage) => {
    if (message.kind === "event" && message.event.type === "order.created") {
      const { orderId } = message.event;
      setNewOrderIds((ids) => new Set(ids).add(orderId));
    }
    fetchAdminOrders()
      .then(setOrders)
      .catch(() => undefined);
  }, []);
  useOrdersPageFeed(handleFeed);

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
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Detay</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {orders.map((order) => (
                <Fragment key={order.id}>
                  <tr>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      #{order.orderNumber}
                      {newOrderIds.has(order.id) && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="ml-2 inline-block rounded-full bg-gold-500 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-ink-950"
                        >
                          Yeni
                        </motion.span>
                      )}
                    </td>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setExpandedId((id) => (id === order.id ? null : order.id))}
                        aria-expanded={expandedId === order.id}
                        aria-controls={`order-detail-${order.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition-[border-color,color,transform] duration-150 hover:border-bronze-400 hover:text-bronze-600 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
                      >
                        {order.items.length} ürün
                        <ChevronDown
                          size={14}
                          aria-hidden="true"
                          className={cn("transition-transform duration-200", expandedId === order.id && "rotate-180")}
                        />
                      </button>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr id={`order-detail-${order.id}`}>
                      <td colSpan={6} className="bg-ink-50/60 px-4 py-4">
                        <OrderItemsDetail orderNumber={order.orderNumber} items={order.items} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
