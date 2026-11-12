import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useAdminOrderFeed } from "@/hooks/useAdminOrderFeed";
import type { AdminOrderEvent } from "@/types";

const VISIBLE_MS = 8_000;
const MAX_TOASTS = 3;

/** Floating notices for new orders, shown on every admin page. */
export function OrderToasts() {
  const { subscribe } = useAdminOrderFeed();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<AdminOrderEvent[]>([]);

  useEffect(
    () =>
      subscribe((message) => {
        if (message.kind !== "event" || message.event.type !== "order.created") return;
        const { event } = message;
        setToasts((current) => [event, ...current.filter((t) => t.orderId !== event.orderId)].slice(0, MAX_TOASTS));
        window.setTimeout(() => {
          setToasts((current) => current.filter((t) => t.orderId !== event.orderId));
        }, VISIBLE_MS);
      }),
    [subscribe],
  );

  const dismiss = (orderId: string) => setToasts((current) => current.filter((t) => t.orderId !== orderId));

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.orderId}
            layout="position"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-gold-200 bg-white/95 shadow-floating backdrop-blur-md sm:w-80"
          >
            <button
              type="button"
              onClick={() => {
                dismiss(toast.orderId);
                navigate("/admin/siparisler");
              }}
              className="flex w-full items-start gap-3 p-4 pr-10 text-left transition-transform duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-500"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gold-100 text-bronze-700">
                <ShoppingBag size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink-900">Yeni sipariş #{toast.orderNumber}</span>
                <span className="mt-0.5 block truncate text-xs text-ink-500">
                  {toast.customerName} · {toast.itemCount} ürün · {formatPrice(toast.total)}
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-label="Bildirimi kapat"
              onClick={() => dismiss(toast.orderId)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-[color,transform] duration-150 hover:text-ink-700 active:scale-90 focus-visible:outline-2 focus-visible:outline-gold-500"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
