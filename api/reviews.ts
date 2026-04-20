import type { Review } from "../src/types/app-data.js";
import { attachReviewSummary, mutateAppData, nextReviewId, readAppData } from "./_lib/app-data.js";

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: Partial<Review>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === "GET") {
      const productId = String(req.query?.productId ?? "").trim();
      const state = await readAppData();
      const reviews = productId
        ? state.reviews.filter((item) => item.productId === productId)
        : state.reviews;

      res.status(200).json({ ok: true, reviews });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    const payload = req.body ?? {};
    if (!payload.orderId || !payload.productId || !payload.customerName || !payload.rating) {
      res.status(400).json({ ok: false, error: "Review fields are missing" });
      return;
    }

    const nextState = await mutateAppData((state) => {
      const review: Review = {
        id: nextReviewId(),
        orderId: payload.orderId,
        productId: payload.productId,
        customerName: payload.customerName,
        rating: Math.max(1, Math.min(5, Number(payload.rating))),
        comment: payload.comment?.trim(),
        createdAt: new Date().toISOString(),
      };

      const orderIndex = state.orders.findIndex((item) => item.id === payload.orderId);
      const orders = [...state.orders];
      if (orderIndex >= 0) {
        orders[orderIndex] = {
          ...orders[orderIndex],
          reviewIds: [...new Set([...(orders[orderIndex].reviewIds ?? []), review.id])],
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        ...state,
        orders,
        reviews: [review, ...state.reviews],
      };
    });

    res.status(200).json({
      ok: true,
      reviews: nextState.reviews,
      products: attachReviewSummary(nextState.products, nextState.reviews),
    });
  } catch (error) {
    console.error("[reviews] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Review request failed",
    });
  }
}
