import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ProductCard from "../components/ProductCard";
import { ProductListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import {
  getMarketplaceProductMeta,
  type ProductFreshness,
  type ProductViewMode,
} from "../lib/marketplace";
import { fetchCategories, fetchProducts, queryKeys } from "../lib/queries";
import { canUseProtectedApi } from "../lib/telegram";
import type { Product } from "../lib/types";
import { formatPrice, toNumber } from "../lib/utils";

type SortOption = "popular" | "price_asc" | "price_desc" | "rating";

const sortOptions = [
  { label: "Mashhurlik", value: "popular" as const },
  { label: "Arzondan", value: "price_asc" as const },
  { label: "Qimmatdan", value: "price_desc" as const },
  { label: "Reyting", value: "rating" as const },
];

export default function Products() {
  const [activeCategory, setActiveCategory] = useState<string>();
  const [search, setSearch] = useState("");
  const [freshness, setFreshness] = useState<ProductFreshness | "all">("all");
  const [halalOnly, setHalalOnly] = useState(false);
  const [region, setRegion] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [view, setView] = useState<ProductViewMode>("grid");
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();
  const canAccessProtectedApi = canUseProtectedApi();

  const categoriesQuery = useQuery({
    queryFn: fetchCategories,
    queryKey: queryKeys.categories,
  });
  const productsQuery = useQuery({
    queryFn: () => fetchProducts(activeCategory, deferredSearch),
    queryKey: queryKeys.products(activeCategory, deferredSearch),
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

  const products = (productsQuery.data ?? []).filter((product) => {
    const meta = getMarketplaceProductMeta(product);

    if (freshness !== "all" && meta.freshness !== freshness) {
      return false;
    }

    if (halalOnly && !meta.halal) {
      return false;
    }

    if (region !== "all" && meta.region !== region) {
      return false;
    }

    return true;
  });

  if (sortBy === "price_asc") {
    products.sort((left, right) => toNumber(left.price) - toNumber(right.price));
  } else if (sortBy === "price_desc") {
    products.sort((left, right) => toNumber(right.price) - toNumber(left.price));
  } else if (sortBy === "rating") {
    products.sort(
      (left, right) =>
        getMarketplaceProductMeta(right).rating - getMarketplaceProductMeta(left).rating,
    );
  }

  const regions = Array.from(
    new Set((productsQuery.data ?? []).map((product) => getMarketplaceProductMeta(product).region)),
  );
  const totalValue = products.reduce((sum, product) => sum + toNumber(product.price), 0);
  const averagePrice = products.length ? Math.round(totalValue / products.length) : 0;

  return (
    <div className="page-wrap space-y-5 p-4 pb-32">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow text-white/70">Catalog / shop</p>
        <h1 className="hero-title text-[2.35rem]">Fresh va wholesale-ready assortiment</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/82">
          Go'sht turi, kesim, region va freshness bo'yicha tez filtrlang. Grid va list view bir xil tezlikda ishlaydi.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Pozitsiya</p>
            <p className="mt-2 text-lg font-black text-white">{products.length || 0} ta</p>
          </div>
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">O'rtacha narx</p>
            <p className="mt-2 text-lg font-black text-white">{formatPrice(averagePrice)}</p>
          </div>
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Fast slot</p>
            <p className="mt-2 text-lg font-black text-white">Bugun</p>
          </div>
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Wholesale</p>
            <p className="mt-2 text-lg font-black text-white">Faol</p>
          </div>
        </div>
      </div>

      <div className="section-shell space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Advanced filters</p>
            <h2 className="section-title">Tez topish uchun to'liq boshqaruv</h2>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              setActiveCategory(undefined);
              setFreshness("all");
              setHalalOnly(false);
              setRegion("all");
              setSortBy("popular");
            }}
            type="button"
          >
            Tozalash
          </button>
        </div>

        <input
          className="input-field"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Mol go'shti, premium cut, seller yoki packaging qidiring"
          type="search"
          value={search}
        />

        <div className="catalog-toolbar">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-textSecondary">
            Kategoriya
          </span>
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

        <div className="catalog-toolbar">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-textSecondary">
            Freshness
          </span>
          <button
            className={`filter-chip ${freshness === "all" ? "active" : ""}`}
            onClick={() => setFreshness("all")}
            type="button"
          >
            Barchasi
          </button>
          <button
            className={`filter-chip ${freshness === "fresh" ? "active" : ""}`}
            onClick={() => setFreshness("fresh")}
            type="button"
          >
            Fresh
          </button>
          <button
            className={`filter-chip ${freshness === "frozen" ? "active" : ""}`}
            onClick={() => setFreshness("frozen")}
            type="button"
          >
            Frozen
          </button>
          <button
            className={`filter-chip ${halalOnly ? "active" : ""}`}
            onClick={() => setHalalOnly((current) => !current)}
            type="button"
          >
            Halal only
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <select
            className="input-field"
            onChange={(event) => setRegion(event.target.value)}
            value={region}
          >
            <option value="all">Barcha regionlar</option>
            {regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="catalog-toolbar justify-center">
            {sortOptions.map((option) => (
              <button
                className={`filter-chip ${sortBy === option.value ? "active" : ""}`}
                key={option.value}
                onClick={() => setSortBy(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="catalog-toolbar justify-center">
            <button
              className={`filter-chip ${view === "grid" ? "active" : ""}`}
              onClick={() => setView("grid")}
              type="button"
            >
              Grid
            </button>
            <button
              className={`filter-chip ${view === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
              type="button"
            >
              List
            </button>
          </div>
        </div>
      </div>

      {productsQuery.isLoading ? (
        <ProductListSkeleton count={6} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
      ) : (
        <div className="grid gap-3">
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
              view="list"
            />
          ))}
        </div>
      )}

      {!productsQuery.isLoading && !products.length ? (
        <div className="empty-state">
          <p className="eyebrow">No search results</p>
          <h2 className="section-title">Mos mahsulot topilmadi</h2>
          <p className="mt-3 text-sm leading-6 text-textSecondary">
            Search yoki filterlarni yumshatib ko'ring. Wholesale va fresh filterlar birga ishlaganda natija torayishi mumkin.
          </p>
        </div>
      ) : null}
    </div>
  );
}
