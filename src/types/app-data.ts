import type { Product } from "@/data/products";

export type FulfillmentType = "delivery" | "pickup";

export type PaymentMethod =
  | "humo"
  | "uzcard"
  | "click"
  | "payme"
  | "paynet"
  | "cash";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "refund-pending"
  | "refunded"
  | "cancelled";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled";

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface PickupPoint {
  id: string;
  title: string;
  address: string;
  landmark: string;
  hours: string;
}

export interface CustomerProfile {
  telegramUserId: number;
  name: string;
  username?: string;
  phone?: string;
  address?: string;
  addressLabel?: string;
  coordinates?: GeoPoint;
  preferredFulfillment: FulfillmentType;
  pickupPointId?: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  productId: string;
  customerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ManagedProduct extends Product {
  stockKg: number;
  minOrderKg: number;
  enabled: boolean;
  rating: number;
  reviewCount: number;
}

export interface OrderLine {
  product: ManagedProduct;
  quantity: number;
  weightOption?: string;
}

export interface OrderCustomerSnapshot {
  telegramUserId?: number;
  name: string;
  username?: string;
  phone?: string;
  address?: string;
  addressLabel?: string;
  coordinates?: GeoPoint;
  pickupPointId?: string;
  fulfillmentType: FulfillmentType;
  notes?: string;
}

export interface OrderStatusEvent {
  id: string;
  status: OrderStatus;
  label: string;
  createdAt: string;
  source: "system" | "admin" | "customer" | "bot";
}

export interface CustomerOrder {
  id: string;
  createdAt: string;
  updatedAt: string;
  items: OrderLine[];
  subtotal: number;
  savings: number;
  promoDiscount: number;
  delivery: number;
  total: number;
  promoCode: string;
  customer: OrderCustomerSnapshot;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  cancellationReason?: string;
  reviewIds?: string[];
}

export interface BroadcastMessage {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface AppDataState {
  products: ManagedProduct[];
  pickupPoints: PickupPoint[];
  customers: CustomerProfile[];
  orders: CustomerOrder[];
  reviews: Review[];
  broadcasts: BroadcastMessage[];
}
