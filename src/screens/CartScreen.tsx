import { useMemo, useState } from "react";
import { ShieldCheck, ShoppingBag, Tag as TagIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/EmptyState";
import { FreeShipBar } from "@/components/app/FreeShipBar";
import { ProductCard } from "@/components/app/ProductCard";
import { QtyStepper } from "@/components/app/QtyStepper";
import { SectionHeader } from "@/components/app/SectionHeader";
import { getCartUpsells } from "@/data/products";
import { PROMO_OFFERS, getLineId } from "@/lib/commerce";
import { useApp } from "@/store/useApp";

export function CartScreen() {
  const cart = useApp((state) => state.cart);
  const updateQty = useApp((state) => state.updateQty);
  const removeFromCart = useApp((state) => state.removeFromCart);
  const navigate = useApp((state) => state.navigate);
  const pricing = useApp((state) => state.cartPricing());
  const promoCode = useApp((state) => state.promoCode);
  const applyPromoCode = useApp((state) => state.applyPromoCode);
  const clearPromoCode = useApp((state) => state.clearPromoCode);
  const [promoInput, setPromoInput] = useState(promoCode);

  const isEmpty = cart.length === 0;
  const upsells = useMemo(() => getCartUpsells(cart.map((line) => line.product.id), 6), [cart]);

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
            body="Browse our hand-trimmed halal cuts and they will show up here."
            action={
              <button
                onClick={() => navigate({ name: "categories" })}
                className="tap h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-fab active:scale-95 transition-transform"
              >
                Start shopping
              </button>
            }
          />

          <SectionHeader
            eyebrow="Customer favourites"
            title="Loved by everyone"
            inline
            className="px-5 mt-4"
          />
          <div className="overflow-x-auto no-scrollbar -mx-5">
            <div className="flex gap-3 px-5 pb-2">
              {upsells.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} variant="horizontal" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePromoApply = (code = promoInput) => {
    const result = applyPromoCode(code);
    if (result.ok) {
      setPromoInput(result.code);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="animate-screen-in pb-36">
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

      <div className="px-5 mt-3">
        <FreeShipBar subtotal={pricing.subtotal} />
      </div>

      <div className="px-5 mt-4 space-y-2.5">
        {cart.map((line) => {
          const lineId = getLineId(line);
          const lineTotal = line.product.price * line.quantity;
          const oldLineTotal = line.product.oldPrice
            ? line.product.oldPrice * line.quantity
            : null;

          return (
            <div
              key={lineId}
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
                      removeFromCart(lineId);
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
                    onChange={(value) => updateQty(lineId, value)}
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

      {upsells.length > 0 && (
        <div className="mt-6">
          <SectionHeader
            eyebrow={pricing.freeDeliveryUnlocked ? "More to love" : "Add to unlock free delivery"}
            title="Frequently added"
          />
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2.5 px-5 pb-1">
              {upsells.map((product) => (
                <ProductCard key={product.id} product={product} variant="compact" />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mx-5 mt-5 bg-surface rounded-2xl p-3 shadow-xs border border-dashed border-border">
        <div className="flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />
          <input
            value={promoInput}
            onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
            placeholder="Promo code"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => handlePromoApply()}
            className="tap text-xs font-bold text-primary px-2 active:scale-95 transition-transform"
          >
            APPLY
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {PROMO_OFFERS.map((offer) => (
            <button
              key={offer.code}
              onClick={() => handlePromoApply(offer.code)}
              className="tap h-8 px-3 rounded-full bg-paper text-[11px] font-semibold border border-border active:scale-95 transition-transform"
            >
              {offer.code}
            </button>
          ))}
          {promoCode && (
            <button
              onClick={() => {
                clearPromoCode();
                setPromoInput("");
              }}
              className="tap h-8 px-3 rounded-full bg-primary-soft text-[11px] font-semibold text-primary active:scale-95 transition-transform"
            >
              Clear promo
            </button>
          )}
        </div>
      </div>

      <div className="mx-5 mt-3 bg-surface rounded-2xl p-4 shadow-card space-y-2.5">
        <Row label="Subtotal" value={`$${pricing.subtotal.toFixed(2)}`} />
        {pricing.savings > 0 && (
          <Row label="You save" value={`-$${pricing.savings.toFixed(2)}`} accent="sale" />
        )}
        {pricing.promoDiscount > 0 && (
          <Row
            label={`Promo ${pricing.activePromoCode}`}
            value={`-$${pricing.promoDiscount.toFixed(2)}`}
            accent="primary"
          />
        )}
        <Row
          label="Delivery"
          value={pricing.delivery === 0 ? "FREE" : `$${pricing.delivery.toFixed(2)}`}
          accent={pricing.delivery === 0 ? "primary" : undefined}
        />
        <div className="border-t border-dashed border-border my-1" />
        <Row label="Total" value={`$${pricing.total.toFixed(2)}`} bold />

        <div className="flex items-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
          Secure checkout - halal guarantee - same-day support
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-[68px] px-4 pb-3 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          onClick={() => navigate({ name: "checkout" })}
          className="tap w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-fab active:scale-[0.98] transition-transform flex items-center justify-between px-5"
        >
          <span>Continue to checkout</span>
          <span className="tabular-nums">${pricing.total.toFixed(2)}</span>
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
          accent === "primary"
            ? "text-primary"
            : accent === "sale"
              ? "text-sale"
              : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
