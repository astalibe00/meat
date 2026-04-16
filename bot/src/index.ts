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

bot.catch(async (error) => {
  console.error("Bot error:", error.error);

  try {
    if (error.ctx?.chat?.id) {
      await error.ctx.reply(
        "Botda texnik xatolik yuz berdi. Bir necha soniyadan keyin qayta urinib ko'ring.",
      );
    }
  } catch (replyError) {
    console.error("Failed to send bot error message:", replyError);
  }
});

let webhookPromise: Promise<void> | undefined;
let pollingStarted = false;
let startupNotificationSent = false;
let surfacePromise: Promise<void> | undefined;
let pollingRetryTimer: NodeJS.Timeout | undefined;

function looksPlaceholder(value: string) {
  return /kalit|toping|example|12345678|87654321|your_|service_role/i.test(value);
}

async function ensureBotSurface() {
  if (surfacePromise) {
    return surfacePromise;
  }

  surfacePromise = (async () => {
    const userCommands = [
      { command: "start", description: "Botni ishga tushirish" },
      { command: "profile", description: "Profilni ko'rish" },
      { command: "address", description: "Manzilni yangilash" },
    ];
    const adminCommands = [
      ...userCommands,
      { command: "orders", description: "Buyurtmalar ro'yxati" },
      { command: "accept", description: "Buyurtmani qabul qilish" },
      { command: "prepare", description: "Buyurtmani tayyorlash" },
      { command: "deliver", description: "Buyurtmani yetkazishga yuborish" },
      { command: "complete", description: "Buyurtmani yakunlash" },
      { command: "cancel", description: "Buyurtmani bekor qilish" },
    ];

    await bot.api.setMyCommands(userCommands);

    await Promise.allSettled(
      env.adminIds.map((adminId) =>
        bot.api.setMyCommands(adminCommands, {
          scope: {
            type: "chat",
            chat_id: adminId,
          },
        }),
      ),
    );

    if (env.miniAppUrl) {
      await bot.api.setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: "Issiq menyu",
          web_app: {
            url: env.miniAppUrl,
          },
        },
      });
    }
  })().catch((error) => {
    surfacePromise = undefined;
    console.error("Bot surface setup failed:", error);
    throw error;
  });

  return surfacePromise;
}

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

      await ensureBotSurface();
      console.log("Bot ishlayapti. Rejim: webhook.");
      await notifyAdminsOnStartup("webhook");
    })().catch((error) => {
      webhookPromise = undefined;
      console.error("Webhook registration failed:", error);
      throw error;
    });
  }

  await webhookPromise;
}

let pollingPromise: Promise<void> | undefined;

function schedulePollingRetry() {
  if (env.isProduction || pollingRetryTimer) {
    return;
  }

  pollingRetryTimer = setTimeout(() => {
    pollingRetryTimer = undefined;

    if (!pollingStarted) {
      pollingStarted = true;
      void ensurePolling().catch((error) => {
        console.error("Retry polling failed:", error);
      });
    }
  }, 5000);
}

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

      await ensureBotSurface();
      console.log("Bot ishlayapti. Rejim: local polling.");
      await notifyAdminsOnStartup("polling");
      void bot.start().catch((error) => {
        pollingStarted = false;
        pollingPromise = undefined;
        console.error("Polling start failed:", error);
        schedulePollingRetry();
      });
    })().catch((error) => {
      pollingStarted = false;
      pollingPromise = undefined;
      console.error("Polling start failed:", error);
      schedulePollingRetry();
      throw error;
    });
  }

  await pollingPromise;
}

const app = express();
app.use(express.json());

if (looksPlaceholder(env.supabaseServiceRoleKey)) {
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY noto'g'ri yoki placeholder ko'rinishida. Bot ro'yxatdan o'tish oqimi ishlamasligi mumkin.",
  );
}

if (!env.adminIds.length || looksPlaceholder(env.adminIds.join(","))) {
  console.warn(
    "ADMIN_TELEGRAM_IDS to'liq sozlanmagan. Admin menyu va admin komandalar to'liq ishlamasligi mumkin.",
  );
}

app.get("/bot/health", async (_req, res) => {
  await ensureWebhook();
  res.json({ status: "ok" });
});

if (env.isProduction) {
  app.post("/bot/webhook", webhookCallback(bot, "express"));
}

if (!env.isProduction && !pollingStarted) {
  pollingStarted = true;
  void ensurePolling().catch((error) => {
    console.error("Initial polling failed:", error);
  });
}

void ensureWebhook();

export default app;
