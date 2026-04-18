import { BottomNav } from "@/components/app/BottomNav";
import { StatusBar, TopHeader } from "@/components/app/Chrome";
import { CartScreen } from "@/screens/CartScreen";
import { CategoriesScreen } from "@/screens/CategoriesScreen";
import { CheckoutScreen } from "@/screens/CheckoutScreen";
import { FavoritesScreen } from "@/screens/FavoritesScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { OrdersScreen } from "@/screens/OrdersScreen";
import { ProductDetailScreen } from "@/screens/ProductDetailScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { SupportScreen } from "@/screens/SupportScreen";
import { useApp, type Screen } from "@/store/useApp";

const HEADER_HIDDEN_SCREENS = new Set(["product"] as const);

const HEADER_OFFSET = 20;
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
      case "support":
        return <SupportScreen />;
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
    <div className="min-h-screen w-full bg-white flex items-center justify-center sm:p-4">
      <div className="relative w-full max-w-[430px] h-screen sm:h-[920px] sm:max-h-[920px] sm:rounded-[44px] overflow-hidden bg-background shadow-elevated sm:border sm:border-border">
        <StatusBar />
        {!hideHeader && <TopHeader />}

        <main
          key={screenKey(screen)}
          className="absolute inset-0 overflow-y-auto no-scrollbar"
          style={{
            top: hideHeader ? `${HEADER_OFFSET}px` : `${HEADER_OFFSET + HEADER_HEIGHT}px`,
            bottom: `${NAV_HEIGHT}px`,
          }}
        >
          {renderScreen()}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
