import {
  getAdminChatIds,
  getChannelId,
  getTelegramToken,
  mainInlineKeyboard,
  sendMessage,
} from "./_lib/telegram.js";

interface ApiRequest {
  method?: string;
  body?: SupportPayload;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

interface SupportPayload {
  topic?: string;
  message?: string;
  latestOrderId?: string;
  source?: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  telegramUser?: {
    id?: number;
    username?: string;
  };
}

function getRecipients() {
  return [...new Set([...getAdminChatIds(), getChannelId()].filter(Boolean))];
}

function buildSupportMessage(payload: SupportPayload) {
  return [
    "Yangi support so'rovi",
    "",
    `Mavzu: ${payload.topic ?? "Other"}`,
    `Source: ${payload.source ?? "mini-app"}`,
    payload.latestOrderId ? `Order ID: ${payload.latestOrderId}` : "",
    payload.customer?.name ? `Mijoz: ${payload.customer.name}` : "",
    payload.customer?.phone ? `Telefon: ${payload.customer.phone}` : "",
    payload.customer?.address ? `Manzil: ${payload.customer.address}` : "",
    payload.telegramUser?.username ? `Telegram: @${payload.telegramUser.username}` : "",
    "",
    payload.message ?? "",
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
  if (!payload.message?.trim()) {
    res.status(400).json({ ok: false, error: "Support message is required" });
    return;
  }

  const recipients = getRecipients();
  if (recipients.length === 0) {
    res.status(500).json({ ok: false, error: "ADMIN_TELEGRAM_IDS or CHANNEL_ID is missing" });
    return;
  }

  try {
    const message = buildSupportMessage(payload);
    await Promise.all(recipients.map((chatId) => sendMessage(chatId, message)));

    if (payload.telegramUser?.id) {
      await sendMessage(
        payload.telegramUser.id,
        "Support so'rovingiz yuborildi. Javob birinchi navbatda shu bot ichida qaytadi.",
        { reply_markup: mainInlineKeyboard() },
      );
    }

    res.status(200).json({ ok: true, notified: recipients.length });
  } catch (error) {
    console.error("[support-request] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Support request failed",
    });
  }
}
