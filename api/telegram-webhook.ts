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
  orderActionKeyboard,
  sendMessage,
} from "./_lib/telegram.js";
import { mutateAppData, replaceOrder, upsertCustomer } from "./_lib/app-data.js";
import { ORDER_STATUS_LABELS } from "../src/lib/order-status.js";
import type { CustomerOrder, OrderStatus } from "../src/types/app-data.js";

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
  contact?: { phone_number?: string };
  from?: { id?: number; username?: string; first_name?: string; last_name?: string };
  chat?: { id?: number | string };
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  from?: { id?: number; username?: string; first_name?: string; last_name?: string };
  message?: { chat?: { id?: number | string } };
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
  await sendMessage(chatId, buildWelcomeMessage(Boolean(getWebAppUrl())), {
    reply_markup: mainReplyKeyboard(),
  });

  return sendMessage(chatId, "Asosiy menyu", {
    reply_markup: mainInlineKeyboard(),
  });
}

async function sendShop(chatId: number | string) {
  return sendMessage(
    chatId,
    "Kategoriya tanlang yoki to'liq checkout uchun Mini App tugmasini bosing.",
    {
      reply_markup: categoryInlineKeyboard(),
    },
  );
}

async function routeText(chatId: number | string, text: string) {
  const normalized = text.toLowerCase();

  if (normalized === "/start" || normalized === "/menu") {
    return sendWelcome(chatId);
  }

  if (normalized === "telefonni ulashish") {
    return sendMessage(
      chatId,
      "Pastdagi tugma orqali telefon raqamingizni ulashing. Mini App checkout shu ma'lumotni avtomatik ishlatadi.",
      { reply_markup: mainReplyKeyboard() },
    );
  }

  if (normalized === "/shop" || normalized === "shop" || normalized === "katalog") {
    return sendShop(chatId);
  }

  if (normalized === "/deals" || normalized === "deals" || normalized === "aksiyalar") {
    return sendMessage(chatId, buildDealsMessage(), {
      reply_markup: mainInlineKeyboard(),
    });
  }

  if (normalized === "/delivery" || normalized === "delivery" || normalized === "yetkazib berish") {
    return sendMessage(chatId, buildDeliveryMessage(), {
      reply_markup: mainInlineKeyboard(),
    });
  }

  if (normalized === "/support" || normalized === "support" || normalized === "yordam") {
    return sendMessage(chatId, buildSupportMessage(), {
      reply_markup: mainInlineKeyboard(),
    });
  }

  if (normalized === "mini app" || normalized === "open web app") {
    const webAppUrl = getWebAppUrl();
    if (!webAppUrl) {
      return sendMessage(
        chatId,
        "Mini App URL hali sozlanmagan. Vercel env ichida TELEGRAM_WEBAPP_URL yoki MINI_APP_URL ni belgilang.",
        {
          reply_markup: mainInlineKeyboard(),
        },
      );
    }

    return sendMessage(chatId, "Mini App tugmasi orqali to'liq katalog va checkoutni oching.", {
      reply_markup: mainInlineKeyboard(),
    });
  }

  const category = BOT_CATEGORIES.find(
    (item) => item.title.toLowerCase() === normalized || item.id.toLowerCase() === normalized,
  );
  if (category) {
    return sendMessage(chatId, buildCategoryMessage(category.id), {
      reply_markup: mainInlineKeyboard(),
    });
  }

  return sendMessage(
    chatId,
    "Mini App, Katalog, Aksiyalar, Yetkazib berish, Yordam yoki Telefonni ulashish tugmalaridan foydalaning.",
    {
      reply_markup: mainReplyKeyboard(),
    },
  );
}

async function handleContact(update: TelegramUpdate) {
  const message = update.message;
  const chatId = message?.chat?.id;
  const telegramUserId = message?.from?.id;
  const phone = message?.contact?.phone_number?.trim();

  if (!chatId || !telegramUserId || !phone) {
    return;
  }

  await mutateAppData((state) => ({
    ...state,
    customers: upsertCustomer(state.customers, {
      telegramUserId,
      name:
        [message?.from?.first_name, message?.from?.last_name].filter(Boolean).join(" ").trim() ||
        "Telegram mijoz",
      username: message?.from?.username,
      phone,
      address: state.customers.find((item) => item.telegramUserId === telegramUserId)?.address,
      addressLabel:
        state.customers.find((item) => item.telegramUserId === telegramUserId)?.addressLabel,
      coordinates:
        state.customers.find((item) => item.telegramUserId === telegramUserId)?.coordinates,
      preferredFulfillment:
        state.customers.find((item) => item.telegramUserId === telegramUserId)
          ?.preferredFulfillment ?? "delivery",
      pickupPointId:
        state.customers.find((item) => item.telegramUserId === telegramUserId)?.pickupPointId,
    }),
  }));

  await sendMessage(
    chatId,
    "Telefon raqamingiz saqlandi. Endi Mini App checkout ism va telefonni avtomatik oladi.",
    { reply_markup: mainInlineKeyboard() },
  );
}

