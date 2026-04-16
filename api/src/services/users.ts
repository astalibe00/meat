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

function isMissingColumnError(
  error: { code?: string | null; message?: string | null } | null,
  column: string,
) {
  return (
    error?.code === "PGRST204" &&
    Boolean(error.message?.includes(`'${column}' column`))
  );
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
  if (!Object.prototype.hasOwnProperty.call(user, "default_address")) {
    return Boolean(user.phone);
  }

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
  };

  let { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();

  if (isMissingColumnError(error, "default_address") && input.default_address !== undefined) {
    const fallbackPayload = {
      ...(input.first_name !== undefined ? { first_name: input.first_name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    };

    if (Object.keys(fallbackPayload).length === 0) {
      return getUserProfileById(userId);
    }

    const fallbackResult = await supabase
      .from("users")
      .update(fallbackPayload)
      .eq("id", userId)
      .select("*")
      .single();

    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error || !data) {
    throw new HttpError(500, "Profilni yangilashda xatolik");
  }

  return data as UserRecord;
}
