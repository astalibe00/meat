import {
  getAdminChatIds,
  getChannelId,
  getTelegramToken,
  mainInlineKeyboard,
  sendMessage,
} from "./_lib/telegram.js";

interface ApiRequest {
  method?: string;
  body?: OrderPayload;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

interface OrderPayload {
  order?: {
    id: string;
    createdAt: string;
    total: number;
    subtotal: number;
    delivery: number;
    promoCode?: string;
    items: Array<{
      quantity: number;
      weightOption?: string;
      product: {
        name: string;
        price: number;
        weight: string;
      };
    }>;
    customer: {
      name: string;
      phone: string;
      address: string;
      notes?: string;
      deliveryWindow: string;
    };
  };
  telegramUser?: {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  source?: string;
}

function getRecipients() {
  return [...new Set([...getAdminChatIds(), getChannelId()].filter(Boolean))];
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("uz-UZ").format(Math.round(value))} UZS`;
}

function formatOrderMessage(payload: OrderPayload) {
  const order = payload.order!;

  return [
    "Yangi buyurtma",
    "",
    `Order ID: ${order.id}`,
    `Source: ${payload.source ?? "mini-app"}`,
    `Mijoz: ${order.customer.name}`,
    `Telefon: ${order.customer.phone}`,
    `Manzil: ${order.customer.address}`,
    `Slot: ${order.customer.deliveryWindow}`,
    order.customer.notes ? `Izoh: ${order.customer.notes}` : "",
    payload.telegramUser?.username ? `Telegram: @${payload.telegramUser.username}` : "",
    "",
    "Mahsulotlar:",
    ...order.items.map(
      (item) =>
        `- ${item.quantity} x ${item.product.name} (${item.weightOption ?? item.product.weight}) - ${formatMoney(item.product.price * item.quantity)}`,
    ),
    "",
    `Subtotal: ${formatMoney(order.subtotal)}`,
    `Yetkazib berish: ${formatMoney(order.delivery)}`,
    `Jami: ${formatMoney(order.total)}`,
    order.promoCode ? `Promo: ${order.promoCode}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!getTelegramToken()) {
    res.status(500).json({ ok: false, error: "Telegram bot token is missing" });
    return;
  }

  const payload = req.body ?? {};
  if (!payload.order?.id) {
    res.status(400).json({ ok: false, error: "Order payload is missing" });
    return;
  }

  const recipients = getRecipients();
  if (recipients.length === 0) {
    res.status(500).json({ ok: false, error: "ADMIN_TELEGRAM_IDS or CHANNEL_ID is missing" });
    return;
  }

  const message = formatOrderMessage(payload);

  try {
    await Promise.all(recipients.map((chatId) => sendMessage(chatId, message)));

    if (payload.telegramUser?.id) {
      await sendMessage(
        payload.telegramUser.id,
        `Buyurtmangiz qabul qilindi: ${payload.order.id}\nYetkazib berish sloti: ${payload.order.customer.deliveryWindow}\nJami: ${formatMoney(payload.order.total)}`,
        { reply_markup: mainInlineKeyboard() },
      );
    }

    res.status(200).json({ ok: true, notified: recipients.length });
  } catch (error) {
    console.error("[orders] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Order notification failed",
    });
  }
}
