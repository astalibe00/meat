import { Bell, ChevronDown, MapPin } from "lucide-react";
import { useApp } from "@/store/useApp";

export function StatusBar() {
  return (
    <div className="h-5 bg-surface flex items-center justify-between px-5 text-[11px] font-semibold text-foreground select-none">
      <span className="tabular-nums">9:41</span>
      <div className="flex items-center gap-1">
        <span className="inline-block w-3 h-2 rounded-sm bg-foreground/85" />
        <span className="inline-block w-3 h-2 rounded-sm bg-foreground/85" />
        <span className="inline-block w-5 h-2 rounded-sm border border-foreground/85" />
      </div>
    </div>
  );
}

export function TopHeader() {
  const navigate = useApp((state) => state.navigate);
  const checkout = useApp((state) => state.checkout);

  return (
    <header className="h-14 bg-surface px-4 flex items-center justify-between border-b border-border/50">
      <button
        onClick={() => navigate({ name: "checkout" })}
        className="tap flex items-center gap-2 active:scale-95 transition-transform"
      >
        <span className="w-8 h-8 rounded-full bg-primary-soft text-primary grid place-items-center">
          <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
        </span>
        <div className="flex flex-col leading-none text-left">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Deliver to
          </span>
          <span className="text-xs font-bold flex items-center gap-1 mt-0.5">
            {checkout.address.split(",")[0]}
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
        onClick={() => navigate({ name: "orders" })}
        className="tap relative w-9 h-9 grid place-items-center rounded-full bg-paper active:scale-95 transition-transform"
        aria-label="Orders"
      >
        <Bell className="w-4 h-4" strokeWidth={2.25} />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-sale" />
      </button>
    </header>
  );
}
