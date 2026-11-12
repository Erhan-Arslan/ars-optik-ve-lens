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

/** Lens material by refractive index; higher index means a thinner lens. */
export interface LensIndex {
  id: string;
  code: string;
  name: string;
  description: string;
  refractiveIndex: number;
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
  lensIndex?: LensIndex;
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
  lensIndexId?: string | null;
  prescriptionOdSphere?: string | null;
  prescriptionOsSphere?: string | null;
  prescriptionOdCylinder?: number | null;
  prescriptionOsCylinder?: number | null;
  prescriptionOdAxis?: number | null;
  prescriptionOsAxis?: number | null;
  prescriptionPupillaryDistance?: number | null;
  prescriptionNotes?: string | null;
}

export interface AdminOrderItem extends OrderItemResponse {
  lensType: { name: string } | null;
  lensCoating: { name: string } | null;
  lensIndex: { name: string; code: string } | null;
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

export interface AdminOrder extends Omit<Order, "items"> {
  items: AdminOrderItem[];
  user: { id: string; email: string; firstName: string; lastName: string };
}

/* ---- .NET prescription analysis (POST /prescriptions/analyze) ---- */

export interface EyePrescriptionInput {
  sphere: number;
  cylinder?: number;
  axis?: number;
}

export interface PrescriptionAnalysisInput {
  rightEye: EyePrescriptionInput;
  leftEye: EyePrescriptionInput;
  pupillaryDistance?: number;
}

export interface EyeAnalysis {
  sphere: number;
  cylinder: number;
  axis: number | null;
  sphericalEquivalent: number;
  strongestMeridianPower: number;
  wasTransposed: boolean;
}

export interface LensIndexEstimate {
  code: string;
  name: string;
  refractiveIndex: number;
  rightEyeThicknessMm: number;
  leftEyeThicknessMm: number;
  maxThicknessMm: number;
  isRecommended: boolean;
}

export interface PrescriptionAdvisory {
  level: "info" | "warning";
  code: string;
  message: string;
}

export interface PrescriptionAnalysis {
  rightEye: EyeAnalysis;
  leftEye: EyeAnalysis;
  pupillaryDistance: number;
  pupillaryDistanceAssumed: boolean;
  lensIndexes: LensIndexEstimate[];
  recommendedLensIndexCode: string;
  recommendationReason: string;
  advisories: PrescriptionAdvisory[];
}
