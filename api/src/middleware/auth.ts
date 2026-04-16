import type { NextFunction, Request, Response } from "express";
import { env } from "../lib/env";
import { HttpError } from "../lib/errors";
import {
  parseAuthorizationHeader,
  parseDevelopmentTelegramUser,
  type TelegramUser,
  validateTelegramData,
} from "../lib/telegram";
import { upsertTelegramUser } from "../services/users";

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const payload = parseAuthorizationHeader(req.headers.authorization);

    if (!payload) {
      throw new HttpError(401, "Avtorizatsiya kerak");
    }

    let authMode: "telegram" | "development" = "telegram";
    let user: TelegramUser | undefined = env.isProduction
      ? undefined
      : parseDevelopmentTelegramUser(payload);

    if (user) {
      authMode = "development";
    } else {
      const validation = validateTelegramData(payload, env.botToken);

      if (!validation.valid || !validation.user) {
        throw new HttpError(401, "Yaroqsiz avtorizatsiya ma'lumotlari");
      }

      user = validation.user;
    }

    const appUser = await upsertTelegramUser(user);

    req.authMode = authMode;
    req.isAdmin = env.adminIds.includes(user.id);
    req.telegramUser = user;
    req.userId = appUser.id;

    next();
  } catch (error) {
    next(error);
  }
}

export function adminMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.isAdmin) {
    next(new HttpError(403, "Ruxsat yo'q"));
    return;
  }

  next();
}
