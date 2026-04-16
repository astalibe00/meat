import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Product } from "../lib/types";
import { formatPrice, toNumber } from "../lib/utils";

interface ProductCardProps {
  onAdd: (product: Product) => void;
  product: Product;
}

export default function ProductCard({ onAdd, product }: ProductCardProps) {
  const price = toNumber(product.price);
  const categoryLabel = product.categories?.name ?? "Chef tanlovi";

  return (
    <Link className="block" to={`/products/${product.id}`}>
      <div className="product-card">
        <div className="media-shell mb-3 h-44 w-full">
          {product.image_url ? (
            <img
              alt={product.name}
              className="h-full w-full object-cover"
              src={product.image_url}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 shadow-inner">
              <span className="text-4xl font-black text-primary">
                {product.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}

          <div className="absolute left-3 top-3 z-10">
            <span className="info-pill bg-white/[0.92]">Issiq taklif</span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                {categoryLabel}
              </p>
              <h3 className="truncate text-lg font-black text-white">
                {product.name}
              </h3>
            </div>
            <span className="rounded-full bg-white/[0.92] px-3 py-1.5 text-sm font-black text-primary shadow-sm">
              {formatPrice(price)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="line-clamp-2 text-sm text-textSecondary">
            {product.description || "Mahsulot tavsifi mavjud emas"}
          </p>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">
            <span>Yangi tayyorlanadi</span>
            <span>~30 daqiqa</span>
          </div>
        </div>

        <div className="soft-divider mt-4" />

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">
              Bugungi narx
            </p>
            <span className="text-base font-black text-primary">
              {formatPrice(price)}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onAdd(product);
            }}
            type="button"
          >
            Buyurtma
          </motion.button>
        </div>
      </div>
    </Link>
  );
}
