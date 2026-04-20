import { getAdminChatIds, getChannelId, sendMessage } from "./_lib/telegram.js";
import { requireAdminRequest } from "./_lib/admin-auth.js";
import { mutateAppData, nextBroadcastId } from "./_lib/app-data.js";

interface ApiRequest {
  method?: string;
  body?: {
    title?: string;
    body?: string;
  };
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

function getRecipients(telegramIds: number[]) {
  return [...new Set([...telegramIds, ...getAdminChatIds().map(Number), Number(getChannelId() || 0)])].filter(
    Boolean,
  );
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    await requireAdminRequest(req);
    const title = req.body?.title?.trim() || "Fresh Halal yangiliklari";
    const body = req.body?.body?.trim();

    if (!body) {
      res.status(400).json({ ok: false, error: "Message body is required" });
      return;
    }

    const nextState = await mutateAppData((state) => ({
      ...state,
      broadcasts: [
        {
          id: nextBroadcastId(),
          title,
          body,
          createdAt: new Date().toISOString(),
        },
        ...state.broadcasts,
      ].slice(0, 50),
    }));

    const recipients = getRecipients(
      nextState.customers.map((item) => item.telegramUserId).filter(Boolean) as number[],
    );

    await Promise.all(
      recipients.map((chatId) =>
        sendMessage(chatId, `${title}\n\n${body}`),
      ),
    );

    res.status(200).json({ ok: true, sent: recipients.length });
  } catch (error) {
    console.error("[broadcast] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Broadcast failed",
    });
  }
}
