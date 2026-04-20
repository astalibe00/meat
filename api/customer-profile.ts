import type { CustomerProfile, FulfillmentType, GeoPoint } from "../src/types/app-data.js";
import { mutateAppData, readAppData, upsertCustomer } from "./_lib/app-data.js";

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: Partial<CustomerProfile> & {
    telegramUserId?: number;
    preferredFulfillment?: FulfillmentType;
    coordinates?: GeoPoint;
  };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === "GET") {
      const telegramUserId = Number(req.query?.telegramUserId ?? 0) || undefined;
      const state = await readAppData();
      const profile = state.customers.find((item) => item.telegramUserId === telegramUserId);
      res.status(200).json({ ok: true, profile: profile ?? null });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    const payload = req.body ?? {};
    if (!payload.telegramUserId) {
      res.status(400).json({ ok: false, error: "telegramUserId is required" });
      return;
    }

    const nextState = await mutateAppData((state) => ({
      ...state,
      customers: upsertCustomer(state.customers, {
        telegramUserId: payload.telegramUserId,
        name: payload.name?.trim() || "Telegram mijoz",
        username: payload.username?.trim(),
        phone: payload.phone?.trim(),
        address: payload.address?.trim(),
        addressLabel: payload.addressLabel?.trim(),
        coordinates: payload.coordinates,
        preferredFulfillment: payload.preferredFulfillment ?? "delivery",
        pickupPointId: payload.pickupPointId?.trim(),
      }),
    }));

    const profile = nextState.customers.find(
      (item) => item.telegramUserId === payload.telegramUserId,
    );

    res.status(200).json({ ok: true, profile });
  } catch (error) {
    console.error("[customer-profile] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Customer profile failed",
    });
  }
}
