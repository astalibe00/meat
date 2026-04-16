import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { formatPrice, toNumber } from "../lib/utils";
import type { Product } from "../lib/types";

interface ProductCardProps {
  onAdd: (product: Product) => void;
  product: Product;
}

export default function ProductCard({ onAdd, product }: ProductCardProps) {
  const price = toNumber(product.price);

  return (
    <Link className="block" to={`/products/${product.id}`}>
      <div className="product-card">
        {product.image_url ? (
          <img
            alt={product.name}
            className="mb-3 h-36 w-full rounded-[26px] object-cover"
            src={product.image_url}
          />
        ) : (
          <div className="mb-3 flex h-36 w-full items-center justify-center rounded-[26px] bg-primary/10 shadow-inner">
            <span className="text-4xl font-black text-primary">
              {product.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}

        <div className="space-y-1">
          <h3 className="truncate text-base font-black text-textPrimary">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-sm text-textSecondary">
            {product.description || "Mahsulot tavsifi mavjud emas"}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-base font-black text-primary">
            {formatPrice(price)}
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onAdd(product);
            }}
            type="button"
          >
            Savatga qo'shish
          </motion.button>
        </div>
      </div>
    </Link>
  );
}
