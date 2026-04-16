import WebApp from "@twa-dev/sdk";
import { clientEnv } from "./env";

interface TelegramLaunchData {
  isTelegram: boolean;
  startParam?: string;
  user?: {
    first_name?: string;
    id: number;
    last_name?: string;
    username?: string;
  };
}

function hexToRgbTriplet(hex: string, fallback: string) {
  const normalized = hex.trim().replace("#", "");

  if (![3, 6].includes(normalized.length)) {
    return fallback;
  }

  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  if ([red, green, blue].some((item) => Number.isNaN(item))) {
    return fallback;
  }

  return `${red} ${green} ${blue}`;
}

function getTelegramWebApp() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.Telegram?.WebApp ?? WebApp;
}

export function applyTelegramTheme() {
  const webApp = getTelegramWebApp();
  const theme = webApp?.themeParams;

  if (!theme || typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.style.setProperty(
    "--color-bg-main",
    hexToRgbTriplet(theme.bg_color ?? "#F5F5F0", "245 245 240"),
  );
  root.style.setProperty(
    "--color-surface",
    hexToRgbTriplet(theme.secondary_bg_color ?? "#FFFFFF", "255 255 255"),
  );
  root.style.setProperty(
    "--color-text-primary",
    hexToRgbTriplet(theme.text_color ?? "#1A1A1A", "26 26 26"),
  );
  root.style.setProperty(
    "--color-text-secondary",
    hexToRgbTriplet(theme.hint_color ?? "#6B6B6B", "107 107 107"),
  );
}

export function buildTelegramAuthorizationHeader() {
  const webApp = getTelegramWebApp();
  const initData = webApp?.initData?.trim();

  if (initData) {
    return `TelegramWebApp ${initData}`;
  }

  if (clientEnv.devTelegramId) {
    return `TelegramWebApp dev:${clientEnv.devTelegramId}`;
  }

  return undefined;
}

export function canUseProtectedApi() {
  return Boolean(buildTelegramAuthorizationHeader());
}

export function initializeTelegram(): TelegramLaunchData {
  const webApp = getTelegramWebApp();

  if (webApp) {
    webApp.ready();
    webApp.expand();
    applyTelegramTheme();
  }

  const startParam =
    webApp?.initDataUnsafe?.start_param ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("startapp") ?? undefined
      : undefined);

  const user = webApp?.initDataUnsafe?.user
    ? {
        first_name: webApp.initDataUnsafe.user.first_name,
        id: webApp.initDataUnsafe.user.id,
        last_name: webApp.initDataUnsafe.user.last_name,
        username: webApp.initDataUnsafe.user.username,
      }
    : undefined;

  return {
    isTelegram: Boolean(webApp?.initData),
    startParam,
    user,
  };
}
