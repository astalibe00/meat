import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ProductCard from "../components/ProductCard";
import { ProductListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { fetchCategories, fetchProducts, queryKeys } from "../lib/queries";
import { canUseProtectedApi } from "../lib/telegram";
import type { Product } from "../lib/types";
import { formatPrice, toNumber } from "../lib/utils";

type SortOption = "popular" | "price_asc" | "price_desc";

const sortOptions = [
  { label: "Mashhur", value: "popular" as const },
  { label: "Arzondan", value: "price_asc" as const },
  { label: "Qimmatdan", value: "price_desc" as const },
];

export default function Products() {
  const [activeCategory, setActiveCategory] = useState<string>();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();
  const canAccessProtectedApi = canUseProtectedApi();

  const categoriesQuery = useQuery({
    queryFn: fetchCategories,
    queryKey: queryKeys.categories,
  });
  const productsQuery = useQuery({
    queryFn: () => fetchProducts(activeCategory, search),
    queryKey: queryKeys.products(activeCategory, search),
  });

  const addToCart = useMutation({
    mutationFn: (product: Product) =>
      api.post("/cart", {
        product_id: product.id,
        quantity: 1,
      }),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Mahsulotni savatga qo'shib bo'lmadi";
      showToast(message, "error");
    },
    onSuccess: (_data, product) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      showToast(`${product.name} savatga qo'shildi`);
    },
  });

  const products = [...(productsQuery.data ?? [])];

  if (sortBy === "price_asc") {
    products.sort((left, right) => toNumber(left.price) - toNumber(right.price));
  } else if (sortBy === "price_desc") {
    products.sort((left, right) => toNumber(right.price) - toNumber(left.price));
  }

  const averagePrice = products.length
    ? formatPrice(
        Math.round(
          products.reduce((sum, product) => sum + toNumber(product.price), 0) / products.length,
        ),
      )
    : "0 so'm";

  return (
    <div className="page-wrap space-y-5 p-4 pb-28">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow text-white/[0.72]">Menyu</p>
        <h1 className="hero-title text-[2.2rem]">Issiq va boy assortiment</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/[0.82]">
          Qidiruv, filtr va saralash bitta oqimga yig'ildi. Mahsulotni ko'ring va darhol buyurtmaga o'ting.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-[24px] bg-white/[0.12] px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Pozitsiya</p>
            <p className="mt-2 text-sm font-black text-white">{products.length || 0} ta</p>
          </div>
          <div className="rounded-[24px] bg-white/[0.12] px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">O'rtacha narx</p>
            <p className="mt-2 text-sm font-black text-white">{averagePrice}</p>
          </div>
          <div className="rounded-[24px] bg-white/[0.12] px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Yetkazish</p>
            <p className="mt-2 text-sm font-black text-white">~30 daqiqa</p>
          </div>
        </div>
      </div>

      <div className="section-shell">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Filtrlar</p>
            <h2 className="section-title">Kerakli taomni tez toping</h2>
          </div>
          <button
            className="text-sm font-semibold text-primary"
            onClick={() => void productsQuery.refetch()}
            type="button"
          >
            Yangilash
          </button>
        </div>

        <input
          className="input-field mt-4"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Kabob, steak, go'shtli set yoki kategoriya"
          type="search"
          value={search}
        />

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            className={`chip ${!activeCategory ? "bg-primary text-white" : ""}`}
            onClick={() => setActiveCategory(undefined)}
            type="button"
          >
            Barchasi
          </button>
          {categoriesQuery.data?.map((category) => (
            <button
              className={`chip ${activeCategory === category.id ? "bg-primary text-white" : ""}`}
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              type="button"
            >
              {category.icon ? `${category.icon} ` : ""}
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {sortOptions.map((option) => (
            <button
              className={`chip ${sortBy === option.value ? "bg-textPrimary text-white" : ""}`}
              key={option.value}
              onClick={() => setSortBy(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {productsQuery.isLoading ? (
        <ProductListSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              onAdd={(selectedProduct) => {
                if (!canAccessProtectedApi) {
                  showToast("Savat uchun Telegram avtorizatsiyasi kerak", "error");
                  return;
                }

                addToCart.mutate(selectedProduct);
              }}
              product={product}
            />
          ))}
        </div>
      )}

      {!productsQuery.isLoading && !products.length ? (
        <div className="surface-panel text-sm text-textSecondary">
          Hozircha mos mahsulot topilmadi.
        </div>
      ) : null}
    </div>
  );
}
