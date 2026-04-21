import { requireAdminRequest } from "./_lib/admin-auth.js";
import { attachReviewSummary, readAppData } from "./_lib/app-data.js";
import {
  buildCustomerInsights,
  groupOrdersByStatus,
  latestAuditEntries,
  summarizeLowStockProducts,
} from "../src/lib/customer-intelligence.js";

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const session = await requireAdminRequest(req);
    const state = await readAppData();
    const products = attachReviewSummary(state.products, state.reviews);
    const paidOrders = state.orders.filter((order) => order.paymentStatus === "paid");
    const pendingOrders = state.orders.filter((order) => order.status === "pending");
    const cancelledOrders = state.orders.filter((order) => order.status === "cancelled");
    const totalRevenue = sum(paidOrders.map((order) => order.total));
    const pendingRevenue = sum(
      state.orders
        .filter((order) => order.paymentStatus === "pending")
        .map((order) => order.total),
    );
    const lowStockProducts = summarizeLowStockProducts(products);
    const customerInsights = buildCustomerInsights(state.customers, state.orders);
    const orderBuckets = groupOrdersByStatus(state.orders);

    res.status(200).json({
      ok: true,
      session,
      orders: state.orders,
      products,
      customers: state.customers,
      customerInsights,
      reviews: state.reviews,
      broadcasts: state.broadcasts,
      lowStockProducts,
      orderBuckets,
      auditLog: latestAuditEntries(state.auditLog),
      pickupPoints: state.pickupPoints,
      analytics: {
        ordersTotal: state.orders.length,
        pendingOrders: pendingOrders.length,
        cancelledOrders: cancelledOrders.length,
        customersTotal: state.customers.length,
        paidRevenue: totalRevenue,
        pendingRevenue,
        averageOrderValue: paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0,
        lowStockCount: lowStockProducts.length,
      },
    });
  } catch (error) {
    console.error("[admin-state] failed", error);
    res.status(401).json({
      ok: false,
      error: error instanceof Error ? error.message : "Admin state failed",
    });
  }
}
