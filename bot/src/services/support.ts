import { isMissingTableError } from "../lib/optional-db";
import { supabase } from "../lib/supabase";
import { getUserByTelegramId } from "./users";

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

export async function createSupportRequest(input: {
  category: string;
  details: string;
  orderId?: string;
  telegramId: number;
}) {
  const user = await getUserByTelegramId(input.telegramId);
  let ticketId = buildSoftTicketId();

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      category: input.category,
      details: input.details,
      order_id: input.orderId ?? null,
      status: "open",
      user_id: user.id,
    })
    .select("id")
    .single();

  if (!error && data?.id) {
    ticketId = String(data.id);
  } else if (!isMissingTableError(error, "support_tickets")) {
    console.error("support_tickets insert failed:", error);
  }

  return {
    category: input.category,
    details: input.details,
    id: ticketId,
    order_id: input.orderId ?? null,
    user,
  };
}
