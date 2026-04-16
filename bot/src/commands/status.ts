import type { Bot, Context } from "grammy";
import { ensureAdmin } from "../lib/admin";
import { buildStatusKeyboard, shortId } from "../lib/messages";
import { notifyCustomer } from "../notifications/customer";
import { type OrderStatus, updateOrderStatus } from "../services/orders";

async function applyStatusChange(
  bot: Bot,
  ctx: Context,
  orderId: string,
  status: OrderStatus,
) {
  const order = await updateOrderStatus(orderId, status);
  await notifyCustomer(bot, order, status);
  return order;
}

function getCommandArgument(match: string | undefined) {
  return match?.trim();
}

export function registerStatusCommands(bot: Bot) {
  bot.command("accept", async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      return;
    }

    const orderId = getCommandArgument(ctx.match);
    if (!orderId) {
      await ctx.reply("Format: /accept <order_id>");
      return;
    }

    const order = await applyStatusChange(bot, ctx, orderId, "accepted");
    await ctx.reply(`Buyurtma #${shortId(order.id)} qabul qilindi.`);
  });

  bot.command("deliver", async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      return;
    }

    const orderId = getCommandArgument(ctx.match);
    if (!orderId) {
      await ctx.reply("Format: /deliver <order_id>");
      return;
    }

    const order = await applyStatusChange(bot, ctx, orderId, "delivering");
    await ctx.reply(`Buyurtma #${shortId(order.id)} yetkazishga yuborildi.`);
  });

  bot.command("prepare", async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      return;
    }

    const orderId = getCommandArgument(ctx.match);
    if (!orderId) {
      await ctx.reply("Format: /prepare <order_id>");
      return;
    }

    const order = await applyStatusChange(bot, ctx, orderId, "preparing");
    await ctx.reply(`Buyurtma #${shortId(order.id)} tayyorlanmoqda holatiga o'tdi.`);
  });

  bot.command("complete", async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      return;
    }

    const orderId = getCommandArgument(ctx.match);
    if (!orderId) {
      await ctx.reply("Format: /complete <order_id>");
      return;
    }

    const order = await applyStatusChange(bot, ctx, orderId, "completed");
    await ctx.reply(`Buyurtma #${shortId(order.id)} yakunlandi.`);
  });

  bot.command("cancel", async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      return;
    }

    const orderId = getCommandArgument(ctx.match);
    if (!orderId) {
      await ctx.reply("Format: /cancel <order_id>");
      return;
    }

    const order = await applyStatusChange(bot, ctx, orderId, "cancelled");
    await ctx.reply(`Buyurtma #${shortId(order.id)} bekor qilindi.`);
  });

  bot.on("callback_query:data", async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      await ctx.answerCallbackQuery();
      return;
    }

    const parts = ctx.callbackQuery.data.split(":");
    if (parts.length !== 3 || parts[0] !== "status") {
      await ctx.answerCallbackQuery();
      return;
    }

    const [, orderId, rawStatus] = parts;
    const status = rawStatus as OrderStatus;

    const order = await applyStatusChange(bot, ctx, orderId, status);
    await ctx.answerCallbackQuery("Holat yangilandi");
    await ctx.editMessageText(
      [
        `Buyurtma #${shortId(order.id)}`,
        `Holat: ${order.status}`,
        `Jami: ${Number(order.total_price).toLocaleString("ru-RU")} so'm`,
      ].join("\n"),
      {
        reply_markup: buildStatusKeyboard(order.id, order.status),
      },
    );
  });
}
