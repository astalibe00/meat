import type { Bot } from "grammy";
import { ensureAdmin } from "../lib/admin";
import { buildStatusKeyboard, formatAdminOrder } from "../lib/messages";
import { listRecentAdminOrders } from "../services/orders";

export function registerOrdersCommand(bot: Bot) {
  bot.command("orders", async (ctx) => {
    if (!(await ensureAdmin(ctx))) {
      return;
    }

    const orders = await listRecentAdminOrders(10);

    if (!orders.length) {
      await ctx.reply("Faol buyurtmalar topilmadi.");
      return;
    }

    for (const order of orders) {
      await ctx.reply(formatAdminOrder(order), {
        reply_markup: buildStatusKeyboard(order.id, order.status),
      });
    }
  });
}
