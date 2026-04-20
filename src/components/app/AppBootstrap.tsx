import { useEffect } from "react";
import { initTelegramWebApp } from "@/lib/telegram-webapp";
import { useApp } from "@/store/useApp";

export function AppBootstrap() {
  const bootstrapFromTelegram = useApp((state) => state.bootstrapFromTelegram);

  useEffect(() => {
    const webApp = initTelegramWebApp();
    void bootstrapFromTelegram(webApp?.initDataUnsafe?.user);
  }, [bootstrapFromTelegram]);

  return null;
}
