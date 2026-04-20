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
  const supportContact = useApp((state) => state.supportContact);
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
      label: "Buyurtmalarim",
      hint: orders.length > 0 ? `${orders.length} ta buyurtma` : "Buyurtma holatini kuzatish",
      onClick: () => navigate({ name: "orders" }),
    },
    {
      Icon: Heart,
      label: "Sevimlilar",
      hint: favorites.length > 0 ? `${favorites.length} ta saqlangan` : "Saqlangan mahsulotlar",
      onClick: () => navigate({ name: "favorites" }),
    },
    {
      Icon: MapPin,
      label: "Yetkazish ma'lumoti",
      hint:
        checkout.fulfillmentType === "pickup"
          ? "Tarqatish punkti"
          : checkout.address || "Alohida sozlash oynasi",
      onClick: () => navigate({ name: "addresses" }),
    },
    {
      Icon: ShoppingBag,
      label: "Joriy savat",
      hint: cartCount > 0 ? `${cartCount} ta mahsulot tayyor` : "Yangi buyurtma boshlash",
      onClick: () => navigate({ name: "cart" }),
    },
    {
      Icon: HelpCircle,
      label: "Yordam bo'limi",
      hint: "Yetkazish, qaytarish, Telegram bot",
      onClick: () => navigate({ name: "support" }),
    },
  ];

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Profil</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mb-5">
        Xush kelibsiz
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
          <Stat value={String(orders.length)} label="Buyurtma" />
          <Stat value={String(favorites.length)} label="Saqlangan" />
          <Stat value="Faol" label="Holat" icon />
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
          toast.success("Demo ma'lumotlari tozalandi");
        }}
        className="tap mt-4 w-full h-12 rounded-2xl bg-surface text-primary font-semibold text-sm shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
        Demo ma'lumotlarini tozalash
      </button>

      <div className="mt-4 rounded-2xl border border-border bg-paper p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="w-4 h-4 text-primary" strokeWidth={2.5} />
          Do'kon sozlamalari
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Buyurtmalarda saqlangan kontakt va manzil ma'lumotlari ishlatiladi. Ularni alohida profil bo'limida yangilaysiz.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-paper p-4">
        <p className="text-sm font-semibold">Support</p>
        <p className="text-xs text-muted-foreground mt-1.5">
          Telefon: {supportContact.phone}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Telegram: {supportContact.telegram.replace("https://", "")}
        </p>
      </div>

      <p className="text-center text-[10px] text-muted-foreground font-medium tracking-[0.2em] uppercase mt-6">
        Fresh Halal Direct - Profil
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
