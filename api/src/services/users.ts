import { HttpError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import type { TelegramUser } from "../lib/telegram";

export interface UserRecord {
  created_at: string;
  default_address?: string | null;
  first_name: string;
  id: string;
  last_name?: string | null;
  phone?: string | null;
  telegram_id: number;
  updated_at?: string | null;
  username?: string | null;
}

export async function upsertTelegramUser(user: TelegramUser) {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        first_name: user.first_name,
        last_name: user.last_name ?? null,
        telegram_id: user.id,
        username: user.username ?? null,
      },
      {
        onConflict: "telegram_id",
      },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new HttpError(500, "Foydalanuvchini saqlashda xatolik");
  }

  return data;
}

export function isUserRegistered(user: Pick<UserRecord, "default_address" | "phone">) {
  return Boolean(user.phone && user.default_address);
}

export function serializeUserProfile(
  user: UserRecord,
  options: { isAdmin: boolean; isRegistered: boolean },
) {
  return {
    created_at: user.created_at,
    default_address: user.default_address ?? null,
    first_name: user.first_name,
    id: user.id,
    is_admin: options.isAdmin,
    is_registered: options.isRegistered,
    last_name: user.last_name ?? null,
    phone: user.phone ?? null,
    telegram_id: user.telegram_id,
    updated_at: user.updated_at ?? null,
    username: user.username ?? null,
  };
}

export async function getUserProfileById(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new HttpError(404, "Foydalanuvchi topilmadi");
  }

  return data as UserRecord;
}

export async function updateUserProfile(
  userId: string,
  input: {
    default_address?: string;
    first_name?: string;
    phone?: string;
  },
) {
  const payload = {
    ...(input.default_address !== undefined
      ? { default_address: input.default_address }
      : {}),
    ...(input.first_name !== undefined ? { first_name: input.first_name } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new HttpError(500, "Profilni yangilashda xatolik");
  }

  return data as UserRecord;
}
