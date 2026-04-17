import { HttpError } from "../lib/errors";
import { isMissingTableError } from "../lib/optional-db";
import {
  notifyAdminsAboutNewOrder,
  notifyCustomerAboutStatus,
} from "../lib/telegram-bot";
import { supabase } from "../lib/supabase";
import { updateUserProfile } from "./users";

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  accepted: ["preparing", "delivering", "cancelled"],
  cancelled: [],
  completed: [],
  delivering: ["completed"],
  pending: ["accepted", "cancelled"],
  preparing: ["delivering", "cancelled"],
};

export const ORDER_TIMELINE = [
  { description: "Buyurtma qabul qilindi va sellerga yuborildi.", key: "pending", label: "Qabul qilindi" },
  { description: "Seller buyurtmani tasdiqladi.", key: "accepted", label: "Tasdiqlandi" },
  { description: "Mahsulot tayyorlanmoqda va qadoqlanmoqda.", key: "preparing", label: "Tayyorlanmoqda" },
  { description: "Buyurtma yo'lga chiqdi.", key: "delivering", label: "Yetkazilmoqda" },
  { description: "Buyurtma muvaffaqiyatli yakunlandi.", key: "completed", label: "Yetkazildi" },
] as const;

function toNumber(value: number | string) {
  return Number(value);
}

async function recordOrderStatusHistory(input: {
  fromStatus?: OrderStatus;
  orderId: string;
  source: string;
  toStatus: OrderStatus;
}) {
  const { error } = await supabase.from("order_status_history").insert({
    from_status: input.fromStatus ?? null,
    order_id: input.orderId,
    source: input.source,
    to_status: input.toStatus,
  });

  if (error && !isMissingTableError(error, "order_status_history")) {
    console.error("order_status_history insert failed:", error);
  }
}

function emitOperationalEvent(name: string, payload: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      event: name,
      payload,
      timestamp: new Date().toISOString(),
    }),
  );
}

async function fetchOrderWithUser(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, users(first_name, last_name, username, telegram_id)")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    throw new HttpError(404, "Buyurtma topilmadi");
  }

  return data;
}

export function getOrderTimelineSnapshot(status: OrderStatus) {
  const currentIndex =
    status === "cancelled" ? -1 : ORDER_TIMELINE.findIndex((item) => item.key === status);

  return ORDER_TIMELINE.map((step, index) => ({
    ...step,
    active: currentIndex === index,
    done: currentIndex >= index,
  }));
}

export async function createOrderForUser(input: {
  location: string;
  paymentMethod: "cash" | "click" | "payme";
  phone: string;
  userId: string;
}) {
  const { data: cartItems, error: cartError } = await supabase
    .from("carts")
    .select("product_id, quantity, products(id, name, price, is_available)")
    .eq("user_id", input.userId);

  if (cartError) {
    throw new HttpError(500, "Savatchani yuklashda xatolik");
  }

  if (!cartItems?.length) {
    throw new HttpError(400, "Savatcha bo'sh");
  }

  const items = cartItems.map((cartItem: any) => {
    const product = cartItem.products;

    if (!product || !product.is_available) {
      throw new HttpError(400, "Savatchadagi mahsulotlardan biri mavjud emas");
    }

    return {
      name: product.name,
      price: toNumber(product.price),
      product_id: product.id,
      quantity: cartItem.quantity,
    };
  });

  const totalPrice = items.reduce(
    (sum, item) => sum + toNumber(item.price) * item.quantity,
    0,
  );

  const { data: createdOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      items,
      location: input.location,
      payment_method: input.paymentMethod,
      phone: input.phone,
      status: "pending",
      total_price: totalPrice,
      user_id: input.userId,
    })
    .select("id")
    .single();

  if (orderError || !createdOrder) {
    throw new HttpError(500, "Buyurtma yaratishda xatolik");
  }

  await supabase.from("carts").delete().eq("user_id", input.userId);
  await updateUserProfile(input.userId, {
    default_address: input.location,
    phone: input.phone,
  });

  await recordOrderStatusHistory({
    orderId: createdOrder.id,
    source: "checkout",
    toStatus: "pending",
  });

  emitOperationalEvent("order_created", {
    order_id: createdOrder.id,
    user_id: input.userId,
  });

  const order = await fetchOrderWithUser(createdOrder.id);

  notifyAdminsAboutNewOrder(order).catch((error) => {
    console.error("Admin notification failed:", error);
  });

  return order;
}

export async function listOrdersForUser(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new HttpError(500, "Buyurtmalarni yuklashda xatolik");
  }

  return data ?? [];
}

export async function listActiveOrdersForUser(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "accepted", "preparing", "delivering"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new HttpError(500, "Faol buyurtmalarni yuklashda xatolik");
  }

  return data ?? [];
}

export async function getOrderForUser(userId: string, orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new HttpError(404, "Buyurtma topilmadi");
  }

  return data;
}

export async function getOrderTrackingForUser(userId: string, orderId: string) {
  const order = await getOrderForUser(userId, orderId);
  const timeline = getOrderTimelineSnapshot(order.status as OrderStatus);

  return {
    eta_label: order.status === "delivering" ? "~30 daqiqa" : "Tayyorlanmoqda",
    order,
    payment_status: order.payment_method === "cash" ? "to'lov yetkazilganda" : "online",
    seller_label: "Verified seller",
    timeline,
  };
}

