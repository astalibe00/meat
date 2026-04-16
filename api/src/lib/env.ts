import fs from "fs";
import path from "path";
import dotenv from "dotenv";

let isLoaded = false;

function loadWorkspaceEnv() {
  if (isLoaded) {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(__dirname, "../../../.env"),
    path.resolve(__dirname, "../../../../.env"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      break;
    }
  }

  isLoaded = true;
}

function parseAdminIds(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isSafeInteger(item));
}

function parseOrigin(url?: string) {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

loadWorkspaceEnv();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  botToken: process.env.BOT_TOKEN ?? "",
  webhookUrl: process.env.WEBHOOK_URL ?? "",
  channelId: process.env.CHANNEL_ID ?? "",
  miniAppUrl: process.env.MINI_APP_URL ?? "",
  allowedOrigin: parseOrigin(process.env.MINI_APP_URL),
  adminIds: parseAdminIds(process.env.ADMIN_TELEGRAM_IDS),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  devTelegramId: process.env.DEV_TELEGRAM_ID
    ? Number.parseInt(process.env.DEV_TELEGRAM_ID, 10)
    : undefined,
};
