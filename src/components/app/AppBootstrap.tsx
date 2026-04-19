import { useEffect } from "react";
import { DEFAULT_PROFILE_NAME, useApp } from "@/store/useApp";
import { getTelegramUserName, initTelegramWebApp } from "@/lib/telegram-webapp";

export function AppBootstrap() {
  const checkoutName = useApp((state) => state.checkout.name);
  const updateCheckout = useApp((state) => state.updateCheckout);

  useEffect(() => {
    const webApp = initTelegramWebApp();
    const telegramName = getTelegramUserName(webApp?.initDataUnsafe?.user);

    if (!telegramName) {
      return;
    }

    if (!checkoutName.trim() || checkoutName === DEFAULT_PROFILE_NAME) {
      updateCheckout({ name: telegramName });
    }
  }, [checkoutName, updateCheckout]);

  return null;
}
