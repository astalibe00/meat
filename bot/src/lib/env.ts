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

const miniAppUrl = process.env.MINI_APP_URL || resolveVercelBaseUrl();

export const env = {
  adminIds: parseAdminIds(process.env.ADMIN_TELEGRAM_IDS),
  botToken: process.env.BOT_TOKEN ?? "",
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  miniAppUrl,
  nodeEnv: process.env.NODE_ENV ?? "development",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  webhookUrl:
    process.env.WEBHOOK_URL ?? (miniAppUrl ? new URL("/bot/webhook", miniAppUrl).toString() : ""),
};
