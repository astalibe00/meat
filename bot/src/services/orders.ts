import { getUserByTelegramId } from "./users";
import { supabase } from "../lib/supabase";

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

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function normalizeProduct(
  product:
    | {
        id?: string;
        image_url?: string | null;
        is_available?: boolean | null;
        name?: string | null;
        price?: number | string | null;
      }
    | Array<{
        id?: string;
        image_url?: string | null;
        is_available?: boolean | null;
        name?: string | null;
        price?: number | string | null;
      }>
    | null
    | undefined,
) {
  if (Array.isArray(product)) {
    return product[0] ?? null;
  }

  return product ?? null;
}

export async function listRecentAdminOrders(limit = 10) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, users(first_name, last_name, username, telegram_id)")
    .in("status", ["pending", "accepted", "preparing", "delivering"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Buyurtmalarni yuklab bo'lmadi");
  }

  return data ?? [];
}

export async function listOrdersForTelegramUser(telegramId: number, limit = 10) {
  const user = await getUserByTelegramId(telegramId);
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Buyurtmalarni yuklab bo'lmadi");
  }

  return data ?? [];
}

export async function listActiveOrdersForTelegramUser(telegramId: number) {
  const user = await getUserByTelegramId(telegramId);
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["pending", "accepted", "preparing", "delivering"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Faol buyurtmalarni yuklab bo'lmadi");
  }

  return data ?? [];
}

export async function getOrderWithUser(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, users(first_name, last_name, username, telegram_id)")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    throw new Error("Buyurtma topilmadi");
  }

  return data;
}

export async function getOrderForTelegramUser(telegramId: number, orderId: string) {
  const user = await getUserByTelegramId(telegramId);
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Buyurtma topilmadi");
  }

  return data;
}

export async function reorderOrderForTelegramUser(telegramId: number, orderId: string) {
  const user = await getUserByTelegramId(telegramId);
  const order = await getOrderForTelegramUser(telegramId, orderId);
  const items = Array.isArray(order.items) ? order.items : [];

  if (!items.length) {
    throw new Error("Qayta buyurtma uchun mahsulot topilmadi");
  }

  const { data: existingCartItems, error: existingCartError } = await supabase
    .from("carts")
    .select("product_id, quantity")
    .eq("user_id", user.id);

  if (existingCartError) {
    throw new Error("Savatchani tayyorlab bo'lmadi");
  }

  const cartMap = new Map(
    (existingCartItems ?? []).map((item) => [item.product_id, item.quantity]),
  );

  const payload = items.map((item: any) => ({
    product_id: item.product_id,
    quantity: (cartMap.get(item.product_id) ?? 0) + Number(item.quantity ?? 0),
    user_id: user.id,
  }));

  const { error } = await supabase.from("carts").upsert(payload, {
    onConflict: "user_id,product_id",
  });

  if (error) {
    throw new Error("Savatchaga qayta qo'shib bo'lmadi");
  }

  return order;
}

export async function getCartSummaryForTelegramUser(telegramId: number) {
  const user = await getUserByTelegramId(telegramId);
  const { data, error } = await supabase
    .from("carts")
    .select("id, product_id, quantity, products(id, name, price, image_url, is_available)")
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Savatchani yuklab bo'lmadi");
  }

  const items = (data ?? []).map((item) => ({
    ...item,
    products: normalizeProduct(item.products),
  }));
  const total = items.reduce(
    (sum, item) => sum + toNumber(item.products?.price) * item.quantity,
    0,
  );

  return {
    items,
    total,
  };
}

export async function getProductHighlights(limit = 5) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, image_url, description, categories(name)")
    .eq("is_available", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Mahsulotlarni yuklab bo'lmadi");
  }

  return data ?? [];
}

export async function getCategoryHighlights(limit = 6) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon, sort_order")
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error("Kategoriyalarni yuklab bo'lmadi");
  }

  return data ?? [];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const currentOrder = await getOrderWithUser(orderId);
  const previousStatus = currentOrder.status as OrderStatus;

  if (previousStatus === status) {
    return currentOrder;
  }

  const allowedStatuses = ORDER_TRANSITIONS[previousStatus] ?? [];
  if (allowedStatuses.length && !allowedStatuses.includes(status)) {
    throw new Error("Tanlangan statusga o'tib bo'lmaydi");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    throw new Error("Buyurtma holatini yangilab bo'lmadi");
  }

  return getOrderWithUser(orderId);
}
