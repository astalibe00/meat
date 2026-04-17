import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getMarketplaceProductMeta, type ProductViewMode } from "../lib/marketplace";
import type { Product } from "../lib/types";
import { formatPrice, toNumber } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";

interface ProductCardProps {
  onAdd: (product: Product) => void;
  priorityLabel?: string;
  product: Product;
  view?: ProductViewMode;
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M12 20.4 4.95 13.5a4.56 4.56 0 0 1 0-6.65 4.97 4.97 0 0 1 6.82 0L12 7.08l.23-.23a4.97 4.97 0 0 1 6.82 0 4.56 4.56 0 0 1 0 6.65L12 20.4Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CompareIcon({ active }: { active: boolean }) {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M8 5v12m0 0-3-3m3 3 3-3M16 19V7m0 0-3 3m3-3 3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      {active ? <circle cx="12" cy="12" fill="currentColor" r="1.5" /> : null}
    </svg>
  );
}

function QuickAddIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function ProductCard({
  onAdd,
  priorityLabel,
  product,
  view = "grid",
}: ProductCardProps) {
  const meta = getMarketplaceProductMeta(product);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const toggleCompare = useAppStore((state) => state.toggleCompare);
  const favoriteIds = useAppStore((state) => state.favoriteIds);
  const compareIds = useAppStore((state) => state.compareIds);
  const isFavorite = favoriteIds.includes(product.id);
  const isCompared = compareIds.includes(product.id);
  const currentPrice = toNumber(product.price);
  const priority = priorityLabel ?? (meta.freshness === "fresh" ? "Yangi" : "Muzlatilgan");

  if (view === "list") {
    return (
      <Link className="block" to={`/products/${product.id}`}>
        <div className="product-card-list">
          <div className="media-shell h-36 w-32 shrink-0">
            {product.image_url ? (
              <img alt={product.name} className="h-full w-full object-cover" src={product.image_url} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-black text-primary">
                {product.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="absolute left-3 top-3 z-10 flex gap-2">
              <span className="info-pill bg-white/[0.96]">{priority}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-textSecondary">
                  {meta.proteinType}
                </p>
                <h3 className="line-clamp-2 text-lg font-black text-textPrimary">{product.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  className={`inline-icon-button ${isFavorite ? "active" : ""}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                  type="button"
                >
                  <HeartIcon active={isFavorite} />
                </button>
                <button
                  className={`inline-icon-button ${isCompared ? "active" : ""}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleCompare(product.id);
                  }}
                  type="button"
                >
                  <CompareIcon active={isCompared} />
                </button>
              </div>
            </div>

            <p className="mt-2 text-sm text-textSecondary">
              {meta.sellerName} • {meta.region}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-textSecondary">
              {product.description || `${meta.cutType}, ${meta.packaging}, ${meta.estimatedFreshness}.`}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="badge-soft">{meta.halal ? "Halal certified" : "Standard"}</span>
              <span className={meta.stockTone === "success" ? "badge-success" : "badge-warning"}>
                {meta.stockLabel}
              </span>
              <span className="badge-soft">MOQ {meta.minimumOrderLabel.replace("Min. ", "")}</span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-textPrimary">
                    {formatPrice(currentPrice)}
                  </span>
                  <span className="text-sm font-bold text-textSecondary">{meta.unitLabel}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-textSecondary">
                  <span className="line-through">{formatPrice(meta.compareAtPrice)}</span>
                  <span className="font-bold text-primary">-{meta.discountPercent}%</span>
                  <span>{meta.rating.toFixed(1)} ({meta.reviewCount})</span>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="btn-secondary flex items-center gap-2 !px-4"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onAdd(product);
                }}
                type="button"
              >
                <QuickAddIcon />
                Qo'shish
              </motion.button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link className="block" to={`/products/${product.id}`}>
      <div className="product-card">
        <div className="media-shell mb-4 h-56 w-full">
          {product.image_url ? (
            <img alt={product.name} className="h-full w-full object-cover" src={product.image_url} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 shadow-inner">
              <span className="text-5xl font-black text-primary">
                {product.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}

          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
            <span className="info-pill bg-white/[0.96]">{priority}</span>
            <span className="info-pill bg-[#17362f]/90 text-white">
              {meta.halal ? "Halal" : "Classic"}
            </span>
          </div>

          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button
              className={`inline-icon-button ${isFavorite ? "active" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleFavorite(product.id);
              }}
              type="button"
            >
              <HeartIcon active={isFavorite} />
            </button>
            <button
              className={`inline-icon-button ${isCompared ? "active" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleCompare(product.id);
              }}
              type="button"
            >
              <CompareIcon active={isCompared} />
            </button>
          </div>

          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/80">
                  {meta.sellerName}
                </p>
                <h3 className="line-clamp-2 text-xl font-black text-white">{product.name}</h3>
              </div>
              <div className="rounded-full bg-white/[0.96] px-3 py-2 text-right shadow-sm">
                <p className="text-base font-black text-primary">{formatPrice(currentPrice)}</p>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-textSecondary">
                  {meta.unitLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="badge-soft">{meta.cutType}</span>
            <span className={meta.stockTone === "success" ? "badge-success" : "badge-warning"}>
              {meta.stockLabel}
            </span>
          </div>

          <p className="line-clamp-2 text-sm leading-6 text-textSecondary">
            {product.description || `${meta.packaging}, ${meta.origin}, ${meta.estimatedFreshness}.`}
          </p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-[22px] bg-bgMain/80 px-3 py-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-textSecondary">
                MOQ
              </p>
              <p className="mt-1 font-black text-textPrimary">{meta.minimumOrderLabel}</p>
            </div>
            <div className="rounded-[22px] bg-bgMain/80 px-3 py-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-textSecondary">
                Reyting
              </p>
              <p className="mt-1 font-black text-textPrimary">
                {meta.rating.toFixed(1)} • {meta.reviewCount}
              </p>
            </div>
          </div>
        </div>

        <div className="soft-divider mt-4" />

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-primary">{formatPrice(currentPrice)}</span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary line-through">
                {formatPrice(meta.compareAtPrice)}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">
              {meta.deliveryEta} • {meta.favoriteSellerLabel}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="chip-primary flex items-center gap-2"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onAdd(product);
            }}
            type="button"
          >
            <QuickAddIcon />
            Tez qo'shish
          </motion.button>
        </div>
      </div>
    </Link>
  );
}
