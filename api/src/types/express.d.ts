import type { TelegramUser } from "../lib/telegram";

declare global {
  namespace Express {
    interface Request {
      authMode?: "telegram" | "development";
      isAdmin?: boolean;
      telegramUser?: TelegramUser;
      userId?: string;
    }
  }
}

export {};
