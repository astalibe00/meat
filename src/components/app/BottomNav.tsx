import { useEffect, useRef, useState } from "react";
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, type Screen } from "@/store/useApp";

const tabs: { name: Screen["name"]; label: string; Icon: typeof Home }[] = [
  { name: "home", label: "Bosh sahifa", Icon: Home },
  { name: "categories", label: "Do'kon", Icon: LayoutGrid },
  { name: "search", label: "Qidiruv", Icon: Search },
  { name: "cart", label: "Savat", Icon: ShoppingBag },
  { name: "profile", label: "Profil", Icon: User },
];

export function BottomNav() {
  const screen = useApp((state) => state.screen);
  const navigate = useApp((state) => state.navigate);
  const cartCount = useApp((state) => state.cartCount());
  const [bump] = useBumpOnChange(cartCount);

  const isTabActive = (name: Screen["name"]) => {
    if (name === "categories") {
      return screen.name === "categories" || screen.name === "product";
    }

    if (name === "cart") {
      return screen.name === "cart" || screen.name === "checkout";
    }

    if (name === "profile") {
      return (
        screen.name === "profile" ||
        screen.name === "addresses" ||
        screen.name === "favorites" ||
        screen.name === "orders" ||
        screen.name === "support"
      );
    }

    return screen.name === name;
  };

  return (
    <nav className="absolute bottom-0 inset-x-0 bg-surface/95 backdrop-blur-xl border-t border-border/60 shadow-nav">
      <div className="grid grid-cols-5 px-2 pt-2 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {tabs.map(({ name, label, Icon }) => {
          const active = isTabActive(name);
          const isCart = name === "cart";
          const target = { name } as Screen;

          return (
            <button
              key={name}
              onClick={() => navigate(target)}
              className="tap flex flex-col items-center gap-1 py-1 active:scale-95 transition-transform"
              aria-label={label}
            >
              <span
                className={cn(
                  "relative grid place-items-center w-8 h-7 transition-colors",
                  active ? "text-primary" : "text-foreground/55",
                )}
              >
                <Icon
                  className={cn("w-[22px] h-[22px]", bump && isCart && "animate-bump")}
                  strokeWidth={active ? 2.5 : 2}
                  fill={
                    active && (name === "home" || name === "cart" || name === "profile")
                      ? "currentColor"
                      : "none"
                  }
                />
                {isCart && cartCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-sale text-destructive-foreground text-[10px] font-bold tabular-nums ring-2 ring-surface",
                      bump && "animate-pop",
                    )}
                  >
                    {cartCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none tabular-nums transition-colors",
                  active ? "text-primary" : "text-foreground/55",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function useBumpOnChange(value: number): [boolean, (value: boolean) => void] {
  const [bump, setBump] = useState(false);
  const previous = useRef(value);

  useEffect(() => {
    if (value !== previous.current && value > previous.current) {
      setBump(true);
      const timer = window.setTimeout(() => setBump(false), 400);
      previous.current = value;
      return () => window.clearTimeout(timer);
    }

    previous.current = value;
    return undefined;
  }, [value]);

  return [bump, setBump];
}
