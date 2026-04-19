import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock3, MapPin, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/EmptyState";
import { formatCurrency } from "@/lib/format";
import { getTelegramUser } from "@/lib/telegram-webapp";
import { useApp, type Order, type SavedAddress } from "@/store/useApp";

const DELIVERY_WINDOWS = [
  "Today, 18:00 - 20:00",
  "Today, 20:00 - 22:00",
  "Tomorrow, 10:00 - 13:00",
  "Tomorrow, 14:00 - 17:00",
];

function buildAddressDraft(address?: SavedAddress, fallbackAddress = "") {
  return {
    id: address?.id,
    label: address?.label ?? "",
    address: address?.address ?? fallbackAddress,
  };
}

async function notifyOrder(order: Order) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      order,
      telegramUser: getTelegramUser(),
      source: "mini-app",
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Telegram notification failed");
  }
}

export function CheckoutScreen() {
  const cart = useApp((state) => state.cart);
  const checkout = useApp((state) => state.checkout);
  const savedAddresses = useApp((state) => state.savedAddresses);
  const updateCheckout = useApp((state) => state.updateCheckout);
  const selectAddress = useApp((state) => state.selectAddress);
  const saveAddress = useApp((state) => state.saveAddress);
  const pricing = useApp((state) => state.cartPricing());
  const placeOrder = useApp((state) => state.placeOrder);
  const navigate = useApp((state) => state.navigate);
  const [isAddressEditorOpen, setIsAddressEditorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedAddress = useMemo(
    () => savedAddresses.find((address) => address.id === checkout.addressId) ?? savedAddresses[0],
    [checkout.addressId, savedAddresses],
  );
  const [addressDraft, setAddressDraft] = useState(() =>
    buildAddressDraft(selectedAddress, checkout.address),
  );

  useEffect(() => {
    setAddressDraft(buildAddressDraft(selectedAddress, checkout.address));
  }, [checkout.address, selectedAddress]);

  if (cart.length === 0) {
    return (
      <div className="animate-screen-in px-5 pt-3 pb-6">
        <EmptyState
          icon={<AlertCircle className="w-9 h-9" strokeWidth={1.75} />}
          title="Your basket is empty"
          body="Add a few cuts to your cart before checking out."
          action={
            <button
              onClick={() => navigate({ name: "categories" })}
              className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
            >
              Browse products
            </button>
          }
        />
      </div>
    );
  }

  const handleSaveAddress = () => {
    const savedId = saveAddress(addressDraft);
    if (!savedId) {
      toast.error("Enter an address label and full address.");
      return;
    }

    setIsAddressEditorOpen(false);
    toast.success("Delivery address saved.");
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) {
      return;
    }

    if (!checkout.name.trim() || !checkout.phone.trim() || !checkout.address.trim()) {
      toast.error("Please complete your contact and delivery details.");
      return;
    }

    setIsSubmitting(true);
    const order = placeOrder();
    if (!order) {
      setIsSubmitting(false);
      toast.error("We could not place the order. Check your basket and try again.");
      return;
    }

    toast.success(`Order ${order.id} confirmed`, {
      description: `We will prepare delivery for ${order.customer.deliveryWindow}.`,
    });

    void notifyOrder(order).catch((error) => {
      toast.error("Order saved, but Telegram notification failed.", {
        description: error instanceof Error ? error.message : "Try syncing the bot again.",
      });
    });
  };

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Checkout</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
        Delivery details
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Finalise your order and keep your details ready for the Telegram bot.
      </p>

      <div className="mt-5 space-y-3">
        <Field label="Full name" icon={<User className="w-4 h-4" strokeWidth={2.25} />}>
          <input
            value={checkout.name}
            onChange={(event) => updateCheckout({ name: event.target.value })}
            className="w-full bg-transparent outline-none text-sm"
            placeholder="Your full name"
          />
        </Field>

        <Field label="Phone number" icon={<Phone className="w-4 h-4" strokeWidth={2.25} />}>
          <input
            value={checkout.phone}
            onChange={(event) => updateCheckout({ phone: event.target.value })}
            className="w-full bg-transparent outline-none text-sm"
            placeholder="+998 90 123 45 67"
          />
        </Field>

        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" strokeWidth={2.25} />
              Delivery address
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAddressDraft(buildAddressDraft(selectedAddress, checkout.address));
                  setIsAddressEditorOpen((value) => !value);
                }}
                className="tap text-[11px] font-semibold text-primary active:scale-95 transition-transform"
              >
                {isAddressEditorOpen ? "Close" : "Edit"}
              </button>
              <button
                onClick={() => {
                  setAddressDraft({ label: "", address: "" });
                  setIsAddressEditorOpen(true);
                }}
                className="tap text-[11px] font-semibold text-primary active:scale-95 transition-transform"
              >
                Add new
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {savedAddresses.map((address) => {
              const selected = address.id === checkout.addressId;

              return (
                <button
                  key={address.id}
                  onClick={() => selectAddress(address.id)}
                  className={`tap w-full rounded-2xl border p-3 text-left transition-all active:scale-[0.99] ${
                    selected
                      ? "border-primary bg-primary-soft/60"
                      : "border-border bg-paper"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{address.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {address.address}
                      </p>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                        selected ? "border-primary bg-primary" : "border-border"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {isAddressEditorOpen && (
            <div className="mt-4 border-t border-dashed border-border pt-4 space-y-3">
              <input
                value={addressDraft.label}
                onChange={(event) =>
                  setAddressDraft((state) => ({ ...state, label: event.target.value }))
                }
                className="w-full rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border"
                placeholder="Home, Office, Parents"
              />
              <textarea
                value={addressDraft.address}
                onChange={(event) =>
                  setAddressDraft((state) => ({ ...state, address: event.target.value }))
                }
                className="w-full rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border resize-none min-h-[88px]"
                placeholder="Street, house, floor, entrance, landmark"
              />
              <button
                onClick={handleSaveAddress}
                className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
              >
                Save address
              </button>
            </div>
          )}
        </div>

        <Field label="Delivery slot" icon={<Clock3 className="w-4 h-4" strokeWidth={2.25} />}>
          <select
            value={checkout.deliveryWindow}
            onChange={(event) => updateCheckout({ deliveryWindow: event.target.value })}
            className="w-full bg-transparent outline-none text-sm"
          >
            {DELIVERY_WINDOWS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Driver notes
          </p>
          <textarea
            value={checkout.notes}
            onChange={(event) => updateCheckout({ notes: event.target.value })}
            placeholder="Door code, floor, preferred call before arrival"
            className="w-full bg-transparent outline-none text-sm resize-none min-h-[80px] mt-2"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-surface p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
          Order summary
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
          <SummaryRow label="Subtotal" value={formatCurrency(pricing.subtotal)} />
          {pricing.promoDiscount > 0 && (
            <SummaryRow
              label={`Promo ${pricing.activePromoCode}`}
              value={`-${formatCurrency(pricing.promoDiscount)}`}
            />
          )}
          <SummaryRow
            label="Delivery"
            value={pricing.delivery === 0 ? "FREE" : formatCurrency(pricing.delivery)}
          />
          <SummaryRow label="Total" value={formatCurrency(pricing.total)} strong />
        </div>
      </div>

      <div className="sticky bottom-0 mt-4 px-4 -mx-4 pb-3 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="tap w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-fab active:scale-[0.98] transition-transform flex items-center justify-between px-5 disabled:opacity-60 disabled:active:scale-100"
        >
          <span>{isSubmitting ? "Submitting..." : "Place order"}</span>
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
      <span className={strong ? "font-bold tabular-nums text-right" : "font-semibold tabular-nums text-right"}>
        {value}
      </span>
    </div>
  );
}
