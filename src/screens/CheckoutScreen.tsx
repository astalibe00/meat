import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  CreditCard,
  ImagePlus,
  MapPinned,
  Phone,
  Store,
  Truck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/EmptyState";
import { formatCurrency } from "@/lib/format";
import {
  DELIVERY_SLOT_LABELS,
  PAYMENT_METHOD_LABELS,
  isOnlinePayment,
} from "@/lib/order-status";
import { useApp } from "@/store/useApp";
import type { DeliverySlot, PaymentMethod } from "@/types/app-data";

const PAYMENT_OPTIONS: PaymentMethod[] = ["click", "payme", "cash"];
const P2P_PAYMENT_CARD = "9860350140942508";
const DELIVERY_OPTIONS: DeliverySlot[] = ["today", "tomorrow"];

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

    toast.success("Manzil yangilandi.");
  };

  const handleReceipt = async (file?: File | null) => {
    if (!file) {
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Chek rasmi 1.5 MB dan kichik bo'lishi kerak.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Rasm o'qilmadi."));
      reader.readAsDataURL(file);
    });

    updateCheckout({
      paymentReceipt: {
        fileName: file.name,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      },
    });
    toast.success("Chek rasmi biriktirildi.");
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

    toast.success(`Buyurtma ${result.order.id} yaratildi`);
  };

  return (
    <div className="animate-screen-in px-5 pt-3 pb-28">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
        Checkout
      </p>
      <h1 className="mt-0.5 font-serif text-[26px] leading-tight font-semibold tracking-tight">
        Buyurtmani yakunlash
      </h1>

      <div className="mt-5 space-y-3">
        <Field label="Kontakt" icon={<User className="h-4 w-4" strokeWidth={2.25} />}>
          <div className="grid gap-2">
            <input
              value={checkout.name}
              onChange={(event) => updateCheckout({ name: event.target.value })}
              className="h-10 rounded-xl bg-paper px-3 text-sm outline-none"
              placeholder="Ism"
            />
            <div className="flex items-center gap-2 rounded-xl bg-paper px-3">
              <Phone className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
              <input
                value={checkout.phone}
                onChange={(event) => updateCheckout({ phone: event.target.value })}
                className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>
        </Field>

        <Field label="Yetkazish" icon={<Truck className="h-4 w-4" strokeWidth={2.25} />}>
          <div className="grid grid-cols-2 gap-2">
            <SelectableCard
              selected={checkout.fulfillmentType === "delivery"}
              title="Yetkazib berish"
              body="Kuryer manzilga olib boradi"
              onClick={() => setFulfillmentType("delivery")}
            />
            <SelectableCard
              selected={checkout.fulfillmentType === "pickup"}
              title="Tarqatish punkti"
              body="O'zingiz olib ketasiz"
              onClick={() => setFulfillmentType("pickup")}
            />
          </div>

          {checkout.fulfillmentType === "delivery" ? (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {DELIVERY_OPTIONS.map((slot) => (
                  <SelectableCard
                    key={slot}
                    selected={checkout.deliverySlot === slot}
                    title={DELIVERY_SLOT_LABELS[slot]}
                    body={slot === "today" ? "Imkon bo'lsa bugun" : "Ertangi yetkazish"}
                    onClick={() => updateCheckout({ deliverySlot: slot })}
                  />
                ))}
              </div>
              <div className="rounded-2xl bg-paper p-3">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <MapPinned className="h-4 w-4" strokeWidth={2.25} />
                  Manzil
                </p>
                <textarea
                  value={checkout.address}
                  onChange={(event) => updateCheckout({ address: event.target.value })}
                  className="min-h-[78px] w-full resize-none bg-transparent text-sm outline-none"
                  placeholder="Masalan: Yunusobod tumani, 14-kvartal, 23-uy"
                />
                <button
                  onClick={handleLocate}
                  disabled={isLocating}
                  className="tap mt-2 h-10 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground active:scale-95 transition-transform disabled:opacity-60"
                >
                  {isLocating ? "Aniqlanmoqda..." : "Xaritadan aniqlash"}
                </button>
              </div>
            </div>
          ) : (
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
              {activePickupPoint && (
                <p className="text-[11px] text-muted-foreground">
                  Mo'ljal: {activePickupPoint.landmark}
                </p>
              )}
            </div>
          )}
        </Field>

        <Field label="To'lov" icon={<CreditCard className="h-4 w-4" strokeWidth={2.25} />}>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_OPTIONS.map((method) => (
              <button
                key={method}
                onClick={() =>
                  updateCheckout({
                    paymentMethod: method,
                    paymentReference: isOnlinePayment(method) ? checkout.paymentReference : "",
                    paymentReceipt: isOnlinePayment(method) ? checkout.paymentReceipt : undefined,
                  })
                }
                className={`tap rounded-2xl border p-3 text-left active:scale-[0.99] transition-transform ${
                  checkout.paymentMethod === method
                    ? "border-primary bg-primary-soft/70"
                    : "border-border bg-paper"
                }`}
              >
                <p className="text-xs font-bold">{PAYMENT_METHOD_LABELS[method]}</p>
              </button>
            ))}
          </div>

          {isOnlinePayment(checkout.paymentMethod) && (
            <div className="mt-3 rounded-2xl bg-paper p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground">P2P karta</p>
                  <p className="mt-1 font-mono text-sm font-bold tracking-[0.08em]">
                    {P2P_PAYMENT_CARD}
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
                  className="tap grid h-9 w-9 place-items-center rounded-full bg-surface active:scale-95 transition-transform"
                  aria-label="Karta raqamini nusxalash"
                >
                  <Copy className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>

              <input
                value={checkout.paymentReference}
                onChange={(event) => updateCheckout({ paymentReference: event.target.value })}
                className="mt-3 h-10 w-full rounded-xl bg-surface px-3 text-sm outline-none"
                placeholder="Chek ID yoki oxirgi 4 raqam"
              />

              <label className="tap mt-3 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface text-sm font-bold active:scale-[0.99] transition-transform">
                {checkout.paymentReceipt ? (
                  <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
                ) : (
                  <ImagePlus className="h-4 w-4 text-primary" strokeWidth={2.25} />
                )}
                {checkout.paymentReceipt?.fileName ?? "Chek rasmini yuklash"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleReceipt(event.target.files?.[0])}
                />
              </label>
            </div>
          )}
        </Field>

        <Field label="Izoh" icon={<Store className="h-4 w-4" strokeWidth={2.25} />}>
          <textarea
            value={checkout.notes}
            onChange={(event) => updateCheckout({ notes: event.target.value })}
            placeholder="Majburiy emas"
            className="min-h-[66px] w-full resize-none rounded-xl bg-paper px-3 py-2 text-sm outline-none"
          />
        </Field>
      </div>

      <div className="mt-5 rounded-2xl bg-surface p-4 shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Jami
        </p>
        <div className="mt-3 space-y-2 text-sm">
          <SummaryRow label="Mahsulotlar" value={formatCurrency(pricing.subtotal)} />
          {pricing.promoDiscount > 0 && (
            <SummaryRow label={`Promo ${pricing.activePromoCode}`} value={`-${formatCurrency(pricing.promoDiscount)}`} />
          )}
          <SummaryRow
            label={checkout.fulfillmentType === "pickup" ? "Olib ketish" : "Yetkazish"}
            value={pricing.delivery === 0 ? "Bepul" : formatCurrency(pricing.delivery)}
          />
          <div className="border-t border-dashed border-border" />
          <SummaryRow label="To'lanadi" value={formatCurrency(pricing.total)} strong />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-4 -mx-4 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-3 pt-4 pointer-events-none">
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="tap pointer-events-auto flex h-14 w-full items-center justify-between rounded-2xl bg-primary px-5 text-[15px] font-bold text-primary-foreground shadow-fab active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          <span>{isSubmitting ? "Yuborilmoqda..." : "Buyurtmani yuborish"}</span>
          <span>{formatCurrency(pricing.total)}</span>
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
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </p>
      {children}
    </section>
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
        selected ? "border-primary bg-primary-soft/70" : "border-border bg-paper"
      }`}
    >
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{body}</p>
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
      <span className={strong ? "font-bold tabular-nums" : "font-semibold tabular-nums"}>
        {value}
      </span>
    </div>
  );
}
