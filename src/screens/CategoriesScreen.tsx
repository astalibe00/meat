import { useEffect, useMemo, useState } from "react";
import { PackageSearch, SlidersHorizontal } from "lucide-react";
import { FilterChip } from "@/components/app/FilterChip";
import { EmptyState } from "@/components/app/EmptyState";
import { ProductCard } from "@/components/app/ProductCard";
import { CATEGORIES, type CategoryId } from "@/data/products";
import { useApp, type CatalogSort } from "@/store/useApp";

const SORTS: { id: CatalogSort; label: string }[] = [
  { id: "popular", label: "Mashhur" },
  { id: "price-asc", label: "Arzon narx" },
  { id: "price-desc", label: "Qimmat narx" },
  { id: "freshest", label: "Eng yangi" },
  { id: "value", label: "Qulay narx" },
];

export function CategoriesScreen() {
  const screen = useApp((state) => state.screen);
  const allProducts = useApp((state) => state.products.filter((product) => product.enabled));
  const [active, setActive] = useState<CategoryId | "all">("all");
  const [sort, setSort] = useState<CatalogSort>("popular");
  const [onlySale, setOnlySale] = useState(false);

  useEffect(() => {
    if (screen.name !== "categories") {
      return;
    }

    setActive(screen.category ?? "all");
    setSort(screen.sort ?? "popular");
    setOnlySale(Boolean(screen.saleOnly));
  }, [screen]);

  const products = useMemo(() => {
    let list =
      active === "all"
        ? allProducts
        : allProducts.filter((product) => product.category === active);

    if (onlySale) {
      list = list.filter((product) => Boolean(product.oldPrice));
    }

    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "freshest":
        sorted.sort(
          (a, b) => Number(b.tags.includes("Fresh")) - Number(a.tags.includes("Fresh")),
        );
        break;
      case "value":
        sorted.sort(
          (a, b) =>
            Number(b.tags.includes("Best Value")) - Number(a.tags.includes("Best Value")),
        );
        break;
      case "popular":
      default:
        sorted.sort(
          (a, b) => Number(b.tags.includes("Popular")) - Number(a.tags.includes("Popular")),
        );
        break;
    }

    return sorted;
  }, [active, allProducts, onlySale, sort]);

  const activeCategory = CATEGORIES.find((category) => category.id === active);

  return (
    <div className="animate-screen-in pb-4">
      <div className="px-5 pt-3 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Katalog</p>
        <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
          {activeCategory ? activeCategory.name : "Barcha mahsulotlar"}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {activeCategory ? activeCategory.tagline : "Halol mahsulotlar, buyurtmaga tayyor."}
        </p>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-5 pb-2">
          <FilterChip
            active={active === "all"}
            onClick={() => setActive("all")}
            count={allProducts.length}
          >
            Barchasi
          </FilterChip>
          {CATEGORIES.map((category) => {
            const count = allProducts.filter((product) => product.category === category.id).length;
            return (
              <FilterChip
                key={category.id}
                active={active === category.id}
                onClick={() => setActive(category.id)}
                count={count}
              >
                <span>{category.emoji}</span>
                {category.name}
              </FilterChip>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar mt-1">
        <div className="flex gap-2 px-5 pb-3 items-center">
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground pr-1">
            <SlidersHorizontal className="w-3 h-3" strokeWidth={2.5} />
            Saralash
          </span>
          {SORTS.map((option) => (
            <FilterChip
              key={option.id}
              active={sort === option.id}
              onClick={() => setSort(option.id)}
            >
              {option.label}
            </FilterChip>
          ))}
          <span className="w-px h-4 bg-border mx-1 shrink-0" />
          <FilterChip active={onlySale} onClick={() => setOnlySale((value) => !value)}>
            Faqat aksiya
          </FilterChip>
        </div>
      </div>

      <div className="px-5 mt-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold tabular-nums text-foreground">{products.length}</span>{" "}
            {products.length === 1 ? "mahsulot" : "mahsulot"}
          </p>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="w-9 h-9" strokeWidth={1.75} />}
            title="Mos mahsulot topilmadi"
            body="Filtrlarni tozalang yoki boshqa kategoriya tanlang."
            action={
              <button
                onClick={() => {
                  setActive("all");
                  setOnlySale(false);
                  setSort("popular");
                }}
                className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
              >
                Filtrlarni tozalash
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