function nextOrderEvent(order: CustomerOrder, status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    pending: "Buyurtma admin tasdig'iga qaytdi.",
    confirmed: "Buyurtma admin tomonidan tasdiqlandi.",
    preparing: "Mahsulot tayyorlash boshlandi.",
    ready: order.customer.fulfillmentType === "pickup" ? "Buyurtma pickup uchun tayyor." : "Buyurtma jo'natishga tayyor.",
    delivering: order.customer.fulfillmentType === "pickup" ? "Buyurtma pickup punktida kutmoqda." : "Buyurtma yetkazib berilmoqda.",
    completed: "Buyurtma muvaffaqiyatli yakunlandi.",
    cancelled: "Buyurtma bekor qilindi.",
  };

  return {
    id: `status-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status,
    label: labels[status],
    createdAt: new Date().toISOString(),
    source: "bot" as const,
  };
}

async function handleOrderCallback(update: TelegramUpdate, orderId: string, status: OrderStatus) {
  const callbackQuery = update.callback_query!;
  const chatId = callbackQuery.message?.chat?.id;
  const actor = callbackQuery.from;

  const nextState = await mutateAppData((state) => {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("Buyurtma topilmadi.");
    }

    const updatedOrder: CustomerOrder = {
      ...order,
      status,
      paymentStatus:
        status === "completed"
          ? "paid"
          : status === "cancelled"
            ? order.paymentMethod === "cash" || order.paymentMethod === "paynet"
              ? "cancelled"
              : "refund-pending"
            : order.paymentStatus,
      updatedAt: new Date().toISOString(),
      statusHistory: [...order.statusHistory, nextOrderEvent(order, status)],
    };

    return {
      ...state,
      orders: replaceOrder(state.orders, updatedOrder),
    };
  });

  const order = nextState.orders.find((item) => item.id === orderId);
  if (!order) {
    throw new Error("Buyurtma topilmadi.");
  }

  await answerCallbackQuery(callbackQuery.id, ORDER_STATUS_LABELS[status]);

  if (chatId) {
    await sendMessage(
      chatId,
      `Admin yangiladi: ${order.id}\nHolat: ${ORDER_STATUS_LABELS[status]}\nOperator: ${actor?.username ? `@${actor.username}` : actor?.first_name ?? "admin"}`,
      {
        reply_markup: orderActionKeyboard(order.id),
      },
    );
  }

  if (order.customer.telegramUserId) {
    await sendMessage(
      order.customer.telegramUserId,
      `Buyurtma holati yangilandi: ${ORDER_STATUS_LABELS[status]}\nBuyurtma: ${order.id}`,
      { reply_markup: mainInlineKeyboard() },
    );
  }
}

async function routeCallback(update: TelegramUpdate) {
  const callbackQuery = update.callback_query;
  const chatId = callbackQuery?.message?.chat?.id;
  const data = callbackQuery?.data ?? "";

  if (!chatId) {
    return;
  }

  if (data.startsWith("order:")) {
    const [, orderId, status] = data.split(":");
    await handleOrderCallback(update, orderId, status as OrderStatus);
    return;
  }

  if (data === "menu:start") {
    await answerCallbackQuery(callbackQuery.id, "Asosiy menyu");
    await sendWelcome(chatId);
    return;
  }

  if (data === "menu:shop") {
    await answerCallbackQuery(callbackQuery.id, "Katalog");
    await sendShop(chatId);
    return;
  }

  if (data === "menu:deals") {
    await answerCallbackQuery(callbackQuery.id, "Aksiyalar");
    await sendMessage(chatId, buildDealsMessage(), { reply_markup: mainInlineKeyboard() });
    return;
  }

  if (data === "menu:delivery") {
    await answerCallbackQuery(callbackQuery.id, "Yetkazib berish");
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
    await answerCallbackQuery(callbackQuery.id, "Kategoriya yuklandi");
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
    res.status(500).json({ ok: false, error: "TELEGRAM_BOT_TOKEN/BOT_TOKEN is missing" });
    return;
  }

  const querySecret = req.query?.secret;
  const headerSecret = req.headers?.["x-telegram-bot-api-secret-token"];
  const expectedSecret = getWebhookSecret();

  if (expectedSecret && querySecret !== expectedSecret && headerSecret !== expectedSecret) {
    res.status(401).json({ ok: false, error: "Invalid webhook secret" });
    return;
  }

  const update: TelegramUpdate = req.body ?? {};
  const chatId = getChatId(update);

  try {
    if (update?.message?.contact?.phone_number) {
      await handleContact(update);
      res.status(200).json({ ok: true });
      return;
    }

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
