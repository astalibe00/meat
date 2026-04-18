import { AlertCircle, Clock3, MapPin, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/EmptyState";
import { useApp } from "@/store/useApp";

const DELIVERY_WINDOWS = [
  "Today, 6pm - 8pm",
  "Today, 8pm - 10pm",
  "Tomorrow, 10am - 1pm",
  "Tomorrow, 2pm - 5pm",
];

export function CheckoutScreen() {
  const cart = useApp((state) => state.cart);
  const checkout = useApp((state) => state.checkout);
  const updateCheckout = useApp((state) => state.updateCheckout);
  const pricing = useApp((state) => state.cartPricing());
  const placeOrder = useApp((state) => state.placeOrder);
  const navigate = useApp((state) => state.navigate);

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

  const handlePlaceOrder = () => {
    if (!checkout.name.trim() || !checkout.phone.trim() || !checkout.address.trim()) {
      toast.error("Please complete your contact and delivery details.");
      return;
    }

    const order = placeOrder();
    if (!order) {
      toast.error("We could not place the order. Check your basket and try again.");
      return;
    }

    toast.success(`Order ${order.id} confirmed`, {
      description: `We will prepare delivery for ${order.customer.deliveryWindow}.`,
    });
  };

  return (
    <div className="animate-screen-in px-5 pt-3 pb-32">
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

        <Field label="Delivery address" icon={<MapPin className="w-4 h-4" strokeWidth={2.25} />}>
          <textarea
            value={checkout.address}
            onChange={(event) => updateCheckout({ address: event.target.value })}
            className="w-full bg-transparent outline-none text-sm resize-none min-h-[72px]"
            placeholder="Street, building, floor, landmark"
          />
        </Field>

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
            <div key={`${line.product.id}-${line.weightOption ?? line.product.weight}`} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold line-clamp-1">{line.product.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {line.quantity} x {line.weightOption ?? line.product.weight}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                ${(line.product.price * line.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-border my-4" />
        <div className="space-y-2 text-sm">
          <SummaryRow label="Subtotal" value={`$${pricing.subtotal.toFixed(2)}`} />
          {pricing.promoDiscount > 0 && (
            <SummaryRow
              label={`Promo ${pricing.activePromoCode}`}
              value={`-$${pricing.promoDiscount.toFixed(2)}`}
            />
          )}
          <SummaryRow
            label="Delivery"
            value={pricing.delivery === 0 ? "FREE" : `$${pricing.delivery.toFixed(2)}`}
          />
          <SummaryRow label="Total" value={`$${pricing.total.toFixed(2)}`} strong />
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-[68px] px-4 pb-3 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={handlePlaceOrder}
          className="tap w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-fab active:scale-[0.98] transition-transform flex items-center justify-between px-5"
        >
          <span>Place order</span>
          <span className="tabular-nums">${pricing.total.toFixed(2)}</span>
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
    <div className="flex items-center justify-between">
      <span className={strong ? "font-bold" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-bold tabular-nums" : "font-semibold tabular-nums"}>
        {value}
      </span>
    </div>
  );
}
