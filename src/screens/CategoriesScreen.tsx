import { useMemo, useState } from "react";
import { useApp } from "@/store/useApp";
import { CATEGORIES, CategoryId, PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/app/ProductCard";
import { FilterChip } from "@/components/app/FilterChip";
import { EmptyState } from "@/components/app/EmptyState";
import { PackageSearch, SlidersHorizontal } from "lucide-react";

type SortKey = "popular" | "price-asc" | "price-desc" | "freshest" | "value";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "popular", label: "Popular" },
  { id: "price-asc", label: "Price ↑" },
  { id: "price-desc", label: "Price ↓" },
  { id: "freshest", label: "Freshest" },
  { id: "value", label: "Best Value" },
];

export function CategoriesScreen() {
  const screen = useApp((s) => s.screen);
  const initial = screen.name === "categories" ? (screen.category as CategoryId | undefined) : undefined;
  const [active, setActive] = useState<CategoryId | "all">(initial ?? "all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [onlySale, setOnlySale] = useState(false);

  const products = useMemo(() => {
    let list = active === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === active);
    if (onlySale) list = list.filter((p) => !!p.oldPrice);
    const sorted = [...list];
    switch (sort) {
      case "price-asc": sorted.sort((a, b) => a.price - b.price); break;
      case "price-desc": sorted.sort((a, b) => b.price - a.price); break;
      case "freshest":
        sorted.sort((a, b) => Number(b.tags.includes("Fresh")) - Number(a.tags.includes("Fresh")));
        break;
      case "value":
        sorted.sort((a, b) => Number(b.tags.includes("Best Value")) - Number(a.tags.includes("Best Value")));
        break;
      case "popular":
      default:
        sorted.sort((a, b) => Number(b.tags.includes("Popular")) - Number(a.tags.includes("Popular")));
    }
    return sorted;
  }, [active, sort, onlySale]);

  const activeCategory = CATEGORIES.find((c) => c.id === active);

  return (
    <div className="animate-screen-in pb-4">
      {/* Header */}
      <div className="px-5 pt-3 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Browse</p>
        <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
          {activeCategory ? activeCategory.name : "Shop everything"}
        </h1>
        {activeCategory && (
          <p className="text-xs text-muted-foreground mt-1">{activeCategory.tagline}</p>
        )}
      </div>

      {/* Category chips */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-5 pb-2">
          <FilterChip
            active={active === "all"}
            onClick={() => setActive("all")}
            count={PRODUCTS.length}
          >
            All
          </FilterChip>
          {CATEGORIES.map((c) => {
            const count = PRODUCTS.filter((p) => p.category === c.id).length;
            return (
              <FilterChip
                key={c.id}
                active={active === c.id}
                onClick={() => setActive(c.id)}
                count={count}
              >
                <span>{c.emoji}</span> {c.name}
              </FilterChip>
            );
          })}
        </div>
      </div>

      {/* Sort + filter row */}
      <div className="overflow-x-auto no-scrollbar mt-1">
        <div className="flex gap-2 px-5 pb-3 items-center">
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground pr-1">
            <SlidersHorizontal className="w-3 h-3" strokeWidth={2.5} /> Sort
          </span>
          {SORTS.map((s) => (
            <FilterChip key={s.id} active={sort === s.id} onClick={() => setSort(s.id)}>
              {s.label}
            </FilterChip>
          ))}
          <span className="w-px h-4 bg-border mx-1 shrink-0" />
          <FilterChip active={onlySale} onClick={() => setOnlySale((v) => !v)}>
            🔥 On sale
          </FilterChip>
        </div>
      </div>

      {/* Results */}
      <div className="px-5 mt-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold tabular-nums text-foreground">{products.length}</span>{" "}
            {products.length === 1 ? "product" : "products"}
          </p>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="w-9 h-9" strokeWidth={1.75} />}
            title="No products match"
            body="Try clearing filters or pick a different category."
            action={
              <button
                onClick={() => { setActive("all"); setOnlySale(false); }}
                className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
