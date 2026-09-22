import { api } from "@/lib/api";
import type { Address, CartItem, Order } from "@/types";

export interface CheckoutCard {
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}

export interface CheckoutAddress {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  zip: string;
}

export async function createOrder(input: {
  address: CheckoutAddress;
  card: CheckoutCard;
  items: CartItem[];
}): Promise<Order> {
  const payload = {
    address: input.address,
    card: input.card,
    items: input.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      selectedColor: item.selectedColor,
      lensTypeId: item.lensType?.id,
      lensCoatingId: item.lensCoating?.id,
      prescriptionOdSphere: item.prescription?.odSphere,
      prescriptionOsSphere: item.prescription?.osSphere,
      prescriptionNotes: item.prescription?.notes,
    })),
  };
  const { data } = await api.post<Order>("/orders", payload);
  return data;
}

export async function fetchMyOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>("/orders");
  return data;
}

export type { Address };
