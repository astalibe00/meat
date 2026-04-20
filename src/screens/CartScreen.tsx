import { useMemo } from "react";
import { ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/EmptyState";
import { FreeShipBar } from "@/components/app/FreeShipBar";
import { ProductCard } from "@/components/app/ProductCard";
import { QtyStepper } from "@/components/app/QtyStepper";
import { SectionHeader } from "@/components/app/SectionHeader";
import { formatCurrency } from "@/lib/format";
import { getLineId } from "@/lib/commerce";
import { getProductMaxUnits } from "@/lib/weights";
import { useApp } from "@/store/useApp";

export function CartScreen() {
  const cart = useApp((state) => state.cart);
  const updateQty = useApp((state) => state.updateQty);
  const removeFromCart = useApp((state) => state.removeFromCart);
  const navigate = useApp((state) => state.navigate);
  const getCartPricing = useApp((state) => state.cartPricing);
  const products = useApp((state) => state.products);
  const pricing = getCartPricing();

  const isEmpty = cart.length === 0;
  const upsells = useMemo(() => {
    const inCart = new Set(cart.map((line) => line.product.id));
    return products.filter((product) => product.enabled && !inCart.has(product.id)).slice(0, 6);
  }, [cart, products]);

  if (isEmpty) {
    return (
      <div className="animate-screen-in px-5 pt-3 pb-4 h-full flex flex-col">
        <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight">
          Savat
        </h1>
        <div className="flex-1 flex flex-col">
          <EmptyState
            className="my-6"
            icon={<ShoppingBag className="w-9 h-9" strokeWidth={1.75} />}
            title="Savatingiz hozircha bo'sh"
            body="Mahsulot qo'shsangiz, ular shu yerda ko'rinadi."
            action={
              <button
                onClick={() => navigate({ name: "categories" })}
                className="tap h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-fab active:scale-95 transition-transform"
              >
                Xaridni boshlash
              </button>
            }
          />

          <SectionHeader
            eyebrow="Mijozlar tanlovi"
            title="Ommabop mahsulotlar"
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

  return (
    <div className="animate-screen-in pb-28">
      <div className="px-5 pt-3 pb-2 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Savat
          </p>
          <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight">
            Buyurtmangiz
          </h1>
        </div>
        <span className="text-xs text-muted-foreground mb-1">
          {cart.length} ta mahsulot
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
          const maxUnits = Math.max(
            1,
            getProductMaxUnits(line.product.stockKg, line.weightOption, line.product.weight),
          );

          return (
            <div key={lineId} className="bg-surface rounded-2xl p-3 shadow-card flex gap-3">
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
                      toast(`${line.product.name} savatdan olib tashlandi`, { duration: 1500 });
                    }}
                    className="tap shrink-0 w-7 h-7 grid place-items-center rounded-full text-muted-foreground hover:text-sale active:scale-90 transition-all"
                    aria-label="Olib tashlash"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-bold tabular-nums leading-none">
                      {formatCurrency(lineTotal)}
                    </span>
                    {oldLineTotal && (
                      <span className="text-[11px] text-muted-foreground line-through tabular-nums mt-1">
                        {formatCurrency(oldLineTotal)}
                      </span>
                    )}
                  </div>
                  <QtyStepper
                    value={line.quantity}
                    onChange={(value) => updateQty(lineId, value)}
                    min={0}
                    max={maxUnits}
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
            eyebrow={pricing.freeDeliveryUnlocked ? "Yana qo'shing" : "Bepul yetkazish uchun"}
            title="Ko'p qo'shiladiganlar"
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

      <div className="mx-5 mt-3 bg-surface rounded-2xl p-4 shadow-card space-y-2.5">
        <Row label="Oraliq summa" value={formatCurrency(pricing.subtotal)} />
        {pricing.savings > 0 && (
          <Row label="Tejadingiz" value={`-${formatCurrency(pricing.savings)}`} accent="sale" />
        )}
        {pricing.promoDiscount > 0 && (
          <Row
            label={`Promo ${pricing.activePromoCode}`}
            value={`-${formatCurrency(pricing.promoDiscount)}`}
            accent="primary"
          />
        )}
        <Row
          label="Yetkazib berish"
          value={pricing.delivery === 0 ? "Bepul" : formatCurrency(pricing.delivery)}
          accent={pricing.delivery === 0 ? "primary" : undefined}
        />
        <div className="border-t border-dashed border-border my-1" />
        <Row label="Jami" value={formatCurrency(pricing.total)} bold />

        <div className="flex items-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
          Promo kodlar checkout oqimida yashirin qo'llanadi, savatda ko'rinmaydi
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-4 px-4 pb-3 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        <button
          onClick={() => navigate({ name: "checkout" })}
          className="tap pointer-events-auto w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-fab active:scale-[0.98] transition-transform flex items-center justify-between px-5"
        >
          <span>Rasmiylashtirishga o'tish</span>
          <span className="tabular-nums">{formatCurrency(pricing.total)}</span>
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
    <div className="flex items-center justify-between gap-3">
      <span className={bold ? "text-base font-bold" : "text-[13px] text-muted-foreground"}>
        {label}
      </span>
      <span
        className={`tabular-nums text-right ${bold ? "text-lg font-bold" : "text-sm font-semibold"} ${
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
