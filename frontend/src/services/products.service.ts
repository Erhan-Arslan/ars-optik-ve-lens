import { api } from "@/lib/api";
import type { LensCoating, LensType, Product } from "@/types";

export interface ProductQuery {
  category?: "cerceve" | "gunes-gozlugu" | "lens";
  gender?: "kadin" | "erkek" | "unisex";
  maxPrice?: number;
  sort?: "onerilen" | "artan-fiyat" | "azalan-fiyat" | "yeni";
  search?: string;
}

export async function fetchProducts(query: ProductQuery = {}): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/products", { params: query });
  return data;
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const { data } = await api.get<Product>(`/products/${slug}`);
  return data;
}

export async function fetchLensOptions(): Promise<{ lensTypes: LensType[]; lensCoatings: LensCoating[] }> {
  const { data } = await api.get("/products/meta/lens-options");
  return data;
}
