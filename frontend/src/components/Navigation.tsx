import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchCart, queryKeys } from "../lib/queries";

const icons: Record<string, string> = {
  "/": "⌂",
  "/cart": "◔",
  "/orders": "≡",
  "/products": "▦",
};

export default function Navigation() {
  const location = useLocation();
  const canAccessCart = canUseProtectedApi();
  const cartQuery = useQuery({
    enabled: canAccessCart,
    queryFn: fetchCart,
    queryKey: queryKeys.cart,
    retry: false,
    staleTime: 30_000,
  });

  const itemCount =
    cartQuery.data?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const items = [
    { label: "Asosiy", path: "/" },
    { label: "Mahsulotlar", path: "/products" },
    { label: "Savatcha", path: "/cart", badge: itemCount },
    { label: "Buyurtmalar", path: "/orders" },
  ];

  return (
    <nav className="nav-shell fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 items-center justify-around px-2 py-2">
      {items.map((item) => {
        const isActive =
          item.path === "/"
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

        return (
          <Link
            className="relative flex min-w-[72px] flex-col items-center rounded-xl px-3 py-2 text-xs font-semibold"
            key={item.path}
            to={item.path}
          >
            {isActive ? (
              <motion.span
                className="absolute inset-0 rounded-xl bg-primary/10"
                layoutId="nav-indicator"
              />
            ) : null}
            <span className={`relative z-10 text-sm ${isActive ? "text-primary" : "text-textSecondary"}`}>
              {icons[item.path]}
            </span>
            <span className={`relative z-10 mt-1 ${isActive ? "text-primary" : "text-textSecondary"}`}>
              {item.label}
            </span>
            {item.badge ? (
              <span className="absolute right-2 top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
