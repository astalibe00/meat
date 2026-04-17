import type { Bot, Context } from "grammy";
import { env } from "../lib/env";
import {
  buildBuyerOrderKeyboard,
  buildBuyerOrderSummary,
  buildBuyerOrdersKeyboard,
  buildCartKeyboard,
  buildCatalogKeyboard,
  buildHelpKeyboard,
  buildLanguageKeyboard,
  buildMainMenuKeyboard,
  buildMainMenuText,
  buildMiniAppKeyboard,
  buildSupportInstruction,
  buildSupportKeyboard,
  buildTrackingText,
  buildWholesaleKeyboard,
  formatCartSummary,
} from "../lib/messages";
import {
  getCartSummaryForTelegramUser,
  getCategoryHighlights,
  getOrderForTelegramUser,
  getProductHighlights,
  listActiveOrdersForTelegramUser,
  listOrdersForTelegramUser,
  reorderOrderForTelegramUser,
} from "../services/orders";
import { createSupportRequest } from "../services/support";

function parseSupportInput(match: string | undefined) {
  const input = match?.trim();
  if (!input) {
    return null;
  }

  const [category, ...rest] = input.split(" ");
  return {
    category,
    details: rest.join(" ").trim(),
  };
}

async function notifyAdminsAboutSupport(
  ctx: Context,
  ticket: Awaited<ReturnType<typeof createSupportRequest>>,
) {
  if (!env.adminIds.length) {
    return;
  }

  const text = [
    "Yangi support so'rovi",
    "",
    `Ticket: #${ticket.id}`,
    `Mijoz: ${ticket.user.first_name}${ticket.user.username ? ` (@${ticket.user.username})` : ""}`,
    `Telegram ID: ${ticket.user.telegram_id}`,
    `Telefon: ${ticket.user.phone ?? "yo'q"}`,
    `Kategoriya: ${ticket.category}`,
    ...(ticket.order_id ? [`Buyurtma: #${ticket.order_id.slice(0, 6).toUpperCase()}`] : []),
    "",
    ticket.details,
  ].join("\n");

  await Promise.allSettled(
    env.adminIds.map((adminId) => ctx.api.sendMessage(adminId, text)),
  );
}

async function sendBuyerOrders(ctx: Context) {
  if (!ctx.from) {
    return;
  }

  const orders = await listOrdersForTelegramUser(ctx.from.id, 6);

  if (!orders.length) {
    await ctx.reply(
      "Hozircha buyurtmalar yo'q. Mini App orqali birinchi buyurtmani boshlashingiz mumkin.",
      env.miniAppUrl
        ? { reply_markup: buildMiniAppKeyboard(env.miniAppUrl, "catalog", "Katalogni ochish") }
        : undefined,
    );
    return;
  }

  await ctx.reply("So'nggi buyurtmalaringizdan birini tanlang:", {
    reply_markup: buildBuyerOrdersKeyboard(orders, "track", env.miniAppUrl),
  });
}

