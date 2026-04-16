import express from "express";
import { Bot, webhookCallback } from "grammy";
import { registerOrdersCommand } from "./commands/orders";
import { registerStartCommand } from "./commands/start";
import { registerStatusCommands } from "./commands/status";
import { env } from "./lib/env";

if (!env.botToken) {
  throw new Error("BOT_TOKEN is required");
}

export const bot = new Bot(env.botToken);

registerStartCommand(bot);
registerOrdersCommand(bot);
registerStatusCommands(bot);

bot.catch((error) => {
  console.error("Bot error:", error.error);
});

let webhookPromise: Promise<void> | undefined;
let pollingStarted = false;
let startupNotificationSent = false;

async function notifyAdminsOnStartup(mode: "polling" | "webhook") {
  if (startupNotificationSent || !env.adminIds.length) {
    return;
  }

  startupNotificationSent = true;

  const text =
    mode === "polling"
      ? "Bot ishlayapti. Rejim: local polling."
      : "Bot ishlayapti. Rejim: webhook.";

  await Promise.allSettled(
    env.adminIds.map((adminId) => bot.api.sendMessage(adminId, text)),
  );
}

async function ensureWebhook() {
  if (!env.isProduction || !env.webhookUrl) {
    return;
  }

  if (!webhookPromise) {
    webhookPromise = (async () => {
      const info = await bot.api.getWebhookInfo();
      if (info.url !== env.webhookUrl) {
        await bot.api.setWebhook(env.webhookUrl);
      }

      console.log("Bot ishlayapti. Rejim: webhook.");
      await notifyAdminsOnStartup("webhook");
    })().catch((error) => {
      webhookPromise = undefined;
      console.error("Webhook registration failed:", error);
    });
  }

  await webhookPromise;
}

let pollingPromise: Promise<void> | undefined;

async function ensurePolling() {
  if (env.isProduction) {
    return;
  }

  if (!pollingPromise) {
    pollingPromise = (async () => {
      const info = await bot.api.getWebhookInfo();
      if (info.url) {
        await bot.api.deleteWebhook({
          drop_pending_updates: false,
        });
      }

      console.log("Bot ishlayapti. Rejim: local polling.");
      await notifyAdminsOnStartup("polling");
      void bot.start().catch((error) => {
        pollingStarted = false;
        pollingPromise = undefined;
        console.error("Polling start failed:", error);
      });
    })().catch((error) => {
      pollingStarted = false;
      pollingPromise = undefined;
      console.error("Polling start failed:", error);
    });
  }

  await pollingPromise;
}

const app = express();
app.use(express.json());

app.get("/bot/health", async (_req, res) => {
  await ensureWebhook();
  res.json({ status: "ok" });
});

if (env.isProduction) {
  app.post("/bot/webhook", webhookCallback(bot, "express"));
}

if (!env.isProduction && !pollingStarted) {
  pollingStarted = true;
  void ensurePolling();
}

void ensureWebhook();

export default app;
