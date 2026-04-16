import type { OrderStatus } from "./types";

export function formatPrice(price: number): string {
  return `${price.toLocaleString("ru-RU")} so'm`;
}

export function shortId(id: string): string {
  return `#${id.slice(0, 6).toUpperCase()}`;
}

export function formatDate(dateValue: string) {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
  }).format(date);
}

export function formatDateTime(dateValue: string) {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getOrderStatusMeta(status: OrderStatus) {
  const map: Record<OrderStatus, { label: string; tone: string }> = {
    accepted: { label: "Tasdiqlandi", tone: "bg-blue-100 text-blue-700" },
    cancelled: { label: "Bekor qilindi", tone: "bg-danger/10 text-danger" },
    completed: { label: "Yetkazildi", tone: "bg-success/10 text-success" },
    delivering: { label: "Yetkazilmoqda", tone: "bg-primary/10 text-primary" },
    pending: { label: "Qabul qilindi", tone: "bg-warning/10 text-warning" },
    preparing: { label: "Tayyorlanmoqda", tone: "bg-warning/10 text-warning" },
  };

  return map[status];
}

export const orderTimeline = [
  { key: "pending", label: "Qabul qilindi" },
  { key: "accepted", label: "Tasdiqlandi" },
  { key: "preparing", label: "Tayyorlanmoqda" },
  { key: "delivering", label: "Yo'lda" },
  { key: "completed", label: "Yetkazildi" },
] as const;

export function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    reader.readAsDataURL(file);
  });
}