async function sendOrderTracking(ctx: Context, orderId: string) {
  if (!ctx.from) {
    return;
  }

  const order = await getOrderForTelegramUser(ctx.from.id, orderId);
  const text = buildTrackingText(order);
  const replyMarkup = buildBuyerOrderKeyboard(order.id, env.miniAppUrl);

  if ("callbackQuery" in ctx.update) {
    await ctx.editMessageText(text, { reply_markup: replyMarkup });
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.reply(text, { reply_markup: replyMarkup });
}

async function sendReceipt(ctx: Context, orderId: string) {
  if (!ctx.from) {
    return;
  }

  const order = await getOrderForTelegramUser(ctx.from.id, orderId);
  const text = buildBuyerOrderSummary(order);

  if ("callbackQuery" in ctx.update) {
    await ctx.editMessageText(text, {
      reply_markup: buildBuyerOrderKeyboard(order.id, env.miniAppUrl),
    });
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.reply(text, {
    reply_markup: buildBuyerOrderKeyboard(order.id, env.miniAppUrl),
  });
}

async function handleReorder(ctx: Context, orderId?: string) {
  if (!ctx.from) {
    return;
  }

  if (orderId) {
    const order = await reorderOrderForTelegramUser(ctx.from.id, orderId);
    const message = `Buyurtma #${order.id.slice(0, 6).toUpperCase()} savatchaga qayta qo'shildi.`;

    if ("callbackQuery" in ctx.update) {
      await ctx.answerCallbackQuery("Savatchaga qo'shildi");
      await ctx.editMessageText(message, {
        reply_markup: env.miniAppUrl ? buildCartKeyboard(env.miniAppUrl) : undefined,
      });
      return;
    }

    await ctx.reply(message, {
      reply_markup: env.miniAppUrl ? buildCartKeyboard(env.miniAppUrl) : undefined,
    });
    return;
  }

  const orders = await listOrdersForTelegramUser(ctx.from.id, 6);
  const completedOrders = orders.filter((order) => order.status === "completed");

  if (!completedOrders.length) {
    await ctx.reply("Qayta buyurtma uchun yakunlangan buyurtma topilmadi.");
    return;
  }

  await ctx.reply("Qaysi buyurtmani savatchaga qayta qo'shaylik?", {
    reply_markup: buildBuyerOrdersKeyboard(completedOrders, "reorder", env.miniAppUrl),
  });
}

export function registerBuyerCommands(bot: Bot) {
  bot.command("shop", async (ctx) => {
    if (!env.miniAppUrl) {
      await ctx.reply("Mini App URL sozlanmagan.");
      return;
    }

    await ctx.reply(buildMainMenuText(ctx.from?.first_name ?? "mijoz"), {
      reply_markup: buildMainMenuKeyboard(env.miniAppUrl),
    });
  });

  bot.command("catalog", async (ctx) => {
    const [categories, products] = await Promise.all([
      getCategoryHighlights(5),
      getProductHighlights(3),
    ]);

    const text = [
      "Katalog preview",
      "",
      `Kategoriyalar: ${categories.map((item) => `${item.icon ?? ""}${item.name}`).join(", ") || "yo'q"}`,
      `Top mahsulotlar: ${products.map((item) => item.name).join(", ") || "yo'q"}`,
    ].join("\n");

    if (!env.miniAppUrl) {
      await ctx.reply(text);
      return;
    }

    await ctx.reply(text, {
      reply_markup: buildCatalogKeyboard(env.miniAppUrl),
    });
  });

  bot.command("cart", async (ctx) => {
    if (!ctx.from) {
      return;
    }

    const summary = await getCartSummaryForTelegramUser(ctx.from.id);
    await ctx.reply(
      formatCartSummary(summary),
      env.miniAppUrl ? { reply_markup: buildCartKeyboard(env.miniAppUrl) } : undefined,
    );
  });

  bot.command("orders", async (ctx) => {
    await sendBuyerOrders(ctx);
  });

  bot.command("track", async (ctx) => {
    const orderId = ctx.match?.trim();
    if (orderId) {
      await sendOrderTracking(ctx, orderId);
      return;
    }

    if (!ctx.from) {
      return;
    }

    const activeOrders = await listActiveOrdersForTelegramUser(ctx.from.id);
    const orders = activeOrders.length
      ? activeOrders
      : await listOrdersForTelegramUser(ctx.from.id, 6);

    if (!orders.length) {
      await ctx.reply("Kuzatish uchun buyurtma topilmadi.");
      return;
    }

    await ctx.reply("Kuzatish uchun buyurtmani tanlang:", {
      reply_markup: buildBuyerOrdersKeyboard(orders, "track", env.miniAppUrl),
    });
  });

  bot.command("reorder", async (ctx) => {
    const orderId = ctx.match?.trim();
    await handleReorder(ctx, orderId || undefined);
  });

  bot.command("favorites", async (ctx) => {
    if (!env.miniAppUrl) {
      await ctx.reply("Favorites sahifasi Mini App URL bilan ishlaydi.");
      return;
    }

    await ctx.reply("Sevimli mahsulotlarni Mini App ichida ko'rishingiz mumkin.", {
      reply_markup: buildMiniAppKeyboard(env.miniAppUrl, "favorites", "Favoritesni ochish"),
    });
  });

  bot.command("support", async (ctx) => {
    if (!ctx.from) {
      return;
    }

    const parsed = parseSupportInput(ctx.match);

    if (!parsed) {
      await ctx.reply(
        [
          "Support bo'limi",
          "",
          "Tez format:",
          "/support delivery Buyurtma kechikyapti",
          "/support order_issue Mahsulot qadoqi ochilgan",
          "/support wholesale Haftalik supply kerak",
        ].join("\n"),
        {
          reply_markup: buildSupportKeyboard(env.miniAppUrl),
        },
      );
      return;
    }

    if (!parsed.details) {
      await ctx.reply(buildSupportInstruction(parsed.category), {
        reply_markup: buildSupportKeyboard(env.miniAppUrl),
      });
      return;
    }

    const ticket = await createSupportRequest({
      category: parsed.category,
      details: parsed.details,
      telegramId: ctx.from.id,
    });
    await notifyAdminsAboutSupport(ctx, ticket);
    await ctx.reply(`Support so'rovi qabul qilindi. Ticket: #${ticket.id}`);
  });

  bot.command("language", async (ctx) => {
    await ctx.reply(
      "Bot hozircha Telegram tiliga mos ishlaydi. Qo'shimcha variant tanlash uchun quyidagi tugmalardan foydalaning:",
      {
        reply_markup: buildLanguageKeyboard(),
      },
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "Yordam bo'limi",
        "",
        "/shop - do'konni ochish",
        "/cart - savatcha",
        "/orders - buyurtmalar",
        "/track - aktiv buyurtmani kuzatish",
        "/reorder - oldingi buyurtmani qaytarish",
        "/support - support so'rovi",
        "/wholesale - biznes uchun taklif",
      ].join("\n"),
      {
        reply_markup: buildHelpKeyboard(env.miniAppUrl),
      },
    );
  });

  bot.command("wholesale", async (ctx) => {
    await ctx.reply(
      [
        "Wholesale bo'limi",
        "",
        "MOQ, invoice va doimiy supply oqimi uchun so'rov qoldirishingiz mumkin.",
        "Format: /support wholesale Haftalik supply kerak",
      ].join("\n"),
      {
        reply_markup: buildWholesaleKeyboard(env.miniAppUrl),
      },
    );
  });

  bot.on("callback_query:data", async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    if (!data.startsWith("buyer:")) {
      await next();
      return;
    }

    const parts = data.split(":");
    const [, action, value] = parts;

    if (action === "track" && value) {
      await sendOrderTracking(ctx, value);
      return;
    }

    if (action === "reorder" && value) {
      await handleReorder(ctx, value);
      return;
    }

    if (action === "receipt" && value) {
      await sendReceipt(ctx, value);
      return;
    }

    if (action === "support" && value) {
      await ctx.answerCallbackQuery();
      await ctx.reply(buildSupportInstruction(value), {
        reply_markup: buildSupportKeyboard(env.miniAppUrl),
      });
      return;
    }

    if (action === "language" && value) {
      await ctx.answerCallbackQuery("Til yangilandi");
      await ctx.editMessageText(
        `Tanlangan til: ${value.toUpperCase()}\n\nBot hozircha Telegram tiliga mos ishlaydi va bu tanlov session doirasida ishlatiladi.`,
      );
      return;
    }

    if (action === "menu" && value) {
      await ctx.answerCallbackQuery();

      if (value === "orders") {
        await sendBuyerOrders(ctx);
        return;
      }

      if (value === "wholesale") {
        await ctx.reply(
          "Wholesale bo'limi uchun Mini App yoki /support wholesale formatidan foydalaning.",
          {
            reply_markup: buildWholesaleKeyboard(env.miniAppUrl),
          },
        );
        return;
      }
    }

    await next();
  });
}
