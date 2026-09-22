import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, LensCoating, LensType, PrescriptionInfo, Product } from "@/types";

interface AddToCartInput {
  product: Product;
  selectedColor: string;
  quantity?: number;
  lensType?: LensType;
  lensCoating?: LensCoating;
  prescription?: PrescriptionInfo;
}

interface CartState {
  items: CartItem[];
  addItem: (input: AddToCartInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

function lineItemPrice(item: CartItem): number {
  const lensSurcharge = (item.lensType?.priceModifier ?? 0) + (item.lensCoating?.priceModifier ?? 0);
  return (item.product.price + lensSurcharge) * item.quantity;
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
          const id = `${input.product.id}-${input.selectedColor}-${input.lensType?.id ?? "none"}-${input.lensCoating?.id ?? "none"}`;
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
