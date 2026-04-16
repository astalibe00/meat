import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { ProductListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import {
  fetchCategories,
  fetchOrders,
  fetchProfile,
  fetchProducts,
  queryKeys,
} from "../lib/queries";
import { canUseProtectedApi } from "../lib/telegram";
import type { Product } from "../lib/types";
import { formatPrice, toNumber } from "../lib/utils";

const highlights = [
  {
    eyebrow: "Issiq taom",
    text: "Kabob, grill va kuchli ta'mlar bir oynada jamlangan.",
    title: "Bugungi menyu ishtahani ochadi",
  },
  {
    eyebrow: "Tez yetkazish",
    text: "Buyurtma berilganidan keyin yo'lga tayyor bo'lgan oqim.",
    title: "Yaqin manzillarga 30 daqiqada",
  },
  {
    eyebrow: "Yangi tayyor",
    text: "Har mahsulot buyurtma tushishi bilan yig'iladi va qadoqlanadi.",
    title: "Sifat va issiqlik saqlanadi",
  },
];

const serviceStats = [
  { label: "Yetkazish", value: "~30 daqiqa" },
  { label: "Format", value: "Mini App" },
  { label: "Buyurtma", value: "Bir tegish" },
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

  const products = productsQuery.data ?? [];
  const featuredProducts = products.slice(0, 4);
  const topProducts = products.slice(0, 3);
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
        <p className="eyebrow text-white/[0.72]">Bugungi ta'm</p>
        <h1 className="hero-title max-w-lg">
          Ishtaha ochadigan menyu, tez yetkazish va toza buyurtma oqimi
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/[0.82]">
          {profileQuery.data?.is_registered
            ? `${profileQuery.data.first_name}, bugungi eng mazali tanlovlar sizni kutyapti.`
            : "Telefonni bir marta saqlang, keyingi buyurtmalar bir necha soniyada tayyor bo'ladi."}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {serviceStats.map((stat) => (
            <div className="rounded-[24px] bg-white/[0.12] px-3 py-3 backdrop-blur-sm" key={stat.label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
                {stat.label}
              </p>
              <p className="mt-2 text-sm font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="chip bg-white text-textPrimary" to="/products">
            Issiq menyu
          </Link>
          <Link className="chip bg-white/[0.14] text-white" to="/orders">
            Buyurtmalar
          </Link>
          <Link className="chip bg-white/[0.14] text-white" to="/profile">
            Profil
          </Link>
          {profileQuery.data?.is_admin ? (
            <Link className="chip bg-white/[0.14] text-white" to="/admin">
              Admin panel
            </Link>
          ) : null}
        </div>
      </header>

      <section className="section-shell">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Qidiruv</p>
            <h2 className="section-title">Bugungi taomni toping</h2>
          </div>
          <Link className="text-sm font-bold text-primary" to="/products">
            To'liq menyu
          </Link>
        </div>

        <input
          className="input-field mt-4"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Kabob, steak, sous yoki kategoriya qidiring"
          type="search"
          value={search}
        />
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {highlights.map((item) => (
          <div className="flavor-card" key={item.title}>
            <p className="eyebrow text-primary">{item.eyebrow}</p>
            <h3 className="mt-2 text-lg font-black text-textPrimary">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-textSecondary">{item.text}</p>
          </div>
        ))}
      </div>

      {fastReorderOrder ? (
        <div className="warm-stat">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-white/[0.72]">Tez qayta buyurtma</p>
              <h2 className="mt-2 text-2xl font-black">Oxirgi buyurtma bir tegishda savatchada</h2>
            </div>
            <button className="chip shrink-0 bg-white text-textPrimary" onClick={() => reorder.mutate(fastReorderOrder.id)} type="button">
              Qayta qo'shish
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/[0.82]">
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

      {topProducts.length ? (
        <section className="section-shell">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Top sotuvlar</p>
              <h2 className="section-title">Ko'p tanlanayotgan mahsulotlar</h2>
            </div>
            <Link className="text-sm font-bold text-primary" to="/products">
              Ko'proq
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {topProducts.map((product, index) => (
              <div className="flavor-card" key={product.id}>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  <span>{`Top 0${index + 1}`}</span>
                  <span>Chef tavsiya</span>
                </div>
                <h3 className="mt-3 text-lg font-black text-textPrimary">{product.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-textSecondary">
                  {product.description || "Mazali tanlov va kuchli porsiya."}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-base font-black text-primary">
                    {formatPrice(toNumber(product.price))}
                  </span>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      if (!canAccessProtectedApi) {
                        showToast("Savat uchun Telegram avtorizatsiyasi kerak", "error");
                        return;
                      }

                      addToCart.mutate(product);
                    }}
                    type="button"
                  >
                    Qo'shish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-between">
        <h2 className="section-title">Tanlangan mahsulotlar</h2>
        <Link className="text-sm font-bold text-primary" to="/products">
          Filtrlar bilan ko'rish
        </Link>
      </div>

      {productsQuery.isLoading ? (
        <ProductListSkeleton />
      ) : (
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
      )}

      {!productsQuery.isLoading && !products.length ? (
        <div className="surface-panel text-sm text-textSecondary">
          Hozircha mos mahsulot topilmadi.
        </div>
      ) : null}
    </div>
  );
}
