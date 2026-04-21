import { attachReviewSummary, findCustomer, readAppData } from "./_lib/app-data.js";

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
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
