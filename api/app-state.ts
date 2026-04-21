import { attachReviewSummary, findCustomer, readAppData } from "./_lib/app-data.js";

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
  try {
    if (req.method === "PATCH") {
      const telegramUserId = Number(req.body?.telegramUserId ?? 0) || undefined;
      if (!telegramUserId) {
        res.status(400).json({ ok: false, error: "telegramUserId kerak." });
        return;
      }

      const { markNotificationsRead, mutateAppData } = await import("./_lib/app-data.js");
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

    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    const telegramUserId = Number(req.query?.telegramUserId ?? 0) || undefined;
    const data = await readAppData();
    const profile = findCustomer(data.customers, telegramUserId);
    const orders = telegramUserId
      ? data.orders.filter((order) => order.customer.telegramUserId === telegramUserId)
      : [];
    const notifications = telegramUserId
      ? data.notifications.filter((notification) => notification.telegramUserId === telegramUserId)
      : [];

    res.status(200).json({
      ok: true,
      profile,
      pickupPoints: data.pickupPoints,
      products: attachReviewSummary(data.products, data.reviews),
      orders,
      notifications,
      reviews: data.reviews,
      support: {
        phone: "+998990197548",
        telegram: "https://t.me/saidazizov_s",
      },
    });
  } catch (error) {
    console.error("[app-state] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "App state read failed",
    });
  }
}
