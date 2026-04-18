import { Product } from "@/data/products";
import { useApp } from "@/store/useApp";
import { Plus, Heart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ProductBadge } from "./ProductBadge";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
  variant?: "horizontal" | "grid" | "compact";
  className?: string;
}

export function ProductCard({ product, variant = "horizontal", className }: Props) {
  const navigate = useApp((s) => s.navigate);
  const addToCart = useApp((s) => s.addToCart);
  const isFav = useApp((s) => s.favorites.includes(product.id));
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const [bump, setBump] = useState(false);

  const onSale = !!product.oldPrice;
  const savings = onSale ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100) : 0;
  const primaryTag = product.tags[0];

  const onAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setBump(true);
    setTimeout(() => setBump(false), 350);
    toast.success(`Added · ${product.name}`, {
      description: `$${product.price.toFixed(2)} · ${product.weight}`,
      duration: 1500,
    });
  };

  const onFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  const open = () => navigate({ name: "product", id: product.id });

  // ---------- COMPACT (cart upsell rows) ----------
  if (variant === "compact") {
    return (
      <button
        onClick={open}
        className={cn(
          "tap text-left bg-surface rounded-2xl p-2 shrink-0 w-[148px] shadow-xs active:scale-[0.98] transition-transform",
          className
        )}
      >
        <div className="relative aspect-[5/4] rounded-xl overflow-hidden bg-paper mb-2">
          <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
          {onSale && (
            <span className="absolute top-1.5 left-1.5 chip bg-sale text-destructive-foreground !h-5 !px-2 !text-[9px]">
              -{savings}%
            </span>
          )}
        </div>
        <h3 className="text-[13px] font-semibold leading-tight line-clamp-1">{product.name}</h3>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold tabular-nums">${product.price.toFixed(2)}</span>
          <span
            onClick={onAdd}
            className={cn(
              "tap shrink-0 w-7 h-7 rounded-full bg-foreground text-background grid place-items-center active:scale-90 transition-transform",
              bump && "animate-pop"
            )}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
        </div>
      </button>
    );
  }

  // ---------- GRID (categories, fresh today) ----------
  if (variant === "grid") {
    return (
      <button
        onClick={open}
        className={cn(
          "tap text-left bg-surface rounded-2xl p-2.5 shadow-card flex flex-col active:scale-[0.98] transition-transform group",
          className
        )}
      >
        <div className="relative aspect-square rounded-xl overflow-hidden bg-paper mb-2.5">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105"
          />
          {onSale ? (
            <ProductBadge label={`-${savings}%`} variant="Sale" className="absolute top-2 left-2" />
          ) : primaryTag ? (
            <ProductBadge label={primaryTag} className="absolute top-2 left-2" />
          ) : null}
          <button
            onClick={onFav}
            aria-label="Favorite"
            className="tap absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface/90 backdrop-blur grid place-items-center shadow-xs active:scale-90 transition-transform"
          >
            <Heart
              className={cn("w-3.5 h-3.5", isFav ? "fill-sale text-sale" : "text-foreground/60")}
              strokeWidth={2.5}
            />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-balance">
            {product.name}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{product.weight}</p>
        </div>
        <div className="flex items-end justify-between mt-2.5">
          <div className="flex flex-col">
            <span className="text-base font-bold leading-none tabular-nums">
              ${product.price.toFixed(2)}
            </span>
            {onSale && (
              <span className="text-[11px] text-muted-foreground line-through mt-1 tabular-nums">
                ${product.oldPrice!.toFixed(2)}
              </span>
            )}
          </div>
          <span
            onClick={onAdd}
            className={cn(
              "tap shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-fab active:scale-90 transition-transform",
              bump && "animate-pop"
            )}
          >
            <Plus className="w-4 h-4" strokeWidth={2.75} />
          </span>
        </div>
      </button>
    );
  }

  // ---------- HORIZONTAL (scroll rows) ----------
  return (
    <button
      onClick={open}
      className={cn(
        "tap shrink-0 w-44 text-left bg-surface rounded-2xl p-2.5 shadow-card active:scale-[0.98] transition-transform group",
        className
      )}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-paper mb-2.5">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105"
        />
        {onSale ? (
          <ProductBadge label={`-${savings}%`} variant="Sale" className="absolute top-2 left-2" />
        ) : primaryTag ? (
          <ProductBadge label={primaryTag} className="absolute top-2 left-2" />
        ) : null}
        <button
          onClick={onFav}
          aria-label="Favorite"
          className="tap absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface/90 backdrop-blur grid place-items-center shadow-xs active:scale-90 transition-transform"
        >
          <Heart
            className={cn("w-3.5 h-3.5", isFav ? "fill-sale text-sale" : "text-foreground/60")}
            strokeWidth={2.5}
          />
        </button>
      </div>
      <h3 className="text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5em] text-balance">
        {product.name}
      </h3>
      <p className="text-[11px] text-muted-foreground mt-0.5">{product.weight}</p>
      <div className="flex items-end justify-between mt-2.5">
        <div className="flex flex-col">
          <span className="text-base font-bold leading-none tabular-nums">
            ${product.price.toFixed(2)}
          </span>
          {onSale && (
            <span className="text-[11px] text-muted-foreground line-through mt-1 tabular-nums">
              ${product.oldPrice!.toFixed(2)}
            </span>
          )}
        </div>
        <span
          onClick={onAdd}
          className={cn(
            "tap shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-fab active:scale-90 transition-transform",
            bump && "animate-pop"
          )}
        >
          <Plus className="w-4 h-4" strokeWidth={2.75} />
        </span>
      </div>
    </button>
  );
}
