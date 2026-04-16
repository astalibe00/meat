import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ProductCard from "../components/ProductCard";
import { ProductListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchCategories, fetchProducts, queryKeys } from "../lib/queries";
import type { Product } from "../lib/types";
import { toNumber } from "../lib/utils";

type SortOption = "popular" | "price_asc" | "price_desc";

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

  return (
    <div className="page-wrap space-y-5 p-4 pb-28">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow">Menyu</p>
        <h1 className="hero-title text-[2rem]">Mahsulotlar</h1>
        <p className="mt-2 text-sm text-white/80">
          Filtrlang, saralang va bir tegishda savatga qo'shing.
        </p>
      </div>

      <div className="surface-panel">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Qidiruv va filtrlar</h2>
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
          placeholder="Mahsulot qidirish"
          type="search"
          value={search}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="section-title">Kategoriyalar</h2>
        <button
          className="text-sm font-semibold text-primary"
          onClick={() => setActiveCategory(undefined)}
          type="button"
        >
          Tozalash
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
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

      <div className="surface-panel">
        <h2 className="section-title">Saralash</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {[
            { label: "Mashhur", value: "popular" as const },
            { label: "Narxi: arzondan", value: "price_asc" as const },
            { label: "Narxi: qimmatdan", value: "price_desc" as const },
          ].map((option) => (
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
