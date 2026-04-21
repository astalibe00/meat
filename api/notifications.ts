import { markNotificationsRead, mutateAppData, readAppData } from "./_lib/app-data.js";

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: {
    telegramUserId?: number;
    notificationIds?: string[];
  };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const telegramUserId =
    Number(req.body?.telegramUserId ?? req.query?.telegramUserId ?? 0) || undefined;

  if (!telegramUserId) {
    res.status(400).json({ ok: false, error: "telegramUserId kerak." });
    return;
  }

  try {
    if (req.method === "GET") {
      const state = await readAppData();
      const notifications = state.notifications.filter(
        (notification) => notification.telegramUserId === telegramUserId,
      );

      res.status(200).json({
        ok: true,
        notifications,
        unreadCount: notifications.filter((notification) => !notification.readAt).length,
      });
      return;
    }

    if (req.method === "PATCH") {
      const nextState = await mutateAppData((state) => ({
        ...state,
        notifications: markNotificationsRead(
          state.notifications,
          telegramUserId,
          req.body?.notificationIds,
        ),
      }));

      const notifications = nextState.notifications.filter(
        (notification) => notification.telegramUserId === telegramUserId,
      );

      res.status(200).json({
        ok: true,
        notifications,
        unreadCount: notifications.filter((notification) => !notification.readAt).length,
      });
      return;
    }

    res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    console.error("[notifications] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Notifications request failed",
    });
  }
}
