import { create } from "zustand";
import { persist } from "zustand/middleware";
import { prescriptionKey } from "@/lib/prescription";
import type { CartItem, LensCoating, LensIndex, LensType, PrescriptionInfo, Product } from "@/types";

interface AddToCartInput {
  product: Product;
  selectedColor: string;
  quantity?: number;
  lensType?: LensType;
  lensCoating?: LensCoating;
  lensIndex?: LensIndex;
  prescription?: PrescriptionInfo;
}

interface CartState {
  items: CartItem[];
  addItem: (input: AddToCartInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

/** Mirrors the NestJS order pricing; the server recomputes it, this is for display. */
export function cartItemUnitPrice(item: Pick<CartItem, "product" | "lensType" | "lensCoating" | "lensIndex">): number {
  const lensSurcharge =
    (item.lensType?.priceModifier ?? 0) + (item.lensCoating?.priceModifier ?? 0) + (item.lensIndex?.priceModifier ?? 0);
  return item.product.price + lensSurcharge;
}

function lineItemPrice(item: CartItem): number {
  return cartItemUnitPrice(item) * item.quantity;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineItemPrice(item), 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (input) =>
        set((state) => {
          // Lines differing in any lens choice or prescription must not merge into one.
          const id = [
            input.product.id,
            input.selectedColor,
            input.lensType?.id ?? "none",
            input.lensCoating?.id ?? "none",
            input.lensIndex?.id ?? "none",
            prescriptionKey(input.prescription),
          ].join("~");
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity + (input.quantity ?? 1) } : i,
              ),
            };
          }
          const newItem: CartItem = {
            id,
            product: input.product,
            quantity: input.quantity ?? 1,
            selectedColor: input.selectedColor,
            lensType: input.lensType,
            lensCoating: input.lensCoating,
            lensIndex: input.lensIndex,
            prescription: input.prescription,
          };
          return { items: [...state.items, newItem] };
        }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "ars-optik-cart" },
  ),
);
