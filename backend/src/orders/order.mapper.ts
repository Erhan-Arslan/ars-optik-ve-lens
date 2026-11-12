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

// Generic so callers keep the fields of the order they passed in (id, orderNumber, user, ...).
export function serializeOrder<
  TItem extends { unitPrice: unknown },
  TOrder extends {
    status: OrderStatus;
    subtotal: unknown;
    shipping: unknown;
    total: unknown;
    items: TItem[];
    payment?: { status: PaymentStatus } | null;
  },
>(order: TOrder) {
  return {
    ...order,
    status: ORDER_STATUS_TO_SLUG[order.status],
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      prescriptionOdCylinder: toNumberOrNull(readField(item, 'prescriptionOdCylinder')),
      prescriptionOsCylinder: toNumberOrNull(readField(item, 'prescriptionOsCylinder')),
      prescriptionPupillaryDistance: toNumberOrNull(readField(item, 'prescriptionPupillaryDistance')),
    })),
  };
}

function readField(item: object, field: string): unknown {
  return (item as Record<string, unknown>)[field];
}

// Prisma returns DECIMAL columns as Decimal objects, which JSON-serialize as strings.
function toNumberOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}
