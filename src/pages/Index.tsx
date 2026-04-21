import React from "react";
import { Smartphone } from "lucide-react";
import { AddressesScreen } from "@/screens/AddressesScreen";
import { BottomNav } from "@/components/app/BottomNav";
import { TopHeader } from "@/components/app/Chrome";
import { CartScreen } from "@/screens/CartScreen";
import { CategoriesScreen } from "@/screens/CategoriesScreen";
import { CheckoutScreen } from "@/screens/CheckoutScreen";
import { FavoritesScreen } from "@/screens/FavoritesScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { NotificationsScreen } from "@/screens/NotificationsScreen";
import { OrdersScreen } from "@/screens/OrdersScreen";
import { ProductDetailScreen } from "@/screens/ProductDetailScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { SupportScreen } from "@/screens/SupportScreen";
import { getTelegramWebApp } from "@/lib/telegram-webapp";
import { useApp, type Screen } from "@/store/useApp";

const HEADER_HIDDEN_SCREENS = new Set(["product"] as const);

const HEADER_HEIGHT = 56;
const NAV_HEIGHT = 68;

const screenKey = (screen: Screen) => {
  switch (screen.name) {
    case "product":
      return `${screen.name}:${screen.id}`;
    case "categories":
      return `${screen.name}:${screen.category ?? "all"}:${screen.saleOnly ? "sale" : "all"}:${screen.sort ?? "popular"}`;
    default:
      return screen.name;
  }
};

export default function Index() {
  const screen = useApp((state) => state.screen);
  const historyLength = useApp((state) => state.history.length);
  const back = useApp((state) => state.back);

  React.useEffect(() => {
    const backButton = getTelegramWebApp()?.BackButton;
    if (!backButton) {
      return;
    }

    const handleBack = () => back();
    if (historyLength > 0) {
      backButton.show();
      backButton.onClick(handleBack);
      return () => backButton.offClick?.(handleBack);
    }

    backButton.hide();
    return undefined;
  }, [back, historyLength]);

  const renderScreen = () => {
    switch (screen.name) {
      case "home":
        return <HomeScreen />;
      case "categories":
        return <CategoriesScreen />;
      case "search":
        return <SearchScreen />;
      case "cart":
        return <CartScreen />;
      case "checkout":
        return <CheckoutScreen />;
      case "orders":
        return <OrdersScreen />;
      case "notifications":
        return <NotificationsScreen />;
      case "support":
        return <SupportScreen />;
      case "addresses":
        return <AddressesScreen />;
      case "product":
        return <ProductDetailScreen />;
      case "profile":
        return <ProfileScreen />;
      case "favorites":
        return <FavoritesScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const hideHeader = HEADER_HIDDEN_SCREENS.has(screen.name as "product");

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="mobile-lock hidden sm:flex fixed inset-0 bg-foreground/88 backdrop-blur-xl z-50 items-center justify-center p-6">
        <div className="max-w-sm rounded-[32px] bg-surface p-6 text-center shadow-elevated">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary-soft text-primary grid place-items-center">
            <Smartphone className="w-7 h-7" strokeWidth={2.2} />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-semibold">Mini App faqat mobile uchun</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Telegram Mini App portret holatda ochilishi kerak. Telefoningizda qayta oching.
          </p>
        </div>
      </div>

      <div className="orientation-lock hidden landscape:flex fixed inset-0 bg-foreground/88 backdrop-blur-xl z-40 items-center justify-center p-6 sm:hidden">
        <div className="max-w-sm rounded-[32px] bg-surface p-6 text-center shadow-elevated">
          <h2 className="font-serif text-2xl font-semibold">Portret holatga o'ting</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Mini App faqat vertical ko'rinishda ishlaydi.
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-[430px] h-screen overflow-hidden bg-background shadow-elevated">
        {!hideHeader && <TopHeader />}

        <main
          key={screenKey(screen)}
          className="absolute inset-0 overflow-y-auto no-scrollbar"
          style={{
            top: hideHeader
              ? "env(safe-area-inset-top)"
              : `calc(${HEADER_HEIGHT}px + env(safe-area-inset-top))`,
            bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
          }}
        >
          {renderScreen()}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
