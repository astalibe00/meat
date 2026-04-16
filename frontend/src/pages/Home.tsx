import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { ProductListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import {
  fetchCategories,
  fetchOrders,
  fetchProfile,
  fetchProducts,
  queryKeys,
} from "../lib/queries";
import type { Product } from "../lib/types";

const banners = [
  "30 daqiqa ichida yetkazish",
  "Telegram ichida bir tegishda buyurtma",
  "Yangi menyular har kuni yangilanadi",
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>();
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();
  const canAccessProtectedApi = canUseProtectedApi();

  const categoriesQuery = useQuery({
    queryFn: fetchCategories,
    queryKey: queryKeys.categories,
  });
  const ordersQuery = useQuery({
    enabled: canAccessProtectedApi,
    queryFn: fetchOrders,
    queryKey: queryKeys.orders,
  });
  const profileQuery = useQuery({
    enabled: canAccessProtectedApi,
    queryFn: fetchProfile,
    queryKey: queryKeys.profile,
  });
  const productsQuery = useQuery({
    queryFn: () => fetchProducts(activeCategory, deferredSearch),
    queryKey: queryKeys.products(activeCategory, deferredSearch),
  });

  const featuredProducts = productsQuery.data?.slice(0, 4) ?? [];
  const fastReorderOrder = ordersQuery.data?.find((order) => order.status === "completed");

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

  const reorder = useMutation({
    mutationFn: (orderId: string) => api.post(`/orders/${orderId}/reorder`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      showToast("Avvalgi buyurtma savatchaga qo'shildi");
    },
  });

  return (
    <div className="page-wrap space-y-6 p-4 pb-28">
      <ToastComponent />

      <header className="hero-panel">
        <p className="eyebrow">Toshkent</p>
        <h1 className="hero-title">Bir oynada do'kon, buyurtma va tracking</h1>
        <p className="mt-3 max-w-md text-sm text-white/80">
          {profileQuery.data?.is_registered
            ? `${profileQuery.data.first_name}, bugun nima buyurtma qilamiz?`
            : "Profilni to'ldirib qo'ysangiz, keyingi buyurtmalar bir necha soniyada yakunlanadi."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="chip bg-white text-textPrimary" to="/products">
            Menyuni ko'rish
          </Link>
          <Link className="chip bg-white/14 text-white" to="/profile">
            Profil
          </Link>
          {profileQuery.data?.is_admin ? (
            <Link className="chip bg-white/14 text-white" to="/admin">
              Admin panel
            </Link>
          ) : null}
        </div>
      </header>

      <input
        className="input-field"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Mahsulot qidirish"
        type="search"
        value={search}
      />

      <div className="grid gap-3 md:grid-cols-3">
        {banners.map((banner) => (
          <div className="surface-panel bg-white/85" key={banner}>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Afzallik</p>
            <p className="mt-2 text-base font-black text-textPrimary">{banner}</p>
          </div>
        ))}
      </div>

      {fastReorderOrder ? (
        <div className="surface-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-primary">Tez buyurtma</p>
              <h2 className="section-title">Oxirgi buyurtmani qayta qo'shish</h2>
            </div>
            <button className="chip" onClick={() => reorder.mutate(fastReorderOrder.id)} type="button">
              Yana buyurtma
            </button>
          </div>
          <p className="mt-3 text-sm text-textSecondary">
            {fastReorderOrder.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <h2 className="section-title">Kategoriyalar</h2>
        <Link className="text-sm font-bold text-primary" to="/products">
          Barchasi
        </Link>
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

      <div className="flex items-center justify-between">
        <h2 className="section-title">Tanlangan mahsulotlar</h2>
        <Link className="text-sm font-bold text-primary" to="/products">
          To'liq menyu
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {featuredProducts.map((product) => (
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

      <div className="flex items-center justify-between">
        <h2 className="section-title">Barcha mahsulotlar</h2>
        <Link className="text-sm font-bold text-primary" to="/products">
          Filtrlar bilan ko'rish
        </Link>
      </div>

      {productsQuery.isLoading ? (
        <ProductListSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {productsQuery.data?.map((product) => (
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

      {!productsQuery.isLoading && !productsQuery.data?.length ? (
        <div className="surface-panel text-sm text-textSecondary">
          Mahsulot topilmadi.
        </div>
      ) : null}
    </div>
  );
}
