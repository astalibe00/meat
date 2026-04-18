import { useState, useMemo } from "react";
import { ChevronLeft, BadgeCheck, Heart, Share2, Flame, Truck, Shield, Clock, Plus } from "lucide-react";
import { useApp } from "@/store/useApp";
import { getProductById, getRelatedProducts } from "@/data/products";
import { toast } from "sonner";
import { ProductBadge } from "@/components/app/ProductBadge";
import { QtyStepper } from "@/components/app/QtyStepper";
import { ProductCard } from "@/components/app/ProductCard";
import { SectionHeader } from "@/components/app/SectionHeader";

export function ProductDetailScreen() {
  const screen = useApp((s) => s.screen);
  const back = useApp((s) => s.back);
  const addToCart = useApp((s) => s.addToCart);
  const navigate = useApp((s) => s.navigate);
  const isFav = useApp((s) => s.favorites.includes(screen.name === "product" ? screen.id : ""));
  const toggleFavorite = useApp((s) => s.toggleFavorite);

  const id = screen.name === "product" ? screen.id : "";
  const product = getProductById(id);
  const [qty, setQty] = useState(1);
  const [weight, setWeight] = useState<string | undefined>(product?.weightOptions?.[0]);

  const related = useMemo(() => getRelatedProducts(id, 4), [id]);

  if (!product) return null;

  const onSale = !!product.oldPrice;
  const savings = onSale ? (product.oldPrice! - product.price) * qty : 0;

  const onAdd = () => {
    addToCart(product, qty, weight);
    toast.success(`Added ${qty} × ${product.name}`, {
      description: weight ? `${weight} · $${(product.price * qty).toFixed(2)}` : `$${(product.price * qty).toFixed(2)}`,
      duration: 1700,
    });
    back();
  };

  return (
    <div className="animate-screen-in pb-32 bg-background min-h-full">
      {/* Hero image */}
      <div className="relative bg-paper aspect-[4/3.6]">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />

        <button
          onClick={back}
          aria-label="Back"
          className="tap absolute top-3 left-3 w-10 h-10 rounded-full bg-surface/95 backdrop-blur grid place-items-center shadow-card active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={() => toggleFavorite(product.id)}
            aria-label="Favorite"
            className="tap w-10 h-10 rounded-full bg-surface/95 backdrop-blur grid place-items-center shadow-card active:scale-90 transition-transform"
          >
            <Heart
              className={`w-4 h-4 ${isFav ? "fill-sale text-sale" : "text-foreground/70"}`}
              strokeWidth={2.5}
            />
          </button>
          <button
            aria-label="Share"
            className="tap w-10 h-10 rounded-full bg-surface/95 backdrop-blur grid place-items-center shadow-card active:scale-90 transition-transform"
          >
            <Share2 className="w-4 h-4 text-foreground/70" strokeWidth={2.5} />
          </button>
        </div>
        {onSale && (
          <div className="absolute bottom-4 left-4">
            <ProductBadge label={`Save $${savings.toFixed(2)}`} variant="Sale" className="!h-7 !px-3 !text-xs" />
          </div>
        )}
      </div>

      {/* Body sheet */}
      <div className="bg-surface -mt-5 rounded-t-3xl px-5 pt-5 relative shadow-elevated">
        {/* Pull handle */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-foreground/15" />

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.tags.map((t) => (
            <ProductBadge key={t} label={t} />
          ))}
        </div>

        {/* Title + price */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-[26px] leading-[1.05] font-semibold tracking-tight text-balance">
              {product.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              {product.weight} {product.origin && <>· {product.origin}</>}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-serif text-[26px] font-semibold leading-none text-primary tabular-nums">
              ${product.price.toFixed(2)}
            </p>
            {onSale && (
              <p className="text-xs text-muted-foreground line-through mt-1.5 tabular-nums">
                ${product.oldPrice!.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Halal trust card */}
        <div className="mt-5 p-4 rounded-2xl bg-foreground text-background">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
              <BadgeCheck className="w-5 h-5" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold">100% Certified Halal</p>
              <p className="text-[11px] text-background/70 leading-tight mt-0.5">
                HMC certified · Hand-slaughtered · Hand-trimmed
              </p>
            </div>
          </div>
        </div>

        {/* Weight options */}
        {product.weightOptions && product.weightOptions.length > 1 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Choose weight
              </p>
              <p className="text-[11px] text-muted-foreground">{weight}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {product.weightOptions.map((w) => (
                <button
                  key={w}
                  onClick={() => setWeight(w)}
                  className={`tap h-11 px-5 rounded-full text-sm font-bold border-2 active:scale-95 transition-all ${
                    weight === w
                      ? "bg-foreground text-background border-foreground"
                      : "bg-surface text-foreground border-border"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
            About this cut
          </p>
          <p className="text-[14px] text-foreground/85 leading-relaxed">{product.description}</p>
        </div>

        {/* Trust bullets */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <TrustBullet Icon={Flame} label="Cut to order" sub={product.prepTime ?? "Fresh"} />
          <TrustBullet Icon={Truck} label="Same-day" sub="Order by 2pm" />
          <TrustBullet Icon={Shield} label="Quality" sub="Money back" />
        </div>

        {/* Quantity */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">
              Quantity
            </p>
            <p className="text-xs text-muted-foreground">{qty} × ${product.price.toFixed(2)}</p>
          </div>
          <QtyStepper value={qty} onChange={setQty} min={1} max={20} size="lg" />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-7 -mx-5">
            <SectionHeader eyebrow="You might also like" title="Pair it with" />
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-3 px-5 pb-1">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} variant="horizontal" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="absolute left-0 right-0 bottom-0 px-4 pb-4 pt-3 bg-surface border-t border-border">
        <button
          onClick={onAdd}
          className="tap w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-fab active:scale-[0.98] transition-transform flex items-center justify-between px-5"
        >
          <span className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-primary-foreground/15 grid place-items-center">
              <Plus className="w-4 h-4" strokeWidth={3} />
            </span>
            Add to cart
          </span>
          <span className="tabular-nums">${(product.price * qty).toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}

function TrustBullet({
  Icon,
  label,
  sub,
}: {
  Icon: typeof Flame;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl bg-paper p-3 flex flex-col items-start">
      <Icon className="w-4 h-4 text-primary mb-1.5" strokeWidth={2.5} />
      <p className="text-[11px] font-bold leading-tight">{label}</p>
      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{sub}</p>
    </div>
  );
}
