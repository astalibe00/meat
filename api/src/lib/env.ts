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

function resolveVercelBaseUrl() {
  const candidate =
    process.env.MINI_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_BRANCH_URL ??
    process.env.VERCEL_URL;

  if (!candidate) {
    return "";
  }

  const normalized = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;

  try {
    return new URL(normalized).toString();
  } catch {
    return "";
  }
}

loadWorkspaceEnv();

const resolvedMiniAppUrl = process.env.MINI_APP_URL || resolveVercelBaseUrl();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  botToken: process.env.BOT_TOKEN ?? "",
  webhookUrl: process.env.WEBHOOK_URL ?? "",
  channelId: process.env.CHANNEL_ID ?? "",
  miniAppUrl: resolvedMiniAppUrl,
  allowedOrigin: parseOrigin(resolvedMiniAppUrl),
  adminIds: parseAdminIds(process.env.ADMIN_TELEGRAM_IDS),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  devTelegramId: process.env.DEV_TELEGRAM_ID
    ? Number.parseInt(process.env.DEV_TELEGRAM_ID, 10)
    : undefined,
};
