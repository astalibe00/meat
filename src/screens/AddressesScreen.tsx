import { MapPin, Navigation, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/useApp";

export function AddressesScreen() {
  const checkout = useApp((state) => state.checkout);
  const pickupPoints = useApp((state) => state.pickupPoints);
  const setFulfillmentType = useApp((state) => state.setFulfillmentType);
  const selectPickupPoint = useApp((state) => state.selectPickupPoint);
  const updateCheckout = useApp((state) => state.updateCheckout);
  const detectCurrentLocation = useApp((state) => state.detectCurrentLocation);
  const saveProfile = useApp((state) => state.saveProfile);
  const navigate = useApp((state) => state.navigate);

  const handleLocate = async () => {
    const result = await detectCurrentLocation();
    if (!result.ok) {
      toast.error(result.error ?? "Manzil aniqlanmadi.");
      return;
    }

    toast.success("Manzil yangilandi.");
  };

  const handleSave = async () => {
    const ok = await saveProfile();
    if (!ok) {
      toast.error("Avval Telegram bot orqali Mini App'ni oching.");
      return;
    }

    toast.success("Yetkazib berish ma'lumotlari saqlandi.");
    navigate({ name: "profile" });
  };

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Profil</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
        Yetkazib berish ma'lumoti
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Bu bo'lim checkout oynasidan alohida ishlaydi va profil uchun saqlanadi.
      </p>

      <div className="mt-5 rounded-2xl bg-surface p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Yetkazish usuli
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Card
            selected={checkout.fulfillmentType === "delivery"}
            title="Yetkazib berish"
            body="Kuryer manzilga olib boradi"
            icon={<Truck className="w-4 h-4" strokeWidth={2.2} />}
            onClick={() => setFulfillmentType("delivery")}
          />
          <Card
            selected={checkout.fulfillmentType === "pickup"}
            title="Tarqatish punkti"
            body="Do'kondan olib ketish"
            icon={<Store className="w-4 h-4" strokeWidth={2.2} />}
            onClick={() => setFulfillmentType("pickup")}
          />
        </div>
      </div>

      {checkout.fulfillmentType === "delivery" ? (
        <div className="mt-3 rounded-2xl bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4" strokeWidth={2.2} />
            Manzil
          </p>
          <textarea
            value={checkout.address}
            onChange={(event) => updateCheckout({ address: event.target.value })}
            className="mt-3 w-full rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border resize-none min-h-[100px]"
            placeholder="Real manzilni yozing yoki geolokatsiya orqali aniqlang"
          />
          <button
            onClick={handleLocate}
            className="tap mt-3 h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform inline-flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" strokeWidth={2.2} />
            Xaritadan aniqlash
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-surface p-4 shadow-card space-y-2">
          {pickupPoints.map((point) => (
            <Card
              key={point.id}
              selected={point.id === checkout.pickupPointId}
              title={point.title}
              body={`${point.address} • ${point.hours}`}
              icon={<Store className="w-4 h-4" strokeWidth={2.2} />}
              onClick={() => selectPickupPoint(point.id)}
            />
          ))}
        </div>
      )}

      <button
        onClick={handleSave}
        className="tap mt-5 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-fab active:scale-[0.98] transition-transform"
      >
        Profilga saqlash
      </button>
    </div>
  );
}

function Card({
  selected,
  title,
  body,
  icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  body: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`tap rounded-2xl border p-3 text-left transition-all active:scale-[0.99] ${
        selected ? "border-primary bg-primary-soft/60" : "border-border bg-paper"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{body}</p>
    </button>
  );
}
