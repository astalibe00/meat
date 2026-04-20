type TelegramPayload = Record<string, unknown>;

function getEnvValue(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

export function getTelegramToken() {
  return getEnvValue(["TELEGRAM_BOT_TOKEN", "BOT_TOKEN"]);
}

export function getWebhookSecret() {
  return getEnvValue(["TELEGRAM_WEBHOOK_SECRET", "WEBHOOK_SECRET"]);
}

export function getAdminChatIds() {
  return getEnvValue(["ADMIN_TELEGRAM_IDS"])
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getChannelId() {
  return getEnvValue(["CHANNEL_ID"]);
}

export function getWebAppUrl(fallbackUrl = "") {
  const explicitUrl = getEnvValue([
    "TELEGRAM_WEBAPP_URL",
    "MINI_APP_URL",
    "NEXT_PUBLIC_SITE_URL",
  ]);

  if (explicitUrl) {
    return explicitUrl;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`;
  }

  if (fallbackUrl) {
    return fallbackUrl;
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }

  return "";
}

export async function telegramApi(method: string, payload: TelegramPayload) {
  const token = getTelegramToken();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN/BOT_TOKEN is missing.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram API ${method} failed: ${JSON.stringify(data)}`);
  }

  return data;
}

export function mainReplyKeyboard() {
  const webAppUrl = getWebAppUrl();
  const firstRow = webAppUrl
    ? [{ text: "Mini App", web_app: { url: webAppUrl } }]
    : [{ text: "Mini App" }];

  return {
    keyboard: [
      firstRow,
      [{ text: "Telefonni ulashish", request_contact: true }],
      [{ text: "Katalog" }, { text: "Aksiyalar" }],
      [{ text: "Buyurtmalarim" }, { text: "Yordam" }],
      [{ text: "Yetkazib berish" }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function mainInlineKeyboard() {
  const webAppUrl = getWebAppUrl();
  const openShopButton = webAppUrl
    ? [{ text: "Mini Appni ochish", web_app: { url: webAppUrl } }]
    : [{ text: "Katalog", callback_data: "menu:shop" }];

  return {
    inline_keyboard: [
      openShopButton,
      [
        { text: "Aksiyalar", callback_data: "menu:deals" },
        { text: "Yetkazib berish", callback_data: "menu:delivery" },
      ],
      [
        { text: "Buyurtmalarim", callback_data: "menu:orders" },
        { text: "Yordam", callback_data: "menu:support" },
      ],
    ],
  };
}

export function categoryInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Mol go'shti", callback_data: "category:beef" },
        { text: "Qo'y go'shti", callback_data: "category:lamb" },
      ],
      [
        { text: "Tovuq", callback_data: "category:chicken" },
        { text: "Echki go'shti", callback_data: "category:goat" },
      ],
      [{ text: "Asosiy menyu", callback_data: "menu:start" }],
    ],
  };
}

export async function sendMessage(
  chatId: number | string,
  text: string,
  extra: TelegramPayload = {},
) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    ...extra,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export async function editMessageReplyMarkup(
  chatId: number | string,
  messageId: number,
  replyMarkup: TelegramPayload,
) {
  return telegramApi("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: replyMarkup,
  });
}

export function orderActionKeyboard(orderId: string) {
  return {
    inline_keyboard: [
      [
        { text: "Tasdiqlash", callback_data: `order:${orderId}:confirmed` },
        { text: "Tayyorlash", callback_data: `order:${orderId}:preparing` },
      ],
      [
        { text: "Tayyor", callback_data: `order:${orderId}:ready` },
        { text: "Yetkazilmoqda", callback_data: `order:${orderId}:delivering` },
      ],
      [
        { text: "Yakunlandi", callback_data: `order:${orderId}:completed` },
        { text: "Bekor qilish", callback_data: `order:${orderId}:cancelled` },
      ],
    ],
  };
}

export function getBaseUrl(req: { headers?: Record<string, string | string[] | undefined> }) {
  const configuredWebhookUrl = getEnvValue(["WEBHOOK_URL"]);
  if (configuredWebhookUrl) {
    try {
      const parsed = new URL(configuredWebhookUrl);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return configuredWebhookUrl
        .replace(/\/api\/telegram-webhook(?:\?.*)?$/, "")
        .replace(/\/$/, "");
    }
  }

  const headers = req.headers ?? {};
  const protoHeader = headers["x-forwarded-proto"];
  const hostHeader = headers["x-forwarded-host"] ?? headers.host;
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader ?? "https";
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;

  return host ? `${protocol}://${host}` : getWebAppUrl();
}
