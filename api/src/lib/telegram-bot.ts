import { env } from "./env";
import type { OrderStatus } from "../services/orders";

interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: {
    url: string;
  };
}

interface TelegramOrderPayload {
  id: string;
  items: Array<{
    name: string;
    price: number | string;
    quantity: number;
  }>;
  location: string;
  phone: string;
  total_price: number | string;
  users?: {
    first_name?: string | null;
    last_name?: string | null;
    telegram_id?: number | null;
    username?: string | null;
  } | null;
}

interface TelegramProductPayload {
  description?: string | null;
  id: string;
  image_url?: string | null;
  name: string;
  price: number | string;
}

function formatPrice(value: number | string) {
  return `${Number(value).toLocaleString("ru-RU")} so'm`;
}

function shortId(id: string) {
  return id.slice(0, 6).toUpperCase();
}

function customerName(order: TelegramOrderPayload) {
  const firstName = order.users?.first_name ?? "";
  const lastName = order.users?.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || order.users?.username || "Noma'lum mijoz";
}

function buildMiniAppUrl(startParam?: string) {
  if (!env.miniAppUrl) {
    return "";
  }

  const url = new URL(env.miniAppUrl);

  if (startParam) {
    url.searchParams.set("startapp", startParam);
  }

  return url.toString();
}

async function telegramRequest(method: string, body: Record<string, unknown>) {
  if (!env.botToken) {
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${env.botToken}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as {
    description?: string;
    ok: boolean;
  };

  if (!response.ok || !payload.ok) {
    throw new Error(payload.description ?? `Telegram request failed: ${method}`);
  }
}

export function buildStatusMessage(status: OrderStatus, orderId: string) {
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

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] },
) {
  await telegramRequest("sendMessage", {
    chat_id: chatId,
    reply_markup: replyMarkup,
    text,
  });
}

export async function sendTelegramPhoto(
  chatId: number | string,
  photo: string,
  caption: string,
  replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] },
) {
  await telegramRequest("sendPhoto", {
    caption,
    chat_id: chatId,
    photo,
    reply_markup: replyMarkup,
  });
}

export async function notifyAdminsAboutNewOrder(order: TelegramOrderPayload) {
  if (!env.adminIds.length) {
    return;
  }

  const items = order.items
    .map((item) => `- ${item.name} x${item.quantity} - ${formatPrice(Number(item.price) * item.quantity)}`)
    .join("\n");

  const text = [
    "Yangi buyurtma",
    "",
    `Mijoz: ${customerName(order)}`,
    `Mahsulotlar:\n${items}`,
    `Jami: ${formatPrice(order.total_price)}`,
    `Manzil: ${order.location}`,
    `Tel: ${order.phone}`,
    "",
    `Buyurtma ID: #${shortId(order.id)}`,
  ].join("\n");

  const keyboard = {
    inline_keyboard: [
      [
        { text: "Qabul qilish", callback_data: `status:${order.id}:accepted` },
        { text: "Bekor qilish", callback_data: `status:${order.id}:cancelled` },
      ],
    ],
  };

  for (const adminId of env.adminIds) {
    await sendTelegramMessage(adminId, text, keyboard);
  }
}

export async function notifyCustomerAboutStatus(order: TelegramOrderPayload, status: OrderStatus) {
  const telegramId = order.users?.telegram_id;
  if (!telegramId) {
    return;
  }

  await sendTelegramMessage(telegramId, buildStatusMessage(status, order.id));
}

export async function publishProductToChannel(product: TelegramProductPayload) {
  if (!env.channelId) {
    return;
  }

  const buttonUrl = buildMiniAppUrl(`product_${product.id}`);
  const preview = (product.description ?? "").slice(0, 100).trim();
  const text = [product.name, formatPrice(product.price), preview]
    .filter(Boolean)
    .join("\n\n");

  const replyMarkup = buttonUrl
    ? {
        inline_keyboard: [[{ text: "Buyurtma berish", url: buttonUrl }]],
      }
    : undefined;

  if (product.image_url) {
    await sendTelegramPhoto(env.channelId, product.image_url, text, replyMarkup);
    return;
  }

  await sendTelegramMessage(env.channelId, text, replyMarkup);
}
