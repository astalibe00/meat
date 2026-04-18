type TelegramPayload = Record<string, unknown>;

export function getTelegramToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
}

export function getWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
}

export function getWebAppUrl(fallbackUrl = "") {
  if (process.env.TELEGRAM_WEBAPP_URL?.trim()) {
    return process.env.TELEGRAM_WEBAPP_URL.trim();
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim();
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
    throw new Error("TELEGRAM_BOT_TOKEN is missing.");
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
  return {
    keyboard: [
      [{ text: "Shop" }, { text: "Deals" }],
      [{ text: "Delivery" }, { text: "Support" }],
      [{ text: "Open Web App" }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function mainInlineKeyboard() {
  const webAppUrl = getWebAppUrl();
  const openShopButton = webAppUrl
    ? [{ text: "Open Web App", web_app: { url: webAppUrl } }]
    : [{ text: "Browse categories", callback_data: "menu:shop" }];

  return {
    inline_keyboard: [
      openShopButton,
      [
        { text: "Deals", callback_data: "menu:deals" },
        { text: "Delivery", callback_data: "menu:delivery" },
      ],
      [{ text: "Support", callback_data: "menu:support" }],
    ],
  };
}

export function categoryInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Beef", callback_data: "category:beef" },
        { text: "Lamb", callback_data: "category:lamb" },
      ],
      [
        { text: "Chicken", callback_data: "category:chicken" },
        { text: "Goat", callback_data: "category:goat" },
      ],
      [{ text: "Back to main menu", callback_data: "menu:start" }],
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

export function getBaseUrl(req: { headers?: Record<string, string | string[] | undefined> }) {
  const headers = req.headers ?? {};
  const protoHeader = headers["x-forwarded-proto"];
  const hostHeader = headers["x-forwarded-host"] ?? headers.host;
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader ?? "https";
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;

  return host ? `${protocol}://${host}` : getWebAppUrl();
}
