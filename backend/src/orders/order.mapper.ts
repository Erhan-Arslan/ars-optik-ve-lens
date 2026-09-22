import { OrderStatus, PaymentStatus } from '../generated/prisma/enums.js';

export const ORDER_STATUS_TO_SLUG: Record<OrderStatus, string> = {
  [OrderStatus.HAZIRLANIYOR]: 'hazirlaniyor',
  [OrderStatus.KARGODA]: 'kargoda',
  [OrderStatus.TESLIM_EDILDI]: 'teslim-edildi',
  [OrderStatus.IPTAL]: 'iptal',
};

export const SLUG_TO_ORDER_STATUS: Record<string, OrderStatus> = {
  hazirlaniyor: OrderStatus.HAZIRLANIYOR,
  kargoda: OrderStatus.KARGODA,
  'teslim-edildi': OrderStatus.TESLIM_EDILDI,
  iptal: OrderStatus.IPTAL,
};

export function serializeOrder(order: {
  status: OrderStatus;
  subtotal: unknown;
  shipping: unknown;
  total: unknown;
  items: Array<{ unitPrice: unknown; [key: string]: unknown }>;
  payment?: { status: PaymentStatus } | null;
  [key: string]: unknown;
}) {
  return {
    ...order,
    status: ORDER_STATUS_TO_SLUG[order.status],
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    total: Number(order.total),
    items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice) })),
  };
}
