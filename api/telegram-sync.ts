import { getBaseUrl, getTelegramToken, getWebAppUrl, getWebhookSecret, telegramApi } from "./_lib/telegram.js";

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!getTelegramToken()) {
    res.status(500).json({ ok: false, error: "TELEGRAM_BOT_TOKEN/BOT_TOKEN is missing" });
    return;
  }

  try {
    const baseUrl = getBaseUrl(req);
    if (!baseUrl) {
      throw new Error("Unable to determine the public base URL for this deployment.");
    }

    const webhookUrl = `${baseUrl}/api/telegram-webhook`;
    const secretToken = getWebhookSecret();
    const webAppUrl = getWebAppUrl(baseUrl);

    await telegramApi("setWebhook", {
      url: secretToken ? `${webhookUrl}?secret=${secretToken}` : webhookUrl,
      ...(secretToken ? { secret_token: secretToken } : {}),
      allowed_updates: ["message", "callback_query"],
    });

    await telegramApi("setMyCommands", {
      commands: [
        { command: "start", description: "Asosiy menyu" },
        { command: "orders", description: "Buyurtmalarim" },
        { command: "repeat", description: "Oxirgi buyurtmani qayta qo'shish" },
        { command: "support", description: "Yordam" },
      ],
    });

    if (webAppUrl) {
      await telegramApi("setChatMenuButton", {
        menu_button: {
          type: "web_app",
          text: "Mini App",
          web_app: {
            url: webAppUrl,
          },
        },
      });
    }

    res.status(200).json({
      ok: true,
      webhookUrl,
      webAppUrl,
      secretEnabled: Boolean(secretToken),
    });
  } catch (error) {
    console.error("[telegram-sync] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Telegram sync failed",
    });
  }
}
