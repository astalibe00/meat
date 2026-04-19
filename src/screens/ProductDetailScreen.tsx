import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  Flame,
  Heart,
  Plus,
  Share2,
  Shield,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { ProductBadge } from "@/components/app/ProductBadge";
import { ProductCard } from "@/components/app/ProductCard";
import { QtyStepper } from "@/components/app/QtyStepper";
import { SectionHeader } from "@/components/app/SectionHeader";
import { getProductById, getRelatedProducts } from "@/data/products";
import { formatCurrency } from "@/lib/format";
import { useApp } from "@/store/useApp";

export function ProductDetailScreen() {
  const screen = useApp((state) => state.screen);
  const back = useApp((state) => state.back);
  const addToCart = useApp((state) => state.addToCart);
  const navigate = useApp((state) => state.navigate);
  const toggleFavorite = useApp((state) => state.toggleFavorite);
  const favorites = useApp((state) => state.favorites);

  const productId = screen.name === "product" ? screen.id : "";
  const product = getProductById(productId);
  const isFavorite = favorites.includes(productId);
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState<string | undefined>(product?.weightOptions?.[0]);
  const related = useMemo(() => getRelatedProducts(productId, 4), [productId]);

  if (!product) {
    return null;
  }

  const onSale = Boolean(product.oldPrice);
  const savings = onSale ? (product.oldPrice! - product.price) * quantity : 0;

  const handleAdd = () => {
    addToCart(product, quantity, weight);
    toast.success(`Added ${quantity} x ${product.name}`, {
      description: `${weight ?? product.weight} - ${formatCurrency(product.price * quantity)}`,
      duration: 1700,
    });
    navigate({ name: "cart" });
  };

  const handleShare = async () => {
    const message = `${product.name} - ${formatCurrency(product.price)} at Fresh Halal Direct`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: message });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
      }
      toast.success("Product details copied");
    } catch {
      toast.error("Share was cancelled");
    }
  };

  return (
    <div className="animate-screen-in pb-24 bg-background min-h-full">
      <div className="relative bg-paper aspect-[4/3.6]">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />

        <button
          onClick={back}
          aria-label="Back"
          className="tap absolute left-3 w-10 h-10 rounded-full bg-surface/95 backdrop-blur grid place-items-center shadow-card active:scale-90 transition-transform"
          style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <div
          className="absolute right-3 flex flex-col gap-2"
          style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <button
            onClick={() => toggleFavorite(product.id)}
            aria-label="Save"
            className="tap w-10 h-10 rounded-full bg-surface/95 backdrop-blur grid place-items-center shadow-card active:scale-90 transition-transform"
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? "fill-sale text-sale" : "text-foreground/70"}`}
              strokeWidth={2.5}
            />
          </button>
          <button
            onClick={handleShare}
            aria-label="Share"
            className="tap w-10 h-10 rounded-full bg-surface/95 backdrop-blur grid place-items-center shadow-card active:scale-90 transition-transform"
          >
            <Share2 className="w-4 h-4 text-foreground/70" strokeWidth={2.5} />
          </button>
        </div>
        {onSale && (
          <div className="absolute bottom-4 left-4">
            <ProductBadge
              label={`Save ${formatCurrency(savings)}`}
              variant="Sale"
              className="!h-7 !px-3 !text-xs"
            />
          </div>
        )}
      </div>

      <div className="bg-surface -mt-5 rounded-t-3xl px-5 pt-5 relative shadow-elevated">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-foreground/15" />

        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.tags.map((tag) => (
            <ProductBadge key={tag} label={tag} />
          ))}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-[26px] leading-[1.05] font-semibold tracking-tight text-balance">
              {product.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              {product.weight}
              {product.origin ? ` - ${product.origin}` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-serif text-[26px] font-semibold leading-none text-primary tabular-nums">
              {formatCurrency(product.price)}
            </p>
            {onSale && (
              <p className="text-xs text-muted-foreground line-through mt-1.5 tabular-nums">
                {formatCurrency(product.oldPrice!)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-foreground text-background">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
              <BadgeCheck className="w-5 h-5" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold">100% halal certified</p>
              <p className="text-[11px] text-background/70 leading-tight mt-0.5">
                Halal certified - hand-trimmed - packed for same-day delivery
              </p>
            </div>
          </div>
        </div>

        {product.weightOptions && product.weightOptions.length > 1 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Choose weight
              </p>
              <p className="text-[11px] text-muted-foreground">{weight}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {product.weightOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setWeight(option)}
                  className={`tap h-11 px-5 rounded-full text-sm font-bold border-2 active:scale-95 transition-all ${
                    weight === option
                      ? "bg-foreground text-background border-foreground"
                      : "bg-surface text-foreground border-border"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
            About this cut
          </p>
          <p className="text-[14px] text-foreground/85 leading-relaxed">{product.description}</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <TrustBullet Icon={Flame} label="Cut to order" sub={product.prepTime ?? "Fresh"} />
          <TrustBullet Icon={Truck} label="Same-day" sub="Order by 2pm" />
          <TrustBullet Icon={Shield} label="Quality" sub="Money-back promise" />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">
              Quantity
            </p>
            <p className="text-xs text-muted-foreground">
              {quantity} x {formatCurrency(product.price)}
            </p>
          </div>
          <QtyStepper value={quantity} onChange={setQuantity} min={1} max={20} size="lg" />
        </div>

        <div className="mt-4">
          <button
            onClick={handleAdd}
            className="tap w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-fab active:scale-[0.98] transition-transform flex items-center justify-between px-5"
          >
            <span className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-primary-foreground/15 grid place-items-center">
                <Plus className="w-4 h-4" strokeWidth={3} />
              </span>
              Add to cart
            </span>
            <span className="tabular-nums">{formatCurrency(product.price * quantity)}</span>
          </button>
        </div>

        {related.length > 0 && (
          <div className="mt-7 -mx-5">
            <SectionHeader eyebrow="You might also like" title="Pair it with" />
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-3 px-5 pb-1">
                {related.map((item) => (
                  <ProductCard key={item.id} product={item} variant="horizontal" />
                ))}
              </div>
            </div>
          </div>
        )}
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
