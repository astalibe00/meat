import { ChevronRight, MapPin, Package, Heart, Settings, HelpCircle, LogOut, BadgeCheck } from "lucide-react";
import { useApp } from "@/store/useApp";

export function ProfileScreen() {
  const navigate = useApp((s) => s.navigate);
  const favCount = useApp((s) => s.favorites.length);

  const items: { Icon: typeof Package; label: string; hint: string; onClick?: () => void }[] = [
    { Icon: Package, label: "My orders", hint: "Track & history" },
    { Icon: Heart, label: "Favorites", hint: favCount > 0 ? `${favCount} saved` : "Saved items", onClick: () => navigate({ name: "favorites" }) },
    { Icon: MapPin, label: "Addresses", hint: "2 saved" },
    { Icon: Settings, label: "Preferences", hint: "Notifications, language" },
    { Icon: HelpCircle, label: "Help & support", hint: "FAQ & contact" },
  ];

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Account</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mb-5">
        Hello, Ahmed
      </h1>

      {/* Profile card */}
      <div className="bg-foreground text-background rounded-3xl p-5 relative overflow-hidden shadow-elevated">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/30 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary grid place-items-center font-serif font-semibold text-xl">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold">Ahmed Hassan</p>
            <p className="text-xs text-background/70">ahmed@example.com</p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat value="12" label="Orders" />
          <Stat value="$284" label="Saved" />
          <Stat value="Gold" label="Tier" icon />
        </div>
      </div>

      {/* Menu */}
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
              <p className="text-[11px] text-muted-foreground">{hint}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
          </button>
        ))}
      </div>

      {/* Sign out */}
      <button className="tap mt-4 w-full h-12 rounded-2xl bg-surface text-sale font-semibold text-sm shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
        <LogOut className="w-4 h-4" strokeWidth={2.5} />
        Sign out
      </button>

      <p className="text-center text-[10px] text-muted-foreground font-medium tracking-[0.2em] uppercase mt-6">
        Qoriev's · v1.0
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
