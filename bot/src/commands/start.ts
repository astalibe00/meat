import type { Bot, Context } from "grammy";
import { isAdmin } from "../lib/admin";
import { env } from "../lib/env";
import {
  buildAddressPromptText,
  buildContactPromptText,
  buildContactKeyboard,
  buildMainMenuText,
  buildMainMenuKeyboard,
  buildProfileKeyboard,
  formatProfileSummary,
} from "../lib/messages";
import {
  getUserByTelegramId,
  isRegistered,
  supportsDefaultAddress,
  updateBotUserProfile,
  upsertTelegramUser,
} from "../services/users";

async function withUserFeedback(ctx: Context, action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.error("Start command flow failed:", error);
    const message =
      error instanceof Error ? error.message : "Noma'lum xatolik";

    if (/invalid api key/i.test(message)) {
      await ctx.reply(
        "Bot sozlamasida xatolik bor: SUPABASE_SERVICE_ROLE_KEY noto'g'ri. Admin paneldagi haqiqiy service role kalitni .env ga qo'ying.",
      );
      return;
    }

    await ctx.reply(
      `Ro'yxatdan o'tish vaqtida xatolik yuz berdi: ${message}`,
    );
  }
}

async function syncTelegramUser(ctx: Context) {
  if (!ctx.from) {
    throw new Error("Telegram foydalanuvchisi topilmadi");
  }

  return upsertTelegramUser({
    first_name: ctx.from.first_name,
    last_name: ctx.from.last_name,
    telegram_id: ctx.from.id,
    username: ctx.from.username,
  });
}

async function sendMainMenu(ctx: Context) {
  const firstName = ctx.from?.first_name ?? "mijoz";
  const text = buildMainMenuText(firstName, isAdmin(ctx.from?.id));

  if (!env.miniAppUrl) {
    await ctx.reply(text);
    return;
  }

  await ctx.reply(text, {
    reply_markup: buildMainMenuKeyboard(env.miniAppUrl, isAdmin(ctx.from?.id)),
  });
}

async function promptForContact(ctx: Context) {
  await ctx.reply(buildContactPromptText(), {
    reply_markup: buildContactKeyboard(),
  });
}

async function promptForAddress(ctx: Context) {
  await ctx.reply(buildAddressPromptText());
}

async function handleStart(ctx: Context) {
  const user = await syncTelegramUser(ctx);

  if (!user.phone) {
    await promptForContact(ctx);
    return;
  }

  if (supportsDefaultAddress(user) && !user.default_address) {
    await promptForAddress(ctx);
    return;
  }

  await sendMainMenu(ctx);
}

export function registerStartCommand(bot: Bot) {
  bot.command("start", async (ctx) => {
    await withUserFeedback(ctx, async () => {
      await handleStart(ctx);
    });
  });

  bot.command("profile", async (ctx) => {
    await withUserFeedback(ctx, async () => {
      const user = await syncTelegramUser(ctx);

      await ctx.reply(
        [
          "Profil ma'lumotlari",
          "",
          formatProfileSummary(user),
          "",
          "Telefonni tugma orqali yangilang yoki manzil uchun /address yangi manzil yozing.",
        ].join("\n"),
        {
          reply_markup: buildProfileKeyboard(),
        },
      );
    });
  });

  bot.command("address", async (ctx) => {
    await withUserFeedback(ctx, async () => {
      if (!ctx.from) {
        return;
      }

      await syncTelegramUser(ctx);

      const address = ctx.match?.trim();
      if (!address || address.length < 5) {
        await ctx.reply("Format: /address Toshkent, Yunusobod, 10-uy");
        return;
      }

      const user = await updateBotUserProfile(ctx.from.id, {
        default_address: address,
      });

      await ctx.reply(
        ["Manzil yangilandi.", "", formatProfileSummary(user)].join("\n"),
        {
          reply_markup: buildProfileKeyboard(),
        },
      );
    });
  });

  bot.on("message:contact", async (ctx) => {
    await withUserFeedback(ctx, async () => {
      if (!ctx.from) {
        return;
      }

      await syncTelegramUser(ctx);

      const contact = ctx.message.contact;
      if (contact.user_id && contact.user_id !== ctx.from.id) {
        await ctx.reply("Iltimos, o'zingizning telefon raqamingizni yuboring.");
        return;
      }

      const user = await updateBotUserProfile(ctx.from.id, {
        phone: contact.phone_number.startsWith("+")
          ? contact.phone_number
          : `+${contact.phone_number}`,
      });

      if (supportsDefaultAddress(user) && !user.default_address) {
        await ctx.reply("Telefon saqlandi. Endi manzilni yozing.");
        await promptForAddress(ctx);
        return;
      }

      await ctx.reply(
        ["Telefon yangilandi.", "", formatProfileSummary(user)].join("\n"),
      );
      await sendMainMenu(ctx);
    });
  });

  bot.on("message:text", async (ctx) => {
    await withUserFeedback(ctx, async () => {
      if (!ctx.from) {
        return;
      }

      const text = ctx.message.text.trim();
      if (!text || text.startsWith("/")) {
        return;
      }

      const user = await getUserByTelegramId(ctx.from.id).catch(() => syncTelegramUser(ctx));
      if (
        supportsDefaultAddress(user) &&
        user.phone &&
        !user.default_address &&
        text.length >= 5
      ) {
        await updateBotUserProfile(ctx.from.id, {
          default_address: text,
        });
        await ctx.reply("Ro'yxatdan o'tish tugadi. Menyu tayyor.");
        await sendMainMenu(ctx);
        return;
      }

      if (!isRegistered(user)) {
        if (!user.phone) {
          await promptForContact(ctx);
          return;
        }

        if (supportsDefaultAddress(user) && !user.default_address) {
          await promptForAddress(ctx);
        }
      }
    });
  });

  bot.on("callback_query:data", async (ctx, next) => {
    await withUserFeedback(ctx, async () => {
      if (!ctx.from) {
        await ctx.answerCallbackQuery();
        return;
      }

      if (ctx.callbackQuery.data === "profile:phone") {
        await ctx.answerCallbackQuery();
        await promptForContact(ctx);
        return;
      }

      if (ctx.callbackQuery.data === "profile:address") {
        await ctx.answerCallbackQuery();
        await ctx.reply("Yangi manzilni /address yordamida yuboring. Masalan:\n/address Toshkent, Uchtepa, 23-uy");
        return;
      }

      await next();
    });
  });
}
