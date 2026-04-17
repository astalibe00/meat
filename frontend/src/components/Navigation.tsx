import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { fetchCart, queryKeys } from "../lib/queries";
import { canUseProtectedApi } from "../lib/telegram";

function NavIcon({ active, path }: { active: boolean; path: string }) {
  const className = active ? "text-primary" : "text-textSecondary";

  if (path === "/") {
    return (
      <svg className={className} fill="none" height="20" viewBox="0 0 24 24" width="20">
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (path === "/products") {
    return (
      <svg className={className} fill="none" height="20" viewBox="0 0 24 24" width="20">
        <path
          d="M6 6h12M6 12h12M6 18h7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <circle cx="17.5" cy="17.5" r="1.4" fill="currentColor" />
      </svg>
    );
  }

  if (path === "/cart") {
    return (
      <svg className={className} fill="none" height="20" viewBox="0 0 24 24" width="20">
        <path
          d="M4.5 6h1.7l1.4 8.1a1 1 0 0 0 1 .9h7.8a1 1 0 0 0 1-.8L19 8H8.1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <circle cx="10" cy="19" fill="currentColor" r="1.2" />
        <circle cx="17" cy="19" fill="currentColor" r="1.2" />
      </svg>
    );
  }

  if (path === "/orders") {
    return (
      <svg className={className} fill="none" height="20" viewBox="0 0 24 24" width="20">
        <path
          d="M7 5.5h10M7 10h10M7 14.5h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <rect height="16" rx="3" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="4" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" height="20" viewBox="0 0 24 24" width="20">
      <circle cx="12" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 19a5.5 5.5 0 0 1 11 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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

  const itemCount = cartQuery.data?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const items = [
    { label: "Asosiy", path: "/" },
    { label: "Katalog", path: "/products" },
    { badge: itemCount, label: "Savat", path: "/cart" },
    { label: "Buyurtma", path: "/orders" },
    { label: "Kabinet", path: "/profile" },
  ];

  return (
    <nav className="nav-shell fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 items-center justify-between px-2 py-2">
      {items.map((item) => {
        const isActive =
          item.path === "/"
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

        return (
          <Link
            className="relative flex min-w-[62px] flex-1 flex-col items-center rounded-[20px] px-2 py-2.5 text-[11px] font-semibold"
            key={item.path}
            to={item.path}
          >
            {isActive ? (
              <motion.span
                className="absolute inset-0 rounded-[20px] bg-primary/10"
                layoutId="nav-indicator"
              />
            ) : null}
            <span className="relative z-10">
              <NavIcon active={isActive} path={item.path} />
            </span>
            <span className={`relative z-10 mt-1 ${isActive ? "text-primary" : "text-textSecondary"}`}>
              {item.label}
            </span>
            {item.badge ? (
              <span className="absolute right-2 top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
