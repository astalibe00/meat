import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { ProductListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { getMarketplaceProductMeta } from "../lib/marketplace";
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
import { useAppStore } from "../store/useAppStore";

const trustHighlights = [
  {
    description: "Har partiya halal nazoratidan o‘tadi va seller verify qilinadi.",
    title: "Halal certified",
  },
  {
    description: "Veterinariya tekshiruvi va sovuq zanjir bilan yetkaziladi.",
    title: "Veterinary checked",
  },
  {
    description: "Fresh buyurtmalar tez slot bilan, frozen buyurtmalar xavfsiz zaxirada.",
    title: "Cold delivery",
  },
];

const processSteps = [
  {
    label: "1-qadam",
    text: "Go‘sht turi, kesim va vaznni tanlang.",
    title: "Assortimentni ko‘ring",
  },
  {
    label: "2-qadam",
    text: "Savatni slot, manzil va to‘lov turi bilan tasdiqlang.",
    title: "Buyurtmani yig‘ing",
  },
  {
    label: "3-qadam",
    text: "Track sahifasida statusni real vaqtda kuzating.",
    title: "Yetkazib olish",
  },
];

const testimonials = [
  {
    quote: "Restoran uchun bir xil sifatni saqlash muhim. Bu oqimda supply va qayta buyurtma ancha tez.",
    role: "Chef, grill house",
  },
  {
    quote: "Uy uchun retail buyurtmada ham mahsulot qadoqlanishi va halal ishonchi aniq ko‘rinadi.",
    role: "Oilaviy xaridor",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>();
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();
  const canAccessProtectedApi = canUseProtectedApi();
  const favoriteIds = useAppStore((state) => state.favoriteIds);
  const compareIds = useAppStore((state) => state.compareIds);

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
  const bestSellers = [...products]
    .sort((left, right) => toNumber(right.price) - toNumber(left.price))
    .slice(0, 3);
  const discountProducts = products
    .filter((product) => getMarketplaceProductMeta(product).discountPercent >= 10)
    .slice(0, 4);
  const showcasedSellers = Array.from(
    new Map(
      products.slice(0, 6).map((product) => {
        const meta = getMarketplaceProductMeta(product);
        return [
          meta.sellerName,
          {
            sellerName: meta.sellerName,
            product,
            region: meta.region,
          },
        ];
      }),
    ).values(),
  ).slice(0, 3);
  const fastReorderOrder = ordersQuery.data?.find((order) => order.status === "completed");
  const totalProducts = products.length;
  const averagePrice = totalProducts
    ? Math.round(products.reduce((sum, product) => sum + toNumber(product.price), 0) / totalProducts)
    : 0;

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
    <div className="page-wrap space-y-6 p-4 pb-32">
      <ToastComponent />

      <header className="hero-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="eyebrow text-white/70">Premium meat marketplace</p>
            <h1 className="hero-title max-w-lg">
              Halol, fresh va verified assortiment bir Mini App ichida
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/82">
              {profileQuery.data?.is_registered
                ? `${profileQuery.data.first_name}, retail va wholesale oqimini bir joydan boshqaring.`
                : "Sifat, sovuq zanjir va tez buyurtma oqimini bitta professional katalogda ko'ring."}
            </p>
          </div>
          <div className="space-y-2 text-right">
            <span className="badge-soft border-white/20 bg-white/14 text-white">Fresh within 12 soat</span>
            <span className="badge-soft border-white/20 bg-white/14 text-white">Restaurant supply available</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Assortiment</p>
            <p className="mt-2 text-lg font-black text-white">{totalProducts || 0} ta</p>
          </div>
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">O'rtacha narx</p>
            <p className="mt-2 text-lg font-black text-white">{formatPrice(averagePrice)}</p>
          </div>
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Wishlist</p>
            <p className="mt-2 text-lg font-black text-white">{favoriteIds.length} ta</p>
          </div>
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Compare</p>
            <p className="mt-2 text-lg font-black text-white">{compareIds.length} ta</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="chip bg-white text-textPrimary" to="/products">
            Katalogni ochish
          </Link>
          <Link className="chip bg-white/14 text-white" to="/orders">
            Buyurtmalarim
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

      <section className="section-shell">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Qidiruv va discovery</p>
            <h2 className="section-title">Go'sht turi, kesim va seller bo'yicha tanlang</h2>
          </div>
          <Link className="text-sm font-bold text-primary" to="/products">
            To'liq katalog
          </Link>
        </div>

        <input
          className="input-field mt-4"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Mol go'shti, premium cut, qiyma yoki seller qidiring"
          type="search"
          value={search}
        />

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            className={`filter-chip ${!activeCategory ? "active" : ""}`}
            onClick={() => setActiveCategory(undefined)}
            type="button"
          >
            Barchasi
          </button>
          {categoriesQuery.data?.map((category) => (
            <button
              className={`filter-chip ${activeCategory === category.id ? "active" : ""}`}
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              type="button"
            >
              {category.icon ? `${category.icon} ` : ""}
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {fastReorderOrder ? (
        <section className="metric-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <p className="eyebrow text-white/70">Fast reorder</p>
              <h2 className="mt-2 text-3xl font-black">Oxirgi buyurtma bir tegishda qayta yig'iladi</h2>
              <p className="mt-3 text-sm leading-6 text-white/80">
                {fastReorderOrder.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
              </p>
            </div>
            <button
              className="chip bg-white text-textPrimary"
              onClick={() => reorder.mutate(fastReorderOrder.id)}
              type="button"
            >
              Yana buyurtma
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        {trustHighlights.map((item) => (
          <div className="trust-card" key={item.title}>
            <p className="eyebrow text-dark">{item.title}</p>
            <p className="mt-3 text-lg font-black text-textPrimary">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="section-shell">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Top categories</p>
            <h2 className="section-title">Bugungi talab yuqori yo'nalishlar</h2>
          </div>
          <Link className="text-sm font-bold text-primary" to="/products">
            Barchasini ko'rish
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categoriesQuery.data?.slice(0, 4).map((category, index) => (
            <button
              className="feature-card text-left"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              type="button"
            >
              <p className="text-sm font-black text-primary">
                0{index + 1}
              </p>
              <h3 className="mt-3 text-xl font-black text-textPrimary">
                {category.icon ? `${category.icon} ` : ""}
                {category.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                Fresh, frozen va wholesale oqimi uchun kuchli bo'lim.
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Mashhur mahsulotlar</p>
            <h2 className="section-title">Retail va wholesale uchun top picks</h2>
          </div>
          <Link className="text-sm font-bold text-primary" to="/products">
            Katalogga o'tish
          </Link>
        </div>

        {productsQuery.isLoading ? (
          <ProductListSkeleton count={4} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                onAdd={(selectedProduct) => {
                  if (!canAccessProtectedApi) {
                    showToast("Savat uchun Telegram avtorizatsiyasi kerak", "error");
                    return;
                  }

                  addToCart.mutate(selectedProduct);
                }}
                priorityLabel={index === 0 ? "Best seller" : undefined}
                product={product}
              />
            ))}
          </div>
        )}
      </section>

      {bestSellers.length ? (
        <section className="section-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Best sellers</p>
              <h2 className="section-title">Eng ko'p so'ralayotgan premium cutlar</h2>
            </div>
            <span className="badge-soft">Restaurant favorites</span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {bestSellers.map((product) => {
              const meta = getMarketplaceProductMeta(product);
              return (
                <div className="feature-card" key={product.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow text-primary">{meta.sellerName}</p>
                      <h3 className="mt-2 text-xl font-black text-textPrimary">{product.name}</h3>
                    </div>
                    <span className="badge-success">{meta.stockLabel}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-textSecondary">
                    {meta.cutType} • {meta.packaging} • {meta.region}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-black text-primary">{formatPrice(toNumber(product.price))}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">
                        {meta.unitLabel} • {meta.rating.toFixed(1)} rating
                      </p>
                    </div>
                    <Link className="chip" to={`/products/${product.id}`}>
                      Ochish
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {discountProducts.length ? (
        <section className="section-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Chegirmadagi mahsulotlar</p>
              <h2 className="section-title">Limited time offers</h2>
            </div>
            <span className="badge-danger">Flash discount</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {discountProducts.map((product) => {
              const meta = getMarketplaceProductMeta(product);
              return (
                <div className="feature-card" key={product.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-textPrimary">{product.name}</h3>
                      <p className="mt-1 text-sm text-textSecondary">{meta.sellerName}</p>
                    </div>
                    <span className="badge-danger">-{meta.discountPercent}%</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-black text-primary">{formatPrice(toNumber(product.price))}</p>
                      <p className="text-sm text-textSecondary line-through">
                        {formatPrice(meta.compareAtPrice)}
                      </p>
                    </div>
                    <Link className="chip" to={`/products/${product.id}`}>
                      Batafsil
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="section-shell">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Sellers showcase</p>
            <h2 className="section-title">Verified fermalar va yetkazib beruvchilar</h2>
          </div>
          <Link className="text-sm font-bold text-primary" to="/products">
            Seller assortimenti
          </Link>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {showcasedSellers.map((item) => {
            const meta = getMarketplaceProductMeta(item.product);
            return (
              <div className="feature-card" key={item.sellerName}>
                <p className="eyebrow text-dark">{item.region}</p>
                <h3 className="mt-2 text-xl font-black text-textPrimary">{item.sellerName}</h3>
                <p className="mt-2 text-sm leading-6 text-textSecondary">
                  {meta.favoriteSellerLabel}, {meta.packaging}, {meta.warehouseOrigin}.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="badge-success">Verified seller</span>
                  <span className="badge-soft">{meta.deliveryEta}</span>
                  <span className="badge-soft">{meta.subscriptionLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="section-shell">
          <p className="eyebrow">Qanday ishlaydi</p>
          <h2 className="section-title">3 qisqa qadam bilan buyurtma</h2>
          <div className="mt-4 space-y-3">
            {processSteps.map((step) => (
              <div className="feature-card" key={step.title}>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
                  {step.label}
                </p>
                <h3 className="mt-2 text-lg font-black text-textPrimary">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-textSecondary">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow text-white/70">B2B supply</p>
          <h2 className="mt-2 text-3xl font-black">Restoran va oshxonalar uchun contract supply</h2>
          <p className="mt-3 text-sm leading-6 text-white/80">
            MOQ, qayta buyurtma, invoice oqimi va doimiy yetkazib berish bitta tizimga yig'ilgan.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[24px] bg-white/12 px-4 py-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/64">
                Biznes foydasi
              </p>
              <p className="mt-2 text-lg font-black">Wholesale pricing, stable supply, halol verification</p>
            </div>
            <Link className="chip bg-white text-textPrimary" to="/products">
              Biznes uchun assortiment
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {testimonials.map((item) => (
          <div className="feature-card" key={item.quote}>
            <p className="text-lg font-black leading-8 text-textPrimary">“{item.quote}”</p>
            <p className="mt-4 text-sm font-semibold text-textSecondary">{item.role}</p>
          </div>
        ))}
      </section>

      {!productsQuery.isLoading && !products.length ? (
        <div className="empty-state">
          <p className="eyebrow">No results</p>
          <h2 className="section-title">Mos assortiment topilmadi</h2>
          <p className="mt-3 text-sm leading-6 text-textSecondary">
            Filtrlarni tozalang yoki boshqa kategoriya bilan qayta ko'ring.
          </p>
        </div>
      ) : null}
    </div>
  );
}
