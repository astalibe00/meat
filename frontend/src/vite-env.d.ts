/// <reference types="vite/client" />

declare global {
  const __API_BASE_URL__: string;
  const __DEV_TELEGRAM_ID__: string;
  const __SUPABASE_ANON_KEY__: string;
  const __SUPABASE_URL__: string;

  interface Window {
    Telegram?: {
      WebApp?: typeof import("@twa-dev/sdk").default;
    };
  }
}

export {};
