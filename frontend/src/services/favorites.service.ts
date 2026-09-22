import { api } from "@/lib/api";
import type { Product } from "@/types";

export async function fetchFavorites(): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/favorites");
  return data;
}

export async function addFavorite(productId: string): Promise<void> {
  await api.post(`/favorites/${productId}`);
}

export async function removeFavorite(productId: string): Promise<void> {
  await api.delete(`/favorites/${productId}`);
}
