import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { ProductListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { fetchProducts, queryKeys } from "../lib/queries";
import { canUseProtectedApi } from "../lib/telegram";
import type { Product } from "../lib/types";
import { useAppStore } from "../store/useAppStore";

export default function Favorites() {
  const favoriteIds = useAppStore((state) => state.favoriteIds);
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();
  const canAccessProtectedApi = canUseProtectedApi();

  const productsQuery = useQuery({
    queryFn: () => fetchProducts(),
    queryKey: queryKeys.products(),
  });

  const addToCart = useMutation({
    mutationFn: (product: Product) =>
      api.post("/cart", {
        product_id: product.id,
        quantity: 1,
      }),
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Mahsulotni savatga qo'shib bo'lmadi", "error");
    },
    onSuccess: (_data, product) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      showToast(`${product.name} savatga qo'shildi`);
    },
  });

  const products = (productsQuery.data ?? []).filter((product) => favoriteIds.includes(product.id));

  return (
    <div className="page-wrap space-y-5 p-4 pb-32">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow text-white/70">Favorites</p>
        <h1 className="hero-title text-[2rem]">Sevimli mahsulotlar</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
          Session davomida saqlangan tanlovlar shu yerda turadi. Ularni savatchaga tez qo'shishingiz mumkin.
        </p>
      </div>

      {productsQuery.isLoading ? <ProductListSkeleton count={4} /> : null}

      {!productsQuery.isLoading && !products.length ? (
        <div className="empty-state">
          <p className="eyebrow">Favorites empty</p>
          <h2 className="section-title">Sevimli mahsulotlar topilmadi</h2>
          <p className="mt-3 text-sm leading-6 text-textSecondary">
            Mahsulot kartochkasidagi yurak tugmasi bilan favorite ro'yxatini to'ldiring.
          </p>
          <Link className="btn-primary mt-5 inline-flex !w-auto items-center justify-center px-5" to="/products">
            Katalogga o'tish
          </Link>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
}
