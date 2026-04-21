import { Bell, ChevronDown, MapPin } from "lucide-react";
import { useApp } from "@/store/useApp";

export function TopHeader() {
  const navigate = useApp((state) => state.navigate);
  const checkout = useApp((state) => state.checkout);
  const pickupPoints = useApp((state) => state.pickupPoints);
  const notifications = useApp((state) => state.notifications);
  const activePickupPoint = pickupPoints.find((point) => point.id === checkout.pickupPointId);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const addressLabel =
    checkout.fulfillmentType === "pickup"
      ? activePickupPoint?.title ?? "Tarqatish punkti"
      : checkout.address.split(",")[0]?.trim() || "Manzil";

  return (
    <header className="h-[calc(56px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-surface px-4 flex items-center justify-between border-b border-border/50">
      <button
        onClick={() => navigate({ name: "addresses" })}
        className="tap flex items-center gap-2 active:scale-95 transition-transform"
      >
        <span className="w-8 h-8 rounded-full bg-primary-soft text-primary grid place-items-center">
          <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
        </span>
        <div className="flex flex-col leading-none text-left">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {checkout.fulfillmentType === "pickup" ? "Olib ketish" : "Yetkazish"}
          </span>
          <span className="text-xs font-bold flex items-center gap-1 mt-0.5">
            {addressLabel}
            <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
          </span>
        </div>
      </button>
      <div className="flex items-center">
        <span className="font-serif text-[13px] font-semibold tracking-[0.18em] uppercase">
          Fresh Halal
        </span>
      </div>
      <button
        onClick={() => navigate({ name: "notifications" })}
        className="tap relative w-9 h-9 grid place-items-center rounded-full bg-paper active:scale-95 transition-transform"
        aria-label="Xabarlar"
      >
        <Bell className="w-4 h-4" strokeWidth={2.25} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] rounded-full bg-sale px-1 text-[10px] font-bold text-white grid place-items-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </header>
  );
}
