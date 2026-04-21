import type { OrderStatus, PaymentMethod, PaymentStatus } from "../types/app-data.js";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlandi",
  preparing: "Tayyorlanmoqda",
  ready: "Tayyor bo'ldi",
  delivering: "Yetkazilmoqda",
  completed: "Yakunlandi",
  cancelled: "Bekor qilindi",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  humo: "HUMO",
  uzcard: "UZCARD",
  click: "CLICK",
  payme: "PAYME",
  paynet: "PAYNET",
  cash: "Qabul qilganda to'lash",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "To'lov kutilmoqda",
  paid: "To'lov qabul qilindi",
  "refund-pending": "Qaytarish kutilmoqda",
  refunded: "Qaytarildi",
  cancelled: "Bekor qilindi",
};

export function isOnlinePayment(method: PaymentMethod) {
  return method === "humo" || method === "uzcard" || method === "click" || method === "payme";
}

export function getInitialPaymentStatus(method: PaymentMethod): PaymentStatus {
  void method;
  return "pending";
}

export function getInitialOrderStatus(method: PaymentMethod): OrderStatus {
  void method;
  return "pending";
}

export function getStatusDescription(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "Admin tasdiqlashini kutmoqda.";
    case "confirmed":
      return "Buyurtma qabul qilindi va navbatga qo'shildi.";
    case "preparing":
      return "Mahsulotlar tayyorlanmoqda.";
    case "ready":
      return "Buyurtma tayyor, jo'natishga chiqadi.";
    case "delivering":
      return "Kuryer yoki tarqatish punkti orqali topshirilmoqda.";
    case "completed":
      return "Buyurtma muvaffaqiyatli yakunlandi.";
    case "cancelled":
      return "Buyurtma bekor qilingan.";
    default:
      return "";
  }
}
