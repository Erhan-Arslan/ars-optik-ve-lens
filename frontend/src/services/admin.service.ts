import { api } from "@/lib/api";
import type { AdminOrder, OrderStatus, Product } from "@/types";

export interface ProductInput {
  slug: string;
  name: string;
  brand: string;
  category: Product["category"];
  gender: Product["gender"];
  shape?: Product["shape"];
  price: number;
  compareAtPrice?: number;
  description: string;
  material?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  requiresPrescription?: boolean;
  colors: { name: string; hex: string }[];
}

export async function fetchAdminProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/admin/products");
  return data;
}

export async function createAdminProduct(input: ProductInput): Promise<Product> {
  const { data } = await api.post<Product>("/admin/products", input);
  return data;
}

export async function updateAdminProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const { data } = await api.patch<Product>(`/admin/products/${id}`, input);
  return data;
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await api.delete(`/admin/products/${id}`);
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { data } = await api.get<AdminOrder[]>("/admin/orders");
  return data;
}

export async function updateAdminOrderStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
  const { data } = await api.patch<AdminOrder>(`/admin/orders/${id}/status`, { status });
  return data;
}
