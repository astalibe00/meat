import crypto from "crypto";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

function buildDataCheckString(params: URLSearchParams) {
  return Array.from(params.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function hashesMatch(expectedHash: string, receivedHash: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const received = Buffer.from(receivedHash, "hex");

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

export function parseAuthorizationHeader(header?: string) {
  const prefix = "TelegramWebApp ";

  if (!header || !header.startsWith(prefix)) {
    return undefined;
  }

  return header.slice(prefix.length).trim();
}

export function parseDevelopmentTelegramUser(payload: string) {
  if (!payload.startsWith("dev:")) {
    return undefined;
  }

  const telegramId = Number.parseInt(payload.slice(4), 10);
  if (!Number.isSafeInteger(telegramId) || telegramId <= 0) {
    return undefined;
  }

  return {
    id: telegramId,
    first_name: "Local",
    last_name: "Tester",
    username: `dev_${telegramId}`,
  } satisfies TelegramUser;
}

export function validateTelegramData(initData: string, botToken: string) {
  try {
    const params = new URLSearchParams(initData);
    const receivedHash = params.get("hash");

    if (!receivedHash || !botToken) {
      return { valid: false as const };
    }

    params.delete("hash");

    const secret = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secret)
      .update(buildDataCheckString(params))
      .digest("hex");

    if (!hashesMatch(computedHash, receivedHash)) {
      return { valid: false as const };
    }

    const authDate = Number.parseInt(params.get("auth_date") ?? "", 10);
    const now = Math.floor(Date.now() / 1000);

    if (!Number.isFinite(authDate) || now - authDate > 3600) {
      return { valid: false as const };
    }

    const user = JSON.parse(params.get("user") ?? "{}") as TelegramUser;
    if (!Number.isSafeInteger(user.id)) {
      return { valid: false as const };
    }

    return {
      valid: true as const,
      authDate,
      user,
    };
  } catch {
    return { valid: false as const };
  }
}
