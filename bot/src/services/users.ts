import { supabase } from "../lib/supabase";

export interface BotUserProfile {
  default_address?: string | null;
  first_name: string;
  id: string;
  last_name?: string | null;
  phone?: string | null;
  telegram_id: number;
  username?: string | null;
}

export async function upsertTelegramUser(input: {
  first_name: string;
  last_name?: string;
  telegram_id: number;
  username?: string;
}) {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        first_name: input.first_name,
        last_name: input.last_name ?? null,
        telegram_id: input.telegram_id,
        username: input.username ?? null,
      },
      {
        onConflict: "telegram_id",
      },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Foydalanuvchini saqlab bo'lmadi");
  }

  return data as BotUserProfile;
}

export async function getUserByTelegramId(telegramId: number) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (error || !data) {
    throw new Error("Foydalanuvchi topilmadi");
  }

  return data as BotUserProfile;
}

export async function updateBotUserProfile(
  telegramId: number,
  input: {
    default_address?: string;
    phone?: string;
  },
) {
  const { data, error } = await supabase
    .from("users")
    .update({
      ...(input.default_address !== undefined
        ? { default_address: input.default_address }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("telegram_id", telegramId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Profilni yangilab bo'lmadi");
  }

  return data as BotUserProfile;
}

export function isRegistered(user: Pick<BotUserProfile, "default_address" | "phone">) {
  return Boolean(user.phone && user.default_address);
}
