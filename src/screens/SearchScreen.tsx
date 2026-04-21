import { useMemo, useState } from "react";
import { Clock, Search, SearchX, TrendingUp, X } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { ProductCard } from "@/components/app/ProductCard";
import { CATEGORIES } from "@/data/products";
import { getPersonalizedProducts, getSearchSuggestions, searchProducts } from "@/lib/catalog-intelligence";
import { useApp } from "@/store/useApp";

const POPULAR_QUERIES = [
  "Mol ribay steyki",
  "Qo'y kotleti",
  "Butun tovuq",
  "Tovuq qanotlari",
  "Oilaviy halol to'plam",
  "Yovvoyi losos",
];

export function SearchScreen() {
  const recentSearches = useApp((state) => state.recentSearches);
  const pushRecentSearch = useApp((state) => state.pushRecentSearch);
  const clearRecentSearches = useApp((state) => state.clearRecentSearches);
  const navigate = useApp((state) => state.navigate);
  const rawProducts = useApp((state) => state.products);
  const favorites = useApp((state) => state.favorites);
  const orders = useApp((state) => state.orders);
  const [query, setQuery] = useState("");
  const products = useMemo(
    () => rawProducts.filter((product) => product.enabled !== false),
    [rawProducts],
  );
  const featured = useMemo(() => {
    const personalized = getPersonalizedProducts(products, favorites, orders, 6);
    return personalized.length > 0 ? personalized : products.slice(0, 6);
  }, [favorites, orders, products]);
  const hasPersonalizedFeatured = useMemo(
    () => getPersonalizedProducts(products, favorites, orders, 1).length > 0,
    [favorites, orders, products],
  );

  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    return searchProducts(products, query);
  }, [products, query]);

  const suggestions = useMemo(() => getSearchSuggestions(products, query), [products, query]);

  const onSubmit = () => {
    if (query.trim()) {
      pushRecentSearch(query.trim());
    }
  };

  return (
    <div className="animate-screen-in px-5 pt-3 pb-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Qidiruv</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5 mb-4">
        Nima izlayapsiz?
      </h1>

      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          strokeWidth={2.5}
        />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={onSubmit}
          onKeyDown={(event) => event.key === "Enter" && onSubmit()}
          placeholder="Mol, qo'y, tovuq mahsulotlarini qidiring..."
          className="w-full h-12 rounded-full bg-surface shadow-card pl-11 pr-12 text-sm font-medium outline-none focus:ring-2 focus:ring-primary border border-border/50"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="tap absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full bg-paper active:scale-90 transition-transform"
            aria-label="Tozalash"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {!query && (
        <div className="mt-6 space-y-6">
          {recentSearches.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  So'nggi qidiruvlar
                </h2>
                <button
                  onClick={clearRecentSearches}
                  className="tap text-[11px] font-semibold text-primary active:scale-95 transition-transform"
                >
                  Tozalash
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="tap inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-surface shadow-xs border border-border/50 text-xs font-semibold active:scale-95 transition-transform"
                  >
                    <Clock className="w-3 h-3 text-muted-foreground" strokeWidth={2.5} />
                    {item}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
              Ommabop qidiruvlar
            </h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_QUERIES.map((item) => (
                <button
                  key={item}
                  onClick={() => setQuery(item)}
                  className="tap inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-primary-soft text-primary-soft-foreground text-xs font-semibold active:scale-95 transition-transform"
                >
                  <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
              Kategoriyalar
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => navigate({ name: "categories", category: category.id })}
                  className="tap aspect-[4/3] rounded-2xl bg-surface shadow-xs border border-border/40 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="text-2xl">{category.emoji}</span>
                  <span className="text-[11px] font-bold">{category.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
              {featured.length && hasPersonalizedFeatured ? "Siz uchun tavsiyalar" : "Tavsiya etilgan mahsulotlar"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} variant="grid" />
              ))}
            </div>
          </section>
        </div>
      )}

      {query && (
        <div className="mt-5">
          {suggestions.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="tap rounded-full bg-primary-soft px-3 py-2 text-[11px] font-semibold text-primary-soft-foreground active:scale-95 transition-transform"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mb-3">
            <span className="font-bold tabular-nums text-foreground">{results.length}</span>{" "}
            ta natija{" "}
            <span className="text-foreground font-semibold">"{query}"</span>
          </p>
          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} variant="grid" />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<SearchX className="w-9 h-9" strokeWidth={1.75} />}
              title="Hech narsa topilmadi"
              body={`"${query}" bo'yicha natija topilmadi. Boshqa mahsulot yoki kategoriya sinab ko'ring.`}
              action={
                <button
                  onClick={() => setQuery("")}
                  className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
                >
                  Qidiruvni tozalash
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
