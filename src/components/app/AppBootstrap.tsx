import { useEffect } from "react";
import { initTelegramWebApp } from "@/lib/telegram-webapp";
import { useApp } from "@/store/useApp";

export function AppBootstrap() {
  const bootstrapFromTelegram = useApp((state) => state.bootstrapFromTelegram);
  const repeatOrder = useApp((state) => state.repeatOrder);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const webApp = initTelegramWebApp();
      await bootstrapFromTelegram(webApp?.initDataUnsafe?.user);
      if (cancelled) {
        return;
      }

      const repeatOrderId = new URLSearchParams(window.location.search).get("repeatOrder");
      if (repeatOrderId) {
        repeatOrder(repeatOrderId);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [bootstrapFromTelegram, repeatOrder]);

  return null;
}
