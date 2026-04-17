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
  payment_method?: string;
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

export function buildMiniAppUrl(url: string, startParam?: string) {
  const target = new URL(url);

  if (startParam) {
    target.searchParams.set("startapp", startParam);
  }

  return target.toString();
}

export function buildMiniAppKeyboard(url: string, startParam?: string, label = "Mini Appni ochish") {
  return new InlineKeyboard().webApp(label, buildMiniAppUrl(url, startParam));
}

export function buildMainMenuKeyboard(url: string, isAdmin = false) {
  const keyboard = new InlineKeyboard()
    .webApp("Do'kon", buildMiniAppUrl(url, "home"))
    .webApp("Katalog", buildMiniAppUrl(url, "catalog"))
    .row()
    .webApp("Savat", buildMiniAppUrl(url, "cart"))
    .webApp("Buyurtmalarim", buildMiniAppUrl(url, "orders"))
    .row()
    .webApp("Support", buildMiniAppUrl(url, "support"))
    .webApp("Wholesale", buildMiniAppUrl(url, "wholesale"))
    .row()
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

export function buildLanguageKeyboard() {
  return new InlineKeyboard()
    .text("O'zbekcha", "buyer:language:uz")
    .text("Русский", "buyer:language:ru")
    .row()
    .text("English", "buyer:language:en");
}

export function buildSupportKeyboard(url?: string) {
  const keyboard = new InlineKeyboard()
    .text("Buyurtma muammosi", "buyer:support:order_issue")
    .text("To'lov", "buyer:support:payment")
    .row()
    .text("Yetkazish", "buyer:support:delivery")
    .text("Wholesale", "buyer:support:wholesale");

  if (url) {
    keyboard.row().webApp("Mini App support", buildMiniAppUrl(url, "support"));
  }

  return keyboard;
}

export function buildWholesaleKeyboard(url?: string) {
  const keyboard = new InlineKeyboard()
    .text("So'rov yuborish", "buyer:support:wholesale")
    .text("Operator", "buyer:support:general");

  if (url) {
    keyboard.row().webApp("Wholesale sahifa", buildMiniAppUrl(url, "wholesale"));
  }

  return keyboard;
}

export function buildBuyerOrdersKeyboard(
  orders: Array<{ id: string; status?: string }>,
  action: "track" | "reorder",
  url?: string,
) {
  const keyboard = new InlineKeyboard();

  orders.slice(0, 6).forEach((order) => {
    keyboard.text(
      `#${shortId(order.id)}${order.status ? ` • ${order.status}` : ""}`,
      `buyer:${action}:${order.id}`,
    ).row();
  });

  if (url) {
    keyboard.webApp("Mini App'da ochish", buildMiniAppUrl(url, "orders"));
  }

  return keyboard;
}

export function buildBuyerOrderKeyboard(orderId: string, url?: string) {
  const keyboard = new InlineKeyboard()
    .text("Buyurtmani kuzatish", `buyer:track:${orderId}`)
    .text("Qayta buyurtma", `buyer:reorder:${orderId}`)
    .row()
    .text("Chekni ko'rish", `buyer:receipt:${orderId}`)
    .text("Operator bilan bog'lanish", `buyer:support:order_issue:${orderId}`);

  if (url) {
    keyboard.row().webApp("Mini App'da ochish", buildMiniAppUrl(url, `order_${orderId}`));
  }

  return keyboard;
}

export function buildCatalogKeyboard(url: string) {
  return new InlineKeyboard()
    .webApp("Katalogni ochish", buildMiniAppUrl(url, "catalog"))
    .row()
    .webApp("Savat", buildMiniAppUrl(url, "cart"))
    .webApp("Wholesale", buildMiniAppUrl(url, "wholesale"));
}

export function buildCartKeyboard(url: string) {
  return new InlineKeyboard()
    .webApp("Savatchani ochish", buildMiniAppUrl(url, "cart"))
    .row()
    .webApp("Checkout", buildMiniAppUrl(url, "cart"))
    .webApp("Buyurtmalarim", buildMiniAppUrl(url, "orders"));
}

export function buildHelpKeyboard(url?: string) {
  const keyboard = new InlineKeyboard()
    .text("Support", "buyer:support:general")
    .text("Buyurtmalar", "buyer:menu:orders")
    .row()
    .text("Wholesale", "buyer:menu:wholesale");

  if (url) {
    keyboard.row().webApp("Do'kon", buildMiniAppUrl(url, "home"));
  }

  return keyboard;
}

export function buildMainMenuText(firstName: string, isAdmin = false) {
  return [
    `Salom, ${firstName}.`,
    "",
    "Marketplace bot tayyor:",
    "• Do'kon va katalogni ochish",
    "• Savatchani davom ettirish",
    "• Buyurtma statusini Mini Appsiz kuzatish",
    "• Support va wholesale so'rov yuborish",
    ...(isAdmin ? ["• Admin panel va tezkor status boshqaruvi"] : []),
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
    accepted: `Buyurtmangiz tasdiqlandi.\n\n${orderLabel}\nSeller tayyorlashni boshladi.`,
    cancelled: `Buyurtmangiz bekor qilindi.\n\n${orderLabel}\nKerak bo'lsa support orqali murojaat qiling.`,
    completed: `Buyurtmangiz yetkazildi.\n\n${orderLabel}\nYana buyurtma berish uchun tugmadan foydalaning.`,
    delivering: `Buyurtmangiz yo'lda.\n\n${orderLabel}\nTaxminiy yetkazish: ~30 daqiqa.`,
    pending: `Buyurtmangiz qabul qilindi.\n\n${orderLabel}\nSeller tasdiqlashi kutilmoqda.`,
    preparing: `Buyurtmangiz tayyorlanmoqda.\n\n${orderLabel}\nQadoqlash bosqichi davom etmoqda.`,
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

export function buildBuyerOrderSummary(order: OrderForMessage) {
  return [
    `Buyurtma #${shortId(order.id)}`,
    `Holat: ${order.status}`,
    `Jami: ${formatPrice(order.total_price)}`,
    `To'lov: ${order.payment_method === "cash" ? "Naqd pul" : order.payment_method ?? "noma'lum"}`,
    `Manzil: ${order.location}`,
    `Mahsulotlar: ${order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}`,
  ].join("\n");
}

export function buildTrackingText(order: OrderForMessage) {
  const timeline = [
    { key: "pending", label: "Qabul qilindi" },
    { key: "accepted", label: "Tasdiqlandi" },
    { key: "preparing", label: "Tayyorlanmoqda" },
    { key: "delivering", label: "Yo'lda" },
    { key: "completed", label: "Yetkazildi" },
  ] as const;

  const currentIndex =
    order.status === "cancelled"
      ? -1
      : timeline.findIndex((step) => step.key === order.status);

  const lines = timeline.map((step, index) => {
    const marker = currentIndex >= index ? "●" : "○";
    return `${marker} ${step.label}`;
  });

  return [
    `Buyurtma #${shortId(order.id)}`,
    `Holat: ${order.status}`,
    `ETA: ${order.status === "delivering" ? "~30 daqiqa" : "yangilanmoqda"}`,
    `Manzil: ${order.location}`,
    `To'lov: ${order.payment_method === "cash" ? "Yetkazilganda" : order.payment_method ?? "noma'lum"}`,
    "",
    "Timeline:",
    ...lines,
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

export function formatCartSummary(input: {
  items: Array<{
    products?: {
      name?: string | null;
      price?: number | string | null;
    } | null;
    quantity: number;
  }>;
  total: number;
}) {
  if (!input.items.length) {
    return "Savatcha bo'sh.";
  }

  return [
    "Savatcha holati",
    "",
    ...input.items.map((item) => {
      const name = item.products?.name ?? "Mahsulot";
      const price = formatPrice((Number(item.products?.price ?? 0) * item.quantity));
      return `• ${name} x${item.quantity} — ${price}`;
    }),
    "",
    `Jami: ${formatPrice(input.total)}`,
  ].join("\n");
}

export function buildSupportInstruction(category: string) {
  return [
    `Kategoriya: ${category}`,
    "",
    "Support so'rovini quyidagi formatda yuboring:",
    `/support ${category} Muammo tafsiloti`,
  ].join("\n");
}
