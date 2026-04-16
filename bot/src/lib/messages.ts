import { InlineKeyboard, Keyboard } from "grammy";
import type { OrderStatus } from "../services/orders";

interface OrderForMessage {
  created_at: string;
  id: string;
  items: Array<{
    name: string;
    price: number | string;
    quantity: number;
  }>;
  location: string;
  phone: string;
  status: OrderStatus;
  total_price: number | string;
  users?: {
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
  } | null;
}

function formatPrice(value: number | string) {
  return `${Number(value).toLocaleString("ru-RU")} so'm`;
}

export function shortId(value: string) {
  return value.slice(0, 6).toUpperCase();
}

export function buildMiniAppKeyboard(url: string) {
  return new InlineKeyboard().webApp("Issiq menyuni ochish", url);
}

export function buildMiniAppUrl(url: string, startParam?: string) {
  const target = new URL(url);

  if (startParam) {
    target.searchParams.set("startapp", startParam);
  }

  return target.toString();
}

export function buildMainMenuKeyboard(url: string, isAdmin = false) {
  const keyboard = new InlineKeyboard()
    .webApp("Issiq menyu", buildMiniAppUrl(url))
    .webApp("Savatcha", buildMiniAppUrl(url, "cart"))
    .row()
    .webApp("Buyurtmalarim", buildMiniAppUrl(url, "orders"))
    .webApp("Profil", buildMiniAppUrl(url, "profile"));

  if (isAdmin) {
    keyboard.row().webApp("Admin panel", buildMiniAppUrl(url, "admin"));
  }

  return keyboard;
}

export function buildContactKeyboard() {
  return new Keyboard()
    .requestContact("Telefonni bir tegishda yuborish")
    .resized()
    .oneTime();
}

export function buildProfileKeyboard() {
  return new InlineKeyboard()
    .text("Telefonni yangilash", "profile:phone")
    .row()
    .text("Manzilni yangilash", "profile:address");
}

export function buildMainMenuText(firstName: string, isAdmin = false) {
  return [
    `Salom, ${firstName}.`,
    "",
    "Bugungi issiq menyu, savatcha va buyurtmalar bir oynada tayyor.",
    "",
    "Tez bo'limlar:",
    "Issiq menyu",
    "Savatcha",
    "Buyurtmalarim",
    "Profil",
    ...(isAdmin ? ["Admin panel"] : []),
  ].join("\n");
}

export function buildContactPromptText() {
  return [
    "Buyurtmani tez yakunlash uchun telefon raqamingizni yuboring.",
    "",
    "Tugmani bosishingiz kifoya.",
  ].join("\n");
}

export function buildAddressPromptText() {
  return [
    "Yetkazib berish uchun asosiy manzilingizni yozing.",
    "Masalan: Toshkent shahar, Chilonzor, 12-mavze, 15-uy.",
  ].join("\n");
}

export function buildStatusKeyboard(orderId: string, status: OrderStatus) {
  const keyboard = new InlineKeyboard();

  if (status === "pending") {
    keyboard.text("Qabul qilish", `status:${orderId}:accepted`);
    keyboard.text("Bekor qilish", `status:${orderId}:cancelled`);
    return keyboard;
  }

  if (status === "accepted") {
    keyboard.text("Tayyorlanmoqda", `status:${orderId}:preparing`);
    keyboard.row().text("Yetkazishga yuborish", `status:${orderId}:delivering`);
    keyboard.text("Bekor qilish", `status:${orderId}:cancelled`);
    return keyboard;
  }

  if (status === "preparing") {
    keyboard.text("Yetkazishga yuborish", `status:${orderId}:delivering`);
    keyboard.text("Bekor qilish", `status:${orderId}:cancelled`);
    return keyboard;
  }

  if (status === "delivering") {
    keyboard.text("Yetkazildi", `status:${orderId}:completed`);
    return keyboard;
  }

  return undefined;
}

export function formatStatusMessage(status: OrderStatus, orderId: string) {
  const orderLabel = `Buyurtma #${shortId(orderId)}`;

  const messageMap: Record<OrderStatus, string> = {
    accepted: `Buyurtmangiz tasdiqlandi.\n\n${orderLabel}`,
    cancelled: `Buyurtmangiz bekor qilindi.\n\n${orderLabel}`,
    completed: `Buyurtmangiz yetkazildi.\n\n${orderLabel}`,
    delivering: `Buyurtmangiz yetkazilmoqda.\n\n${orderLabel}`,
    pending: `Buyurtmangiz qabul qilindi.\n\n${orderLabel}`,
    preparing: `Buyurtmangiz tayyorlanmoqda.\n\n${orderLabel}`,
  };

  return messageMap[status];
}

export function formatAdminOrder(order: OrderForMessage) {
  const items = order.items
    .map((item) => `${item.name} x${item.quantity}`)
    .join(", ");
  const customerName = [
    order.users?.first_name ?? "",
    order.users?.last_name ?? "",
  ]
    .join(" ")
    .trim() || order.users?.username || "Noma'lum mijoz";

  return [
    `Buyurtma #${shortId(order.id)}`,
    `Mijoz: ${customerName}`,
    `Holat: ${order.status}`,
    `Jami: ${formatPrice(order.total_price)}`,
    `Mahsulotlar: ${items}`,
    `Manzil: ${order.location}`,
    `Tel: ${order.phone}`,
  ].join("\n");
}

export function formatProfileSummary(user: {
  default_address?: string | null;
  first_name: string;
  phone?: string | null;
}) {
  return [
    `Ism: ${user.first_name}`,
    `Telefon: ${user.phone ?? "kiritilmagan"}`,
    `Manzil: ${user.default_address ?? "kiritilmagan"}`,
  ].join("\n");
}
