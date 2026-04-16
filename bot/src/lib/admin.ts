import type { Context } from "grammy";
import { env } from "./env";

export function isAdmin(telegramId?: number) {
  return telegramId !== undefined && env.adminIds.includes(telegramId);
}

export async function ensureAdmin(ctx: Context) {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply("Ruxsat yo'q");
    return false;
  }

  return true;
}
