import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { toast } from "sonner";
import { type Product } from "@/data/products";
import { useApp } from "@/store/useApp";
import { cn } from "@/lib/utils";
import { ProductBadge } from "./ProductBadge";

interface Props {
  product: Product;
  variant?: "horizontal" | "grid" | "compact";
  className?: string;
}

export function ProductCard({ product, variant = "horizontal", className }: Props) {
  const navigate = useApp((state) => state.navigate);
  const addToCart = useApp((state) => state.addToCart);
  const isFavorite = useApp((state) => state.favorites.includes(product.id));
  const toggleFavorite = useApp((state) => state.toggleFavorite);
  const [bump, setBump] = useState(false);

  const onSale = Boolean(product.oldPrice);
  const savings = onSale
    ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)
    : 0;
  const primaryTag = product.tags[0];

  const openProduct = () => navigate({ name: "product", id: product.id });

  const handleAdd = () => {
    addToCart(product, 1, product.weightOptions?.[0]);
    setBump(true);
    window.setTimeout(() => setBump(false), 350);
    toast.success(`Added ${product.name}`, {
      description: `$${product.price.toFixed(2)} - ${product.weight}`,
      duration: 1500,
    });
  };

  const handleFavorite = () => {
    toggleFavorite(product.id);
  };

  if (variant === "compact") {
    return (
      <article
        className={cn(
          "bg-surface rounded-2xl p-2 shrink-0 w-[148px] shadow-xs transition-transform",
          className,
        )}
      >
        <button onClick={openProduct} className="tap block w-full text-left">
          <div className="relative aspect-[5/4] rounded-xl overflow-hidden bg-paper mb-2">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {onSale && (
              <span className="absolute top-1.5 left-1.5 chip bg-sale text-destructive-foreground !h-5 !px-2 !text-[9px]">
                -{savings}%
              </span>
            )}
          </div>
          <h3 className="text-[13px] font-semibold leading-tight line-clamp-1">{product.name}</h3>
        </button>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold tabular-nums">${product.price.toFixed(2)}</span>
          <button
            onClick={handleAdd}
            className={cn(
              "tap shrink-0 w-7 h-7 rounded-full bg-foreground text-background grid place-items-center active:scale-90 transition-transform",
              bump && "animate-pop",
            )}
            aria-label={`Add ${product.name}`}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
        </div>
      </article>
    );
  }

  if (variant === "grid") {
    return (
      <article
        className={cn(
          "bg-surface rounded-2xl p-2.5 shadow-card flex flex-col group",
          className,
        )}
      >
        <div className="relative">
          <button onClick={openProduct} className="tap block w-full text-left">
            <div className="aspect-square rounded-xl overflow-hidden bg-paper mb-2.5">
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105"
              />
            </div>
          </button>
          {onSale ? (
            <ProductBadge label={`-${savings}%`} variant="Sale" className="absolute top-2 left-2" />
          ) : primaryTag ? (
            <ProductBadge label={primaryTag} className="absolute top-2 left-2" />
          ) : null}
          <button
            onClick={handleFavorite}
            aria-label={`Save ${product.name}`}
            className="tap absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface/90 backdrop-blur grid place-items-center shadow-xs active:scale-90 transition-transform"
          >
            <Heart
              className={cn("w-3.5 h-3.5", isFavorite ? "fill-sale text-sale" : "text-foreground/60")}
              strokeWidth={2.5}
            />
          </button>
        </div>
        <button onClick={openProduct} className="tap block w-full text-left flex-1 min-h-0">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-balance">
            {product.name}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{product.weight}</p>
        </button>
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
          <button
            onClick={handleAdd}
            className={cn(
              "tap shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-fab active:scale-90 transition-transform",
              bump && "animate-pop",
            )}
            aria-label={`Add ${product.name}`}
          >
            <Plus className="w-4 h-4" strokeWidth={2.75} />
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "shrink-0 w-44 text-left bg-surface rounded-2xl p-2.5 shadow-card group",
        className,
      )}
    >
      <div className="relative">
        <button onClick={openProduct} className="tap block w-full text-left">
          <div className="aspect-square rounded-xl overflow-hidden bg-paper mb-2.5">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105"
            />
          </div>
        </button>
        {onSale ? (
          <ProductBadge label={`-${savings}%`} variant="Sale" className="absolute top-2 left-2" />
        ) : primaryTag ? (
          <ProductBadge label={primaryTag} className="absolute top-2 left-2" />
        ) : null}
        <button
          onClick={handleFavorite}
          aria-label={`Save ${product.name}`}
          className="tap absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface/90 backdrop-blur grid place-items-center shadow-xs active:scale-90 transition-transform"
        >
          <Heart
            className={cn("w-3.5 h-3.5", isFavorite ? "fill-sale text-sale" : "text-foreground/60")}
            strokeWidth={2.5}
          />
        </button>
      </div>
      <button onClick={openProduct} className="tap block w-full text-left">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5em] text-balance">
          {product.name}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{product.weight}</p>
      </button>
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
        <button
          onClick={handleAdd}
          className={cn(
            "tap shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-fab active:scale-90 transition-transform",
            bump && "animate-pop",
          )}
          aria-label={`Add ${product.name}`}
        >
          <Plus className="w-4 h-4" strokeWidth={2.75} />
        </button>
      </div>
    </article>
  );
}
