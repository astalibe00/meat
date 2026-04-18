import {
  BadgeCheck,
  ChevronRight,
  Heart,
  HelpCircle,
  MapPin,
  Package,
  RotateCcw,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/useApp";

export function ProfileScreen() {
  const navigate = useApp((state) => state.navigate);
  const favorites = useApp((state) => state.favorites);
  const orders = useApp((state) => state.orders);
  const checkout = useApp((state) => state.checkout);
  const cartCount = useApp((state) => state.cartCount());
  const resetDemoData = useApp((state) => state.resetDemoData);

  const initials = checkout.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FH";

  const items: { Icon: typeof Package; label: string; hint: string; onClick: () => void }[] = [
    {
      Icon: Package,
      label: "My orders",
      hint: orders.length > 0 ? `${orders.length} recent order${orders.length === 1 ? "" : "s"}` : "Track order status",
      onClick: () => navigate({ name: "orders" }),
    },
    {
      Icon: Heart,
      label: "Favorites",
      hint: favorites.length > 0 ? `${favorites.length} saved` : "Saved items",
      onClick: () => navigate({ name: "favorites" }),
    },
    {
      Icon: MapPin,
      label: "Delivery details",
      hint: checkout.address,
      onClick: () => navigate({ name: "checkout" }),
    },
    {
      Icon: ShoppingBag,
      label: "Current basket",
      hint: cartCount > 0 ? `${cartCount} item${cartCount === 1 ? "" : "s"} ready` : "Start a fresh order",
      onClick: () => navigate({ name: "cart" }),
    },
    {
      Icon: HelpCircle,
      label: "Help and support",
      hint: "Delivery, returns, Telegram bot",
      onClick: () => navigate({ name: "support" }),
    },
  ];

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Account</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mb-5">
        Welcome back
      </h1>

      <div className="bg-foreground text-background rounded-3xl p-5 relative overflow-hidden shadow-elevated">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/30 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary grid place-items-center font-serif font-semibold text-xl">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold">{checkout.name}</p>
            <p className="text-xs text-background/70">{checkout.phone}</p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat value={String(orders.length)} label="Orders" />
          <Stat value={String(favorites.length)} label="Saved" />
          <Stat value="Gold" label="Priority" icon />
        </div>
      </div>

      <div className="mt-5 bg-surface rounded-2xl shadow-card divide-y divide-border/60 overflow-hidden">
        {items.map(({ Icon, label, hint, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="tap w-full px-4 py-3.5 flex items-center gap-3 active:bg-paper transition-colors"
          >
            <span className="w-9 h-9 rounded-xl bg-primary-soft text-primary grid place-items-center">
              <Icon className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{hint}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          resetDemoData();
          toast.success("Demo data cleared");
        }}
        className="tap mt-4 w-full h-12 rounded-2xl bg-surface text-primary font-semibold text-sm shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
        Reset demo data
      </button>

      <div className="mt-4 rounded-2xl border border-border bg-paper p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="w-4 h-4 text-primary" strokeWidth={2.5} />
          Store preferences
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Orders use your saved contact and delivery details. Update them anytime during checkout.
        </p>
      </div>

      <p className="text-center text-[10px] text-muted-foreground font-medium tracking-[0.2em] uppercase mt-6">
        Fresh Halal Direct - App profile
      </p>
    </div>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: boolean }) {
  return (
    <div className="rounded-2xl bg-background/10 backdrop-blur p-3">
      <p className="font-serif text-lg font-semibold leading-none flex items-center justify-center gap-1">
        {icon && <BadgeCheck className="w-4 h-4 text-primary" strokeWidth={2.5} />}
        {value}
      </p>
      <p className="text-[10px] text-background/70 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
