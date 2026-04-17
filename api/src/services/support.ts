import { HttpError } from "../lib/errors";
import { isMissingTableError } from "../lib/optional-db";
import { notifyAdminsAboutSupportTicket } from "../lib/telegram-bot";
import { supabase } from "../lib/supabase";
import { getUserProfileById } from "./users";

export type SupportCategory =
  | "general"
  | "order_issue"
  | "payment"
  | "delivery"
  | "quality"
  | "wholesale";

function buildSoftTicketId() {
  return `T${Date.now().toString(36).toUpperCase()}`;
}

export async function createSupportTicket(input: {
  category: SupportCategory;
  details: string;
  orderId?: string;
  userId: string;
}) {
  const user = await getUserProfileById(input.userId);
  let ticketId = buildSoftTicketId();

  const insertResult = await supabase
    .from("support_tickets")
    .insert({
      category: input.category,
      details: input.details,
      order_id: input.orderId ?? null,
      status: "open",
      user_id: input.userId,
    })
    .select("id")
    .single();

  if (!insertResult.error && insertResult.data?.id) {
    ticketId = String(insertResult.data.id);
  } else if (!isMissingTableError(insertResult.error, "support_tickets")) {
    console.error("support_tickets insert failed:", insertResult.error);
  }

  notifyAdminsAboutSupportTicket({
    category: input.category,
    details: input.details,
    id: ticketId,
    order_id: input.orderId ?? null,
    user: {
      first_name: user.first_name,
      phone: user.phone ?? null,
      telegram_id: user.telegram_id,
      username: user.username ?? null,
    },
  }).catch((error) => {
    console.error("Support notification failed:", error);
  });

  return {
    category: input.category,
    id: ticketId,
    message: "Support so'rovi qabul qilindi",
    order_id: input.orderId ?? null,
    status: "open",
  };
}

export async function listSupportTicketsForUser(userId: string) {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (isMissingTableError(error, "support_tickets")) {
    return [];
  }

  if (error) {
    throw new HttpError(500, "Support so'rovlarini yuklashda xatolik");
  }

  return data ?? [];
}
