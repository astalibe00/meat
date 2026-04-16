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

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
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
