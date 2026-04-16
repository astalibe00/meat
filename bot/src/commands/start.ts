import type { Bot, Context } from "grammy";
import { isAdmin } from "../lib/admin";
import { env } from "../lib/env";
import {
  buildContactKeyboard,
  buildMainMenuKeyboard,
  buildProfileKeyboard,
  formatProfileSummary,
} from "../lib/messages";
import {
  getUserByTelegramId,
  isRegistered,
  updateBotUserProfile,
  upsertTelegramUser,
} from "../services/users";

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
  const text = `Salom, ${firstName}. Do'kon va buyurtmalar shu yerdan boshqariladi.`;

  if (!env.miniAppUrl) {
    await ctx.reply(text);
    return;
  }

  await ctx.reply(text, {
    reply_markup: buildMainMenuKeyboard(env.miniAppUrl, isAdmin(ctx.from?.id)),
  });
}

async function promptForContact(ctx: Context) {
  await ctx.reply("Davom etish uchun telefon raqamingizni yuboring.", {
    reply_markup: buildContactKeyboard(),
  });
}

async function promptForAddress(ctx: Context) {
  await ctx.reply(
    "Yetkazib berish uchun asosiy manzilingizni yuboring. Masalan: Toshkent shahar, Chilonzor, 12-mavze, 15-uy.",
  );
}

async function handleStart(ctx: Context) {
  const user = await syncTelegramUser(ctx);

  if (!user.phone) {
    await promptForContact(ctx);
    return;
  }

  if (!user.default_address) {
    await promptForAddress(ctx);
    return;
  }

  await sendMainMenu(ctx);
}

export function registerStartCommand(bot: Bot) {
  bot.command("start", handleStart);

  bot.command("profile", async (ctx) => {
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

  bot.command("address", async (ctx) => {
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

  bot.on("message:contact", async (ctx) => {
    if (!ctx.from) {
      return;
    }

    await syncTelegramUser(ctx);

    const contact = ctx.message.contact;
    if (contact.user_id !== ctx.from.id) {
      await ctx.reply("Iltimos, o'zingizning telefon raqamingizni yuboring.");
      return;
    }

    const user = await updateBotUserProfile(ctx.from.id, {
      phone: contact.phone_number.startsWith("+")
        ? contact.phone_number
        : `+${contact.phone_number}`,
    });

    if (!user.default_address) {
      await ctx.reply("Telefon saqlandi.");
      await promptForAddress(ctx);
      return;
    }

    await ctx.reply(["Telefon yangilandi.", "", formatProfileSummary(user)].join("\n"));
    await sendMainMenu(ctx);
  });

  bot.on("message:text", async (ctx) => {
    if (!ctx.from) {
      return;
    }

    const text = ctx.message.text.trim();
    if (!text || text.startsWith("/")) {
      return;
    }

    const user = await getUserByTelegramId(ctx.from.id).catch(() => syncTelegramUser(ctx));
    if (user.phone && !user.default_address && text.length >= 5) {
      await updateBotUserProfile(ctx.from.id, {
        default_address: text,
      });
      await ctx.reply("Ro'yxatdan o'tish tugadi.");
      await sendMainMenu(ctx);
      return;
    }

    if (!isRegistered(user)) {
      if (!user.phone) {
        await promptForContact(ctx);
        return;
      }

      if (!user.default_address) {
        await promptForAddress(ctx);
      }
    }
  });

  bot.on("callback_query:data", async (ctx, next) => {
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
}
