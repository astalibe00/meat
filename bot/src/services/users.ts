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

function isMissingColumnError(
  error: { code?: string | null; message?: string | null } | null,
  column: string,
) {
  return (
    error?.code === "PGRST204" &&
    Boolean(error.message?.includes(`'${column}' column`))
  );
}

export function supportsDefaultAddress(user: BotUserProfile) {
  return Object.prototype.hasOwnProperty.call(user, "default_address");
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
    console.error("upsertTelegramUser failed:", {
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      message: error?.message,
    });
    throw new Error(error?.message || "Foydalanuvchini saqlab bo'lmadi");
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
    console.error("getUserByTelegramId failed:", {
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      message: error?.message,
    });
    throw new Error(error?.message || "Foydalanuvchi topilmadi");
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
  const payload = {
    ...(input.default_address !== undefined
      ? { default_address: input.default_address }
      : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
  };

  let { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("telegram_id", telegramId)
    .select("*")
    .single();

  if (isMissingColumnError(error, "default_address") && input.default_address !== undefined) {
    const fallbackPayload = {
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    };

    if (Object.keys(fallbackPayload).length === 0) {
      return getUserByTelegramId(telegramId);
    }

    const fallbackResult = await supabase
      .from("users")
      .update(fallbackPayload)
      .eq("telegram_id", telegramId)
      .select("*")
      .single();

    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error || !data) {
    console.error("updateBotUserProfile failed:", {
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      message: error?.message,
    });
    throw new Error(error?.message || "Profilni yangilab bo'lmadi");
  }

  return data as BotUserProfile;
}

export function isRegistered(user: Pick<BotUserProfile, "default_address" | "phone">) {
  if (!Object.prototype.hasOwnProperty.call(user, "default_address")) {
    return Boolean(user.phone);
  }

  return Boolean(user.phone && user.default_address);
}
