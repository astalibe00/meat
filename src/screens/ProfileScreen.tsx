import { BadgeCheck, ChevronRight, Heart, HelpCircle, MapPin, Package } from "lucide-react";
import { getCustomerSegment } from "@/lib/customer-intelligence";
import { formatCurrency } from "@/lib/format";
import { useApp } from "@/store/useApp";

export function ProfileScreen() {
  const navigate = useApp((state) => state.navigate);
  const favorites = useApp((state) => state.favorites);
  const orders = useApp((state) => state.orders);
  const checkout = useApp((state) => state.checkout);
  const supportContact = useApp((state) => state.supportContact);
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
  const totalSpent = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const segment = getCustomerSegment(orders.length, totalSpent, orders[0]?.createdAt);
  const initials =
    checkout.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "FH";

  const items = [
    {
      Icon: Package,
      label: "Buyurtmalar",
      hint: orders.length > 0 ? `${orders.length} ta buyurtma` : "Tracking va qayta buyurtma",
      onClick: () => navigate({ name: "orders" }),
    },
    {
      Icon: MapPin,
      label: "Manzil",
      hint:
        checkout.fulfillmentType === "pickup"
          ? "Tarqatish punkti"
          : checkout.address || "Yetkazish ma'lumotlari",
      onClick: () => navigate({ name: "addresses" }),
    },
    {
      Icon: Heart,
      label: "Sevimlilar",
      hint: favorites.length > 0 ? `${favorites.length} ta mahsulot` : "Saqlangan mahsulotlar",
      onClick: () => navigate({ name: "favorites" }),
    },
    {
      Icon: HelpCircle,
      label: "Support",
      hint: supportContact.telegram.replace("https://", ""),
      onClick: () => navigate({ name: "support" }),
    },
  ];

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Profil</p>
      <h1 className="mt-0.5 font-serif text-[26px] leading-tight font-semibold tracking-tight">
        Hisob
      </h1>

      <div className="mt-5 rounded-2xl bg-foreground p-5 text-background shadow-elevated">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary font-serif text-xl font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold">{checkout.name}</p>
            <p className="mt-1 text-xs text-background/70">{checkout.phone || "Telefon ulanmagan"}</p>
          </div>
          <BadgeCheck className="h-5 w-5 text-primary" strokeWidth={2.5} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat value={String(orders.length)} label="Buyurtma" />
          <Stat value={String(favorites.length)} label="Sevimli" />
          <Stat value={segment.toUpperCase()} label="Status" />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-surface shadow-card">
        {items.map(({ Icon, label, hint, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="tap flex w-full items-center gap-3 border-b border-border/60 px-4 py-3.5 text-left last:border-b-0 active:bg-paper transition-colors"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <Icon className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{label}</p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{hint}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-paper p-4">
        <p className="text-sm font-bold">Minimal loyalty</p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          To'langan buyurtmalar: {paidOrders.length} • Jami xarid: {formatCurrency(totalSpent)}
        </p>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-background/10 p-3">
      <p className="font-serif text-base font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-background/70">{label}</p>
    </div>
  );
}
