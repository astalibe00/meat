import {
  BOT_CATEGORIES,
  buildCategoryMessage,
  buildDealsMessage,
  buildDeliveryMessage,
  buildSupportMessage,
  buildWelcomeMessage,
} from "./_lib/catalog.js";
import {
  answerCallbackQuery,
  categoryInlineKeyboard,
  getTelegramToken,
  getWebAppUrl,
  getWebhookSecret,
  mainInlineKeyboard,
  mainReplyKeyboard,
  sendMessage,
} from "./_lib/telegram.js";

interface ApiRequest {
  method?: string;
  body?: TelegramUpdate;
  query?: Record<string, string | undefined>;
  headers?: Record<string, string | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

interface TelegramMessage {
  text?: string;
  chat?: { id?: number | string };
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: TelegramMessage;
}

interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

function getChatId(update: TelegramUpdate) {
  return update?.message?.chat?.id ?? update?.callback_query?.message?.chat?.id;
}

function getText(update: TelegramUpdate) {
  return update?.message?.text?.trim() ?? "";
}

async function sendWelcome(chatId: number | string) {
  return sendMessage(chatId, buildWelcomeMessage(Boolean(getWebAppUrl())), {
    reply_markup: mainReplyKeyboard(),
  });
}

async function sendShop(chatId: number | string) {
  return sendMessage(
    chatId,
    "Choose a category to get a quick shortlist, or use Open Web App for the full store.",
    {
      reply_markup: categoryInlineKeyboard(),
    },
  );
}

async function routeText(chatId: number | string, text: string) {
  const normalized = text.toLowerCase();

  if (normalized === "/start" || normalized === "/menu") {
    await sendWelcome(chatId);
    return sendMessage(chatId, "Main actions", {
      reply_markup: mainInlineKeyboard(),
    });
  }

  if (normalized === "/shop" || normalized === "shop") {
    return sendShop(chatId);
  }

  if (normalized === "/deals" || normalized === "deals") {
    return sendMessage(chatId, buildDealsMessage(), {
      reply_markup: mainInlineKeyboard(),
    });
  }

  if (normalized === "/delivery" || normalized === "delivery") {
    return sendMessage(chatId, buildDeliveryMessage(), {
      reply_markup: mainInlineKeyboard(),
    });
  }

  if (normalized === "/support" || normalized === "support") {
    return sendMessage(chatId, buildSupportMessage(), {
      reply_markup: mainInlineKeyboard(),
    });
  }

  if (normalized === "open web app") {
    const webAppUrl = getWebAppUrl();
    if (!webAppUrl) {
      return sendMessage(
        chatId,
        "Open Web App will become available after TELEGRAM_WEBAPP_URL is configured on Vercel.",
        {
          reply_markup: mainInlineKeyboard(),
        },
      );
    }

    return sendMessage(chatId, "Open the web app to browse the full catalogue and checkout.", {
      reply_markup: mainInlineKeyboard(),
    });
  }

  const category = BOT_CATEGORIES.find((item) => item.title.toLowerCase() === normalized);
  if (category) {
    return sendMessage(chatId, buildCategoryMessage(category.id), {
      reply_markup: mainInlineKeyboard(),
    });
  }

  return sendMessage(
    chatId,
    "Use Shop, Deals, Delivery, Support, or Open Web App from the menu below.",
    {
      reply_markup: mainReplyKeyboard(),
    },
  );
}

async function routeCallback(update: TelegramUpdate) {
  const callbackQuery = update.callback_query;
  const chatId = callbackQuery?.message?.chat?.id;
  const data = callbackQuery?.data ?? "";

  if (!chatId) {
    return;
  }

  if (data === "menu:start") {
    await answerCallbackQuery(callbackQuery.id, "Main menu");
    await sendWelcome(chatId);
    await sendMessage(chatId, "Main actions", { reply_markup: mainInlineKeyboard() });
    return;
  }

  if (data === "menu:shop") {
    await answerCallbackQuery(callbackQuery.id, "Shop");
    await sendShop(chatId);
    return;
  }

  if (data === "menu:deals") {
    await answerCallbackQuery(callbackQuery.id, "Deals");
    await sendMessage(chatId, buildDealsMessage(), { reply_markup: mainInlineKeyboard() });
    return;
  }

  if (data === "menu:delivery") {
    await answerCallbackQuery(callbackQuery.id, "Delivery");
    await sendMessage(chatId, buildDeliveryMessage(), {
      reply_markup: mainInlineKeyboard(),
    });
    return;
  }

  if (data === "menu:support") {
    await answerCallbackQuery(callbackQuery.id, "Support");
    await sendMessage(chatId, buildSupportMessage(), {
      reply_markup: mainInlineKeyboard(),
    });
    return;
  }

  if (data.startsWith("category:")) {
    const categoryId = data.replace("category:", "");
    await answerCallbackQuery(callbackQuery.id, "Category loaded");
    await sendMessage(chatId, buildCategoryMessage(categoryId), {
      reply_markup: mainInlineKeyboard(),
    });
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      configured: Boolean(getTelegramToken()),
      webAppUrl: getWebAppUrl(),
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!getTelegramToken()) {
    res.status(500).json({ ok: false, error: "TELEGRAM_BOT_TOKEN is missing" });
    return;
  }

  const querySecret = req.query?.secret;
  const headerSecret = req.headers?.["x-telegram-bot-api-secret-token"];
  const expectedSecret = getWebhookSecret();

  if (
    expectedSecret &&
    querySecret !== expectedSecret &&
    headerSecret !== expectedSecret
  ) {
    res.status(401).json({ ok: false, error: "Invalid webhook secret" });
    return;
  }

  const update: TelegramUpdate = req.body ?? {};
  const chatId = getChatId(update);

  try {
    if (update?.callback_query) {
      await routeCallback(update);
      res.status(200).json({ ok: true });
      return;
    }

    if (chatId) {
      await routeText(chatId, getText(update));
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[telegram-webhook] failed", error);
    res.status(500).json({ ok: false, error: "Webhook handler failed" });
  }
}
