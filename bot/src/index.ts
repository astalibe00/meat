import { Bot, webhookCallback } from "grammy";
import * as dotenv from "dotenv";
import express from "express";

dotenv.config();

const token = process.env.BOT_TOKEN || "";
if (!token) {
  console.warn("BOT_TOKEN is missing!");
}

export const bot = new Bot(token);

const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(id => parseInt(id.trim(), 10));

const isAdmin = (ctx: any) => {
  return ctx.from && ADMIN_IDS.includes(ctx.from.id);
};

bot.command("start", async (ctx) => {
  const firstName = ctx.from?.first_name || "Mijoz";
  await ctx.reply(`Salom ${firstName}! Do'konimizga xush kelibsiz.`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🛒 Do'konni ochish",
            web_app: { url: process.env.MINI_APP_URL || "https://example.com" },
          },
        ],
      ],
    },
  });
});

bot.command("orders", async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply("⛔ Ruxsat yo'q");
  }

  // Implementation will typically query the Supabase DB
  // For the sake of the bot skeleton, we simulate fetching orders.
  await ctx.reply("Oxirgi buyurtmalar ro'yxati (bu yerda DB dan olinadi)");
});

bot.command("accept", async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply("⛔ Ruxsat yo'q");
  }

  const orderId = ctx.match;
  if (!orderId) {
    return ctx.reply("Format: /accept <order_id>");
  }

  // Implementation to update DB and notify:
  // fetch API or direct supabase query
  await ctx.reply(`Buyurtma ${orderId} qabul qilindi.`);
});

bot.command("deliver", async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply("⛔ Ruxsat yo'q");
  }
  const orderId = ctx.match;
  if (!orderId) {
    return ctx.reply("Format: /deliver <order_id>");
  }

  await ctx.reply(`Buyurtma ${orderId} yetkazilmoqda.`);
});

bot.command("cancel", async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply("⛔ Ruxsat yo'q");
  }
  const orderId = ctx.match;
  if (!orderId) {
    return ctx.reply("Format: /cancel <order_id>");
  }

  await ctx.reply(`Buyurtma ${orderId} bekor qilindi.`);
});

// Notifications
bot.on("callback_query:data", async (ctx) => {
  if (!isAdmin(ctx)) return;
  const data = ctx.callbackQuery.data;

  if (data.startsWith("accept:")) {
    const orderId = data.split(":")[1];
    // status update in DB here
    await ctx.answerCallbackQuery(`Buyurtma ${orderId} qabul qilindi`);
    await ctx.editMessageReplyMarkup(); // Remove buttons
  } else if (data.startsWith("cancel:")) {
    const orderId = data.split(":")[1];
    await ctx.answerCallbackQuery(`Buyurtma ${orderId} bekor qilinadi`);
    await ctx.editMessageReplyMarkup(); // Remove buttons
  }
});

// For Vercel Serverless
const app = express();
app.use(express.json());

// Set up webhook handler
app.use("/bot/webhook", webhookCallback(bot, "express"));

if (process.env.NODE_ENV !== "production") {
  // Start polling in development if no webhook is set up
  bot.start().catch((err) => console.error(err));
  console.log("Bot started in polling mode");
}

export default app;
