import { create } from "zustand";
import { addFavorite, fetchFavorites, removeFavorite } from "@/services/favorites.service";

interface FavoritesState {
  ids: Set<string>;
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  ids: new Set(),
  loaded: false,
  load: async () => {
    try {
      const products = await fetchFavorites();
      set({ ids: new Set(products.map((p) => p.id)), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  toggle: async (productId: string) => {
    const current = get().ids;
    const isFav = current.has(productId);
    const next = new Set(current);
    if (isFav) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    set({ ids: next });

    try {
      if (isFav) {
        await removeFavorite(productId);
      } else {
        await addFavorite(productId);
      }
    } catch {
      set({ ids: current });
    }
  },
  isFavorite: (productId: string) => get().ids.has(productId),
  reset: () => set({ ids: new Set(), loaded: false }),
}));
