import { useApp } from "@/store/useApp";
import { StatusBar, TopHeader } from "@/components/app/Chrome";
import { BottomNav } from "@/components/app/BottomNav";
import { HomeScreen } from "@/screens/HomeScreen";
import { CategoriesScreen } from "@/screens/CategoriesScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { CartScreen } from "@/screens/CartScreen";
import { ProductDetailScreen } from "@/screens/ProductDetailScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { FavoritesScreen } from "@/screens/FavoritesScreen";

const Index = () => {
  const screen = useApp((s) => s.screen);

  const renderScreen = () => {
    switch (screen.name) {
      case "home": return <HomeScreen />;
      case "categories": return <CategoriesScreen />;
      case "search": return <SearchScreen />;
      case "cart": return <CartScreen />;
      case "product": return <ProductDetailScreen />;
      case "profile": return <ProfileScreen />;
      case "favorites": return <FavoritesScreen />;
      default: return <HomeScreen />;
    }
  };

  const isProductDetail = screen.name === "product";

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center sm:p-4">
      {/* Phone frame */}
      <div className="relative w-full max-w-[430px] h-screen sm:h-[920px] sm:max-h-[920px] sm:rounded-[44px] overflow-hidden bg-background shadow-elevated sm:border sm:border-border">
        {/* Status bar */}
        <StatusBar />

        {/* Top header — hidden on product detail */}
        {!isProductDetail && <TopHeader />}

        {/* Scrollable content */}
        <main
          key={screen.name + (screen.name === "product" ? screen.id : "")}
          className="absolute inset-0 overflow-y-auto no-scrollbar"
          style={{
            top: isProductDetail ? "20px" : "calc(20px + 56px)",
            bottom: "68px",
          }}
        >
          {renderScreen()}
        </main>

        {/* Bottom navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default Index;
