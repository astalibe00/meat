import { Trash2, ShoppingBag, ShieldCheck, Tag as TagIcon } from "lucide-react";
import { useApp } from "@/store/useApp";
import { DELIVERY_FEE, FREE_SHIPPING_THRESHOLD, getCartUpsells } from "@/data/products";
import { toast } from "sonner";
import { useMemo } from "react";
import { QtyStepper } from "@/components/app/QtyStepper";
import { FreeShipBar } from "@/components/app/FreeShipBar";
import { EmptyState } from "@/components/app/EmptyState";
import { ProductCard } from "@/components/app/ProductCard";
import { SectionHeader } from "@/components/app/SectionHeader";

export function CartScreen() {
  const cart = useApp((s) => s.cart);
  const updateQty = useApp((s) => s.updateQty);
  const removeFromCart = useApp((s) => s.removeFromCart);
  const navigate = useApp((s) => s.navigate);
  const subtotal = useApp((s) => s.cartSubtotal());
  const savings = useApp((s) => s.cartSavings());

  const isEmpty = cart.length === 0;
  const freeShip = subtotal >= FREE_SHIPPING_THRESHOLD;
  const delivery = isEmpty ? 0 : freeShip ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  const upsells = useMemo(
    () => getCartUpsells(cart.map((l) => l.product.id), 6),
    [cart]
  );

  // ----- Empty state -----
  if (isEmpty) {
    return (
      <div className="animate-screen-in px-5 pt-3 pb-4 h-full flex flex-col">
        <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight">
          Your cart
        </h1>
        <div className="flex-1 flex flex-col">
          <EmptyState
            className="my-6"
            icon={<ShoppingBag className="w-9 h-9" strokeWidth={1.75} />}
            title="Your cart is empty"
            body="Browse our hand-trimmed halal cuts and they'll show up here."
            action={
              <button
                onClick={() => navigate({ name: "categories" })}
                className="tap h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-fab active:scale-95 transition-transform"
              >
                Start shopping
              </button>
            }
          />

          {/* Recommended even when empty */}
          <SectionHeader eyebrow="Customer favourites" title="Loved by everyone" inline className="px-5 mt-4" />
          <div className="overflow-x-auto no-scrollbar -mx-5">
            <div className="flex gap-3 px-5 pb-2">
              {upsells.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} variant="horizontal" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----- Filled cart -----
  return (
    <div className="animate-screen-in pb-36">
      {/* Header */}
      <div className="px-5 pt-3 pb-2 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Review</p>
          <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight">
            Your cart
          </h1>
        </div>
        <span className="text-xs text-muted-foreground mb-1">
          {cart.length} item{cart.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Free shipping */}
      <div className="px-5 mt-3">
        <FreeShipBar subtotal={subtotal} />
      </div>

      {/* Items */}
      <div className="px-5 mt-4 space-y-2.5">
        {cart.map((line) => {
          const lineTotal = line.product.price * line.quantity;
          const oldLineTotal = line.product.oldPrice ? line.product.oldPrice * line.quantity : null;
          return (
            <div
              key={`${line.product.id}-${line.weightOption ?? ""}`}
              className="bg-surface rounded-2xl p-3 shadow-card flex gap-3"
            >
              <button
                onClick={() => navigate({ name: "product", id: line.product.id })}
                className="tap w-20 h-20 rounded-xl overflow-hidden bg-paper shrink-0 active:scale-95 transition-transform"
              >
                <img
                  src={line.product.image}
                  alt={line.product.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold leading-tight line-clamp-2">
                      {line.product.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {line.weightOption ?? line.product.weight}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      removeFromCart(line.product.id);
                      toast(`${line.product.name} removed`, { duration: 1500 });
                    }}
                    className="tap shrink-0 w-7 h-7 grid place-items-center rounded-full text-muted-foreground hover:text-sale active:scale-90 transition-all"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="mt-auto flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-base font-bold tabular-nums leading-none">
                      ${lineTotal.toFixed(2)}
                    </span>
                    {oldLineTotal && (
                      <span className="text-[11px] text-muted-foreground line-through tabular-nums mt-1">
                        ${oldLineTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <QtyStepper
                    value={line.quantity}
                    onChange={(v) => updateQty(line.product.id, v)}
                    min={0}
                    max={20}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upsells */}
      {upsells.length > 0 && (
        <div className="mt-6">
          <SectionHeader
            eyebrow={freeShip ? "More to love" : "Add to unlock free delivery"}
            title="Frequently added"
          />
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2.5 px-5 pb-1">
              {upsells.map((p) => (
                <ProductCard key={p.id} product={p} variant="compact" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Promo input */}
      <div className="mx-5 mt-5 flex items-center gap-2 bg-surface rounded-2xl p-3 shadow-xs border border-dashed border-border">
        <TagIcon className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />
        <input
          placeholder="Promo code"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button className="tap text-xs font-bold text-primary px-2 active:scale-95 transition-transform">
          APPLY
        </button>
      </div>

      {/* Summary */}
      <div className="mx-5 mt-3 bg-surface rounded-2xl p-4 shadow-card space-y-2.5">
        <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
        {savings > 0 && (
          <Row label="You save" value={`−$${savings.toFixed(2)}`} accent="sale" />
        )}
        <Row
          label="Delivery"
          value={delivery === 0 ? "FREE" : `$${delivery.toFixed(2)}`}
          accent={delivery === 0 ? "primary" : undefined}
        />
        <div className="border-t border-dashed border-border my-1" />
        <Row label="Total" value={`$${total.toFixed(2)}`} bold />

        {/* Trust line */}
        <div className="flex items-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
          Secure checkout · 100% halal guarantee
        </div>
      </div>

      {/* Place order CTA */}
      <div className="absolute left-0 right-0 bottom-[68px] px-4 pb-3 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={() => toast.success("Order placed 🎉", { description: `Total $${total.toFixed(2)}` })}
          className="tap w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-fab active:scale-[0.98] transition-transform flex items-center justify-between px-5"
        >
          <span>Checkout</span>
          <span className="tabular-nums">${total.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: "primary" | "sale";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "text-base font-bold" : "text-[13px] text-muted-foreground"}>
        {label}
      </span>
      <span
        className={`tabular-nums ${bold ? "text-lg font-bold" : "text-sm font-semibold"} ${
          accent === "primary" ? "text-primary" : accent === "sale" ? "text-sale" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
