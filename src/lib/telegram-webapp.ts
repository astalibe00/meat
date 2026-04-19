export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramBackButton {
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick?: (callback: () => void) => void;
}

interface TelegramWebApp {
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
  };
  BackButton?: TelegramBackButton;
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setBackgroundColor?: (color: string) => void;
  setHeaderColor?: (color: string) => void;
  openLink?: (url: string) => void;
  openTelegramLink?: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.Telegram?.WebApp;
}

export function initTelegramWebApp() {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    return undefined;
  }

  webApp.ready();
  webApp.expand();
  webApp.disableVerticalSwipes?.();
  webApp.setBackgroundColor?.("#f5f0e8");
  webApp.setHeaderColor?.("#f5f0e8");

  return webApp;
}

export function getTelegramUser() {
  return getTelegramWebApp()?.initDataUnsafe?.user;
}

export function getTelegramUserName(user = getTelegramUser()) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
}

export function openTelegramLink(url: string) {
  const webApp = getTelegramWebApp();

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(url);
    return;
  }

  if (webApp?.openLink) {
    webApp.openLink(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
