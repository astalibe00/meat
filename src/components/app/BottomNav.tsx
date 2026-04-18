import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";
import { useApp, Screen } from "@/store/useApp";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const tabs: { name: Screen["name"]; label: string; Icon: typeof Home }[] = [
  { name: "home", label: "Home", Icon: Home },
  { name: "categories", label: "Shop", Icon: LayoutGrid },
  { name: "search", label: "Search", Icon: Search },
  { name: "cart", label: "Cart", Icon: ShoppingBag },
  { name: "profile", label: "Account", Icon: User },
];

export function BottomNav() {
  const screen = useApp((s) => s.screen);
  const navigate = useApp((s) => s.navigate);
  const cartCount = useApp((s) => s.cartCount());
  const subtotal = useApp((s) => s.cartSubtotal());
  const [bump] = useBumpOnChange(cartCount);

  return (
    <nav className="absolute bottom-0 inset-x-0 bg-surface/95 backdrop-blur-xl border-t border-border/60 shadow-nav">
      <div className="grid grid-cols-5 px-2 pt-2 pb-3">
        {tabs.map(({ name, label, Icon }) => {
          const active = screen.name === name || (name === "categories" && screen.name === "product");
          const isCart = name === "cart";
          const cartLabel = isCart && subtotal > 0 ? `$${subtotal.toFixed(0)}` : label;
          return (
            <button
              key={name}
              onClick={() => navigate({ name } as Screen)}
              className="tap flex flex-col items-center gap-1 py-1 active:scale-95 transition-transform"
              aria-label={label}
            >
              <span
                className={cn(
                  "relative grid place-items-center w-8 h-7 transition-colors",
                  active ? "text-primary" : "text-foreground/55"
                )}
              >
                <Icon
                  className={cn("w-[22px] h-[22px]", bump && isCart && "animate-bump")}
                  strokeWidth={active ? 2.5 : 2}
                  fill={active && (name === "home" || name === "cart" || name === "profile") ? "currentColor" : "none"}
                />
                {isCart && cartCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-sale text-destructive-foreground text-[10px] font-bold tabular-nums ring-2 ring-surface",
                      bump && "animate-pop"
                    )}
                  >
                    {cartCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none tabular-nums transition-colors",
                  active ? "text-primary" : "text-foreground/55"
                )}
              >
                {cartLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function useBumpOnChange(value: number): [boolean, (v: boolean) => void] {
  const [bump, setBump] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current && value > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 400);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);
  return [bump, setBump];
}
