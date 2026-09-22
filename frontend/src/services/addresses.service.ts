import { api } from "@/lib/api";
import type { Address } from "@/types";

export type AddressInput = Omit<Address, "id">;

export async function fetchAddresses(): Promise<Address[]> {
  const { data } = await api.get<Address[]>("/addresses");
  return data;
}

export async function createAddress(input: AddressInput): Promise<Address> {
  const { data } = await api.post<Address>("/addresses", input);
  return data;
}

export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<Address> {
  const { data } = await api.patch<Address>(`/addresses/${id}`, input);
  return data;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`/addresses/${id}`);
}

export async function setDefaultAddress(id: string): Promise<Address> {
  const { data } = await api.patch<Address>(`/addresses/${id}/default`);
  return data;
}
