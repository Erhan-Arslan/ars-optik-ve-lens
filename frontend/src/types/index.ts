export type ProductCategory = "cerceve" | "gunes-gozlugu" | "lens";

export type FrameShape = "yuvarlak" | "kare" | "kelebek" | "pilot" | "oval" | "dikdortgen";

export type Gender = "kadin" | "erkek" | "unisex";

export interface LensType {
  id: string;
  name: string;
  description: string;
  priceModifier: number;
}

export interface LensCoating {
  id: string;
  name: string;
  description: string;
  priceModifier: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  shape?: FrameShape;
  gender: Gender;
  price: number;
  compareAtPrice?: number;
  colors: { name: string; hex: string }[];
  description: string;
  material?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  rating: number;
  reviewCount: number;
  requiresPrescription: boolean;
}

export interface PrescriptionInfo {
  odSphere: string;
  osSphere: string;
  odCylinder?: string;
  osCylinder?: string;
  odAxis?: string;
  osAxis?: string;
  pupillaryDistance?: string;
  fileUrl?: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor: string;
  lensType?: LensType;
  lensCoating?: LensCoating;
  prescription?: PrescriptionInfo;
}

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  zip: string;
  isDefault?: boolean;
}

export type OrderStatus = "hazirlaniyor" | "kargoda" | "teslim-edildi" | "iptal";

export interface OrderItemResponse {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  selectedColor: string;
  lensTypeId?: string;
  lensCoatingId?: string;
  prescriptionOdSphere?: string;
  prescriptionOsSphere?: string;
  prescriptionNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItemResponse[];
  subtotal: number;
  shipping: number;
  total: number;
  address: Address;
}

export interface AdminOrder extends Order {
  user: { id: string; email: string; firstName: string; lastName: string };
}
