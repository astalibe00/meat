import { useMemo, useState } from "react";
import {
  AlertCircle,
  Copy,
  CreditCard,
  MapPinned,
  Phone,
  Store,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/EmptyState";
import { formatCurrency } from "@/lib/format";
import {
  PAYMENT_METHOD_LABELS,
  isOnlinePayment,
} from "@/lib/order-status";
import { useApp } from "@/store/useApp";

const PAYMENT_OPTIONS = ["humo", "uzcard", "click", "payme", "paynet", "cash"] as const;
const P2P_PAYMENT_CARD = "9860350140942508";

export function CheckoutScreen() {
  const cart = useApp((state) => state.cart);
  const checkout = useApp((state) => state.checkout);
  const pickupPoints = useApp((state) => state.pickupPoints);
  const updateCheckout = useApp((state) => state.updateCheckout);
  const setFulfillmentType = useApp((state) => state.setFulfillmentType);
  const selectPickupPoint = useApp((state) => state.selectPickupPoint);
  const detectCurrentLocation = useApp((state) => state.detectCurrentLocation);
  const getCartPricing = useApp((state) => state.cartPricing);
  const placeOrder = useApp((state) => state.placeOrder);
  const navigate = useApp((state) => state.navigate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const pricing = getCartPricing();
  const activePickupPoint = useMemo(
    () => pickupPoints.find((point) => point.id === checkout.pickupPointId),
    [checkout.pickupPointId, pickupPoints],
  );

  if (cart.length === 0) {
    return (
      <div className="animate-screen-in px-5 pt-3 pb-6">
        <EmptyState
          icon={<AlertCircle className="w-9 h-9" strokeWidth={1.75} />}
          title="Savatingiz bo'sh"
          body="Rasmiylashtirishdan oldin bir nechta mahsulot qo'shing."
          action={
            <button
              onClick={() => navigate({ name: "categories" })}
              className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
            >
              Mahsulotlarni ko'rish
            </button>
          }
        />
      </div>
    );
  }

  const handleLocate = async () => {
    setIsLocating(true);
    const result = await detectCurrentLocation();
    setIsLocating(false);

    if (!result.ok) {
      toast.error(result.error ?? "Manzil aniqlanmadi.");
      return;
    }

    toast.success("Manzil xarita bo'yicha yangilandi.");
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = await placeOrder();
    setIsSubmitting(false);

    if (!result.ok || !result.order) {
      toast.error(result.error ?? "Buyurtma yuborilmadi.");
      return;
    }

    toast.success(`Buyurtma ${result.order.id} yaratildi`, {
      description:
        isOnlinePayment(checkout.paymentMethod)
          ? "P2P to'lov tekshiruvga yuborildi. Admin tasdig'idan keyin tayyorlash boshlanadi."
          : "Buyurtma admin tasdig'iga yuborildi.",
    });
  };

  return (
    <div className="animate-screen-in px-5 pt-3 pb-28">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
        Rasmiylashtirish
      </p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
        Yetkazib berish ma'lumotlari
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Ism va telefon botdan olinadi, manzil esa xarita yoki tarqatish punkti orqali tanlanadi.
      </p>

      <div className="mt-5 space-y-3">
        <Field label="Mijoz" icon={<User className="w-4 h-4" strokeWidth={2.25} />}>
          <input
            value={checkout.name}
            onChange={(event) => updateCheckout({ name: event.target.value })}
            className="w-full bg-transparent outline-none text-sm"
            placeholder="Telegramdagi ism"
          />
        </Field>

        <Field label="Telefon" icon={<Phone className="w-4 h-4" strokeWidth={2.25} />}>
          <input
            value={checkout.phone}
            onChange={(event) => updateCheckout({ phone: event.target.value })}
            className="w-full bg-transparent outline-none text-sm"
            placeholder="+998 90 123 45 67"
          />
        </Field>

        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Yetkazish usuli
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SelectableCard
              selected={checkout.fulfillmentType === "delivery"}
              title="Yetkazib berish"
              body="Xarita bo'yicha manzil belgilanadi"
              onClick={() => setFulfillmentType("delivery")}
            />
            <SelectableCard
              selected={checkout.fulfillmentType === "pickup"}
              title="Tarqatish punkti"
              body="Do'kondan o'zi olib ketish"
              onClick={() => setFulfillmentType("pickup")}
            />
          </div>
        </div>

        {checkout.fulfillmentType === "delivery" ? (
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
              <MapPinned className="w-4 h-4" strokeWidth={2.25} />
              Yetkazib berish manzili
            </p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Joriy joylashuvni aniqlang yoki real manzilni yozing. Xarita koordinatalari buyurtmaga birga yuboriladi.
            </p>

            <div className="mt-3 rounded-2xl bg-paper p-3">
              <textarea
                value={checkout.address}
                onChange={(event) => updateCheckout({ address: event.target.value })}
                className="w-full bg-transparent outline-none text-sm resize-none min-h-[88px]"
                placeholder="Masalan: Yunusobod tumani, 14-kvartal, 23-uy"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleLocate}
                disabled={isLocating}
                className="tap flex-1 h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
              >
                {isLocating ? "Aniqlanmoqda..." : "Xaritadan aniqlash"}
              </button>
              <button
                onClick={() => navigate({ name: "addresses" })}
                className="tap h-11 px-5 rounded-full bg-paper border border-border text-sm font-semibold active:scale-95 transition-transform"
              >
                Alohida oynada
              </button>
            </div>

            {checkout.coordinates && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Koordinata: {checkout.coordinates.lat.toFixed(5)}, {checkout.coordinates.lon.toFixed(5)}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
              <Store className="w-4 h-4" strokeWidth={2.25} />
              Tarqatish punktini tanlang
            </p>
            <div className="mt-3 grid gap-2">
              {pickupPoints.map((point) => (
                <SelectableCard
                  key={point.id}
                  selected={point.id === checkout.pickupPointId}
                  title={point.title}
                  body={`${point.address} • ${point.hours}`}
                  onClick={() => selectPickupPoint(point.id)}
                />
              ))}
            </div>
            {activePickupPoint && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Mo'ljal: {activePickupPoint.landmark}
              </p>
            )}
          </div>
        )}

        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4" strokeWidth={2.25} />
            To'lov turi
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map((method) => (
              <SelectableCard
                key={method}
                selected={checkout.paymentMethod === method}
                title={PAYMENT_METHOD_LABELS[method]}
                body={isOnlinePayment(method) ? "To'lovdan keyin tayyorlash boshlanadi" : "Buyurtma kelganda yoki terminal orqali"}
                onClick={() =>
                  updateCheckout({
                    paymentMethod: method,
                    paymentReference: isOnlinePayment(method) ? checkout.paymentReference : "",
                  })
                }
              />
            ))}
          </div>

          {isOnlinePayment(checkout.paymentMethod) && (
            <div className="mt-4 rounded-2xl bg-paper p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">P2P karta raqami</p>
                  <p className="mt-1 font-mono text-base tracking-[0.12em]">{P2P_PAYMENT_CARD}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                    Mijoz avval shu kartaga to'lov qiladi. Admin tranzaksiyani tekshirganidan keyin buyurtma tasdiqlanadi.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(P2P_PAYMENT_CARD);
                      toast.success("Karta raqami nusxalandi.");
                    } catch {
                      toast.error("Nusxalab bo'lmadi.");
                    }
                  }}
                  className="tap h-10 px-4 rounded-full bg-surface border border-border text-sm font-semibold active:scale-95 transition-transform inline-flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" strokeWidth={2.2} />
                  Nusxalash
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-surface px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Tranzaksiya izohi
                </p>
                <input
                  value={checkout.paymentReference}
                  onChange={(event) => updateCheckout({ paymentReference: event.target.value })}
                  className="mt-2 w-full bg-transparent outline-none text-sm"
                  placeholder="Chek ID, oxirgi 4 raqam yoki izoh"
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Buyurtma izohi
          </p>
          <textarea
            value={checkout.notes}
            onChange={(event) => updateCheckout({ notes: event.target.value })}
            placeholder="Qo'shimcha eslatma, domofon kodi yoki katta buyurtma tafsiloti"
            className="w-full bg-transparent outline-none text-sm resize-none min-h-[88px] mt-2"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Katta buyurtmalar uchun +998990197548 raqamiga qo'ng'iroq qiling.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-surface p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
          Buyurtma tarkibi
        </p>
        <div className="space-y-2.5">
          {cart.map((line) => (
            <div
              key={`${line.product.id}-${line.weightOption ?? line.product.weight}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold line-clamp-1">{line.product.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {line.quantity} x {line.weightOption ?? line.product.weight}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(line.product.price * line.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-border my-4" />
        <div className="space-y-2 text-sm">
          <SummaryRow label="Oraliq summa" value={formatCurrency(pricing.subtotal)} />
          <SummaryRow
            label={checkout.fulfillmentType === "pickup" ? "Olib ketish" : "Yetkazib berish"}
            value={pricing.delivery === 0 ? "Bepul" : formatCurrency(pricing.delivery)}
          />
          <SummaryRow label="Jami" value={formatCurrency(pricing.total)} strong />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-4 px-4 -mx-4 pb-3 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="tap pointer-events-auto w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-fab active:scale-[0.98] transition-transform flex items-center justify-between px-5 disabled:opacity-60 disabled:active:scale-100"
        >
          <span>{isSubmitting ? "Yuborilmoqda..." : "Buyurtmani yuborish"}</span>
          <span className="tabular-nums">{formatCurrency(pricing.total)}</span>
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function SelectableCard({
  selected,
  title,
  body,
  onClick,
}: {
  selected: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`tap rounded-2xl border p-3 text-left transition-all active:scale-[0.99] ${
        selected ? "border-primary bg-primary-soft/60" : "border-border bg-paper"
      }`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{body}</p>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-bold" : "text-muted-foreground"}>{label}</span>
      <span
        className={
          strong
            ? "font-bold tabular-nums text-right"
            : "font-semibold tabular-nums text-right"
        }
      >
        {value}
      </span>
    </div>
  );
}
