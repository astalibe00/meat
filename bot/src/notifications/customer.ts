import type { Bot } from "grammy";
import { formatStatusMessage } from "../lib/messages";
import type { OrderStatus } from "../services/orders";

export async function notifyCustomer(
  bot: Bot,
  order: {
    id: string;
    users?: {
      telegram_id?: number | null;
    } | null;
  },
  status: OrderStatus,
) {
  const telegramId = order.users?.telegram_id;
  if (!telegramId) {
    return;
  }

  await bot.api.sendMessage(telegramId, formatStatusMessage(status, order.id));
}
