import type { ManagedProduct } from "../src/types/app-data.js";
import { appendAuditLog, attachReviewSummary, mutateAppData, nextBroadcastId, readAppData } from "./_lib/app-data.js";
import { requireAdminRequest } from "./_lib/admin-auth.js";

interface ApiRequest {
  method?: string;
  body?: Partial<ManagedProduct> & { id?: string };
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

function createProductId(name?: string) {
  const slug = (name ?? "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "product"}-${Date.now().toString(36).slice(-4)}`;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === "GET") {
      const state = await readAppData();
      res.status(200).json({
        ok: true,
        products: attachReviewSummary(state.products, state.reviews),
      });
      return;
    }

    if (req.method === "POST") {
      await requireAdminRequest(req);
      const payload = req.body ?? {};
      const id = payload.id?.trim() || createProductId(payload.name);
      const nextState = await mutateAppData((state) => {
        const existingIndex = state.products.findIndex((item) => item.id === id);
        const nextProduct: ManagedProduct = {
          id,
          name: payload.name?.trim() || "Yangi mahsulot",
          price: Number(payload.price ?? 0),
          oldPrice: payload.oldPrice ? Number(payload.oldPrice) : undefined,
          weight: payload.weight?.trim() || "1 kg",
          category: payload.category ?? "beef",
          image: payload.image?.trim() || state.products[0]?.image || "",
          tags: payload.tags?.length ? payload.tags : ["Fresh"],
          description: payload.description?.trim() || "",
          weightOptions: payload.weightOptions ?? [payload.weight?.trim() || "1 kg"],
          origin: payload.origin?.trim(),
          prepTime: payload.prepTime?.trim(),
          stockKg: Number(payload.stockKg ?? 0),
          minOrderKg: Number(payload.minOrderKg ?? 0.3),
          enabled: payload.enabled ?? true,
          rating: Number(payload.rating ?? 4.8),
          reviewCount: Number(payload.reviewCount ?? 0),
        };

        const products = [...state.products];
        if (existingIndex >= 0) {
          products[existingIndex] = nextProduct;
        } else {
          products.unshift(nextProduct);
        }

        return {
          ...state,
          products,
          broadcasts: [
            {
              id: nextBroadcastId(),
              title: "Admin yangilanishi",
              body: `${nextProduct.name} mahsuloti katalogda yangilandi.`,
              createdAt: new Date().toISOString(),
              audience: "all" as const,
              sentCount: 0,
            },
            ...state.broadcasts,
          ].slice(0, 50),
          auditLog: appendAuditLog(state.auditLog, {
            actor: "admin-panel",
            actorRole: "owner",
            action: existingIndex >= 0 ? "product.updated" : "product.created",
            entityType: "product",
            entityId: nextProduct.id,
            summary: `${nextProduct.name} mahsuloti saqlandi. Qoldiq: ${nextProduct.stockKg} kg.`,
          }),
        };
      });

      res.status(200).json({
        ok: true,
        products: attachReviewSummary(nextState.products, nextState.reviews),
      });
      return;
    }

    if (req.method === "DELETE") {
      await requireAdminRequest(req);
      const payload = req.body ?? {};
      if (!payload.id) {
        res.status(400).json({ ok: false, error: "Product id is required" });
        return;
      }

      const nextState = await mutateAppData((state) => ({
        ...state,
        products: state.products.filter((item) => item.id !== payload.id),
        auditLog: appendAuditLog(state.auditLog, {
          actor: "admin-panel",
          actorRole: "owner",
          action: "product.deleted",
          entityType: "product",
          entityId: payload.id,
          summary: `${payload.id} mahsuloti katalogdan o'chirildi.`,
        }),
      }));

      res.status(200).json({
        ok: true,
        products: attachReviewSummary(nextState.products, nextState.reviews),
      });
      return;
    }

    res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    console.error("[products] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Products request failed",
    });
  }
}