export async function reorderOrderForUser(userId: string, orderId: string) {
  const order = await getOrderForUser(userId, orderId);
  const items = Array.isArray(order.items) ? order.items : [];

  if (!items.length) {
    throw new HttpError(400, "Qayta buyurtma uchun mahsulot topilmadi");
  }

  const { data: existingCartItems, error: existingCartError } = await supabase
    .from("carts")
    .select("product_id, quantity")
    .eq("user_id", userId);

  if (existingCartError) {
    throw new HttpError(500, "Savatchani tayyorlashda xatolik");
  }

  const cartMap = new Map(
    (existingCartItems ?? []).map((item) => [item.product_id, item.quantity]),
  );

  const payload = items.map((item: any) => ({
    product_id: item.product_id,
    quantity: (cartMap.get(item.product_id) ?? 0) + Number(item.quantity ?? 0),
    user_id: userId,
  }));

  const { error } = await supabase.from("carts").upsert(payload, {
    onConflict: "user_id,product_id",
  });

  if (error) {
    throw new HttpError(500, "Qayta buyurtma yaratib bo'lmadi");
  }

  emitOperationalEvent("order_reordered", {
    order_id: order.id,
    user_id: userId,
  });

  return order;
}

export async function listAdminOrders(limit = 10, statuses?: OrderStatus[]) {
  let query = supabase
    .from("orders")
    .select("*, users(first_name, last_name, username, telegram_id)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statuses?.length) {
    query = query.in("status", statuses);
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, "Admin buyurtmalarini yuklashda xatolik");
  }

  return data ?? [];
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  source = "admin",
) {
  const currentOrder = await fetchOrderWithUser(orderId);
  const previousStatus = currentOrder.status as OrderStatus;

  if (previousStatus === status) {
    return currentOrder;
  }

  const allowedStatuses = ORDER_TRANSITIONS[previousStatus] ?? [];
  if (previousStatus && allowedStatuses.length && !allowedStatuses.includes(status)) {
    throw new HttpError(400, "Bu holatdan tanlangan statusga o'tib bo'lmaydi");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    throw new HttpError(500, "Buyurtma holatini yangilashda xatolik");
  }

  await recordOrderStatusHistory({
    fromStatus: previousStatus,
    orderId,
    source,
    toStatus: status,
  });

  emitOperationalEvent("order_status_changed", {
    from_status: previousStatus,
    order_id: orderId,
    source,
    to_status: status,
  });

  const order = await fetchOrderWithUser(orderId);

  notifyCustomerAboutStatus(order, status).catch((notificationError) => {
    console.error("Customer notification failed:", notificationError);
  });

  return order;
}

export async function getAnalytics() {
  const date = new Date();
  date.setDate(date.getDate() - 30);

  const { data, error } = await supabase
    .from("orders")
    .select("items, created_at, total_price")
    .gte("created_at", date.toISOString())
    .neq("status", "cancelled");

  if (error) {
    throw new HttpError(500, "Analitika ma'lumotlarini yuklashda xatolik");
  }

  const stats = new Map<
    string,
    { count: number; name: string; revenue: number }
  >();

  for (const order of data ?? []) {
    for (const item of order.items as Array<{
      name: string;
      price: number | string;
      product_id: string;
      quantity: number;
    }>) {
      const current = stats.get(item.product_id) ?? {
        count: 0,
        name: item.name,
        revenue: 0,
      };

      current.count += item.quantity;
      current.revenue += toNumber(item.price) * item.quantity;
      stats.set(item.product_id, current);
    }
  }

  return Array.from(stats.entries())
    .map(([productId, value]) => ({
      count: value.count,
      name: value.name,
      product_id: productId,
      revenue: value.revenue,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

export async function getDashboardSummary() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    pendingOrdersResult,
    activeDeliveriesResult,
    activeProductsResult,
    categoriesResult,
    todayRevenueResult,
    monthRevenueResult,
    recentOrdersResult,
    topProducts,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivering"),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_available", true),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("total_price, status")
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("orders")
      .select("total_price, status")
      .gte("created_at", monthStart.toISOString()),
    listAdminOrders(5),
    getAnalytics(),
  ]);

  const queryErrors = [
    pendingOrdersResult.error,
    activeDeliveriesResult.error,
    activeProductsResult.error,
    categoriesResult.error,
    todayRevenueResult.error,
    monthRevenueResult.error,
  ].filter(Boolean);

  if (queryErrors.length) {
    throw new HttpError(500, "Dashboard ma'lumotlarini yuklashda xatolik");
  }

  const sumRevenue = (
    rows: Array<{ status: string; total_price: number | string }> | null,
  ) =>
    (rows ?? []).reduce((sum, row) => {
      if (row.status === "cancelled") {
        return sum;
      }

      return sum + Number(row.total_price);
    }, 0);

  return {
    active_deliveries: activeDeliveriesResult.count ?? 0,
    active_products: activeProductsResult.count ?? 0,
    categories_count: categoriesResult.count ?? 0,
    month_revenue: sumRevenue(monthRevenueResult.data ?? null),
    pending_orders: pendingOrdersResult.count ?? 0,
    recent_orders: recentOrdersResult,
    today_revenue: sumRevenue(todayRevenueResult.data ?? null),
    top_products: topProducts,
  };
}
