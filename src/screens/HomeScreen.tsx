import { CalendarDays, ChevronRight, Search, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CATEGORIES } from "@/data/products";
import { ProductCard } from "@/components/app/ProductCard";
import { formatCurrency } from "@/lib/format";
import { useApp } from "@/store/useApp";

const PEOPLE_OPTIONS = [2, 4, 6];
const DAY_OPTIONS = [2, 4, 7];

export function HomeScreen() {
  const navigate = useApp((state) => state.navigate);
  const addToCart = useApp((state) => state.addToCart);
  const cartCount = useApp((state) => state.cartCount());
  const getCartPricing = useApp((state) => state.cartPricing);
  const products = useApp((state) => state.products);
  const [people, setPeople] = useState(4);
  const [days, setDays] = useState(4);

  const enabledProducts = useMemo(
    () => products.filter((product) => product.enabled !== false),
    [products],
  );
  const heroProducts = useMemo(
    () =>
      [...enabledProducts]
        .sort((left, right) => {
          const popularScore =
            Number(right.tags.includes("Popular")) - Number(left.tags.includes("Popular"));
          return popularScore || left.price - right.price;
        })
        .slice(0, 8),
    [enabledProducts],
  );
  const familyBox =
    enabledProducts.find((product) => product.id === "family-box") ??
    enabledProducts.find((product) => product.category === "bundles");
  const estimatedBudget = Math.max(1, people) * Math.max(1, days) * 65000;
  const pricing = getCartPricing();

  const handleFamilySet = () => {
    if (!familyBox) {
      navigate({ name: "categories", category: "bundles" });
      return;
    }

    const qty = people >= 6 || days >= 7 ? 2 : 1;
    const result = addToCart(familyBox, qty, familyBox.weightOptions?.[0] ?? familyBox.weight);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Oilaviy set savatga qo'shildi", {
      description: `${qty} x ${familyBox.name}`,
      duration: 1600,
    });
  };

  return (
    <div className="animate-screen-in px-5 pt-4 pb-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Fresh Halal
          </p>
          <h1 className="mt-1 font-serif text-[28px] leading-tight font-semibold tracking-tight">
            Bugungi xarid
          </h1>
        </div>
        <button
          onClick={() => navigate({ name: "categories", saleOnly: true })}
          className="tap h-9 rounded-full bg-sale/10 px-3 text-xs font-bold text-sale active:scale-95 transition-transform"
        >
          Aksiyalar
        </button>
      </div>

      <button
        onClick={() => navigate({ name: "search" })}
        className="tap mt-4 flex h-12 w-full items-center gap-3 rounded-2xl border border-border/60 bg-surface px-4 text-left shadow-xs active:scale-[0.99] transition-transform"
      >
        <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
        <span className="flex-1 text-sm font-medium text-muted-foreground">
          Mahsulot qidirish
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
      </button>

      <div className="mt-4 overflow-x-auto no-scrollbar -mx-5">
        <div className="flex gap-2 px-5 pb-1">
          <button
            onClick={() => navigate({ name: "categories" })}
            className="tap h-10 shrink-0 rounded-full bg-foreground px-4 text-xs font-bold text-background active:scale-95 transition-transform"
          >
            Barchasi
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate({ name: "categories", category: category.id })}
              className="tap h-10 shrink-0 rounded-full border border-border bg-surface px-4 text-xs font-bold active:scale-95 transition-transform"
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-5 rounded-2xl bg-surface p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Oilaviy set tavsiyasi</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Odam soni va kun bo'yicha tayyor set qo'shing.
            </p>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold text-primary">
            ~{formatCurrency(estimatedBudget)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Picker
            icon={<Users className="h-4 w-4" strokeWidth={2.25} />}
            label="Odam"
            value={people}
            options={PEOPLE_OPTIONS}
            suffix="ta"
            onChange={setPeople}
          />
          <Picker
            icon={<CalendarDays className="h-4 w-4" strokeWidth={2.25} />}
            label="Kun"
            value={days}
            options={DAY_OPTIONS}
            suffix="kun"
            onChange={setDays}
          />
        </div>

        <button
          onClick={handleFamilySet}
          className="tap mt-4 h-11 w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-fab active:scale-[0.98] transition-transform"
        >
          Setni savatga qo'shish
        </button>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Katalog
            </p>
            <h2 className="font-serif text-[22px] font-semibold leading-tight">
              Ko'p olinadiganlar
            </h2>
          </div>
          <button
            onClick={() => navigate({ name: "categories" })}
            className="tap text-xs font-bold text-primary active:scale-95 transition-transform"
          >
            Hammasi
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {heroProducts.map((product) => (
            <ProductCard key={product.id} product={product} variant="grid" />
          ))}
        </div>
      </section>

      {cartCount > 0 && (
        <div className="sticky bottom-3 z-10 mt-6 rounded-2xl bg-foreground p-3 text-background shadow-elevated">
          <button
            onClick={() => navigate({ name: "cart" })}
            className="tap flex h-11 w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground active:scale-[0.98] transition-transform"
          >
            <span>Savatda {cartCount} ta mahsulot</span>
            <span>{formatCurrency(pricing.total)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Picker({
  icon,
  label,
  value,
  options,
  suffix,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  options: number[];
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl bg-paper p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="mt-2 flex gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`tap h-8 flex-1 rounded-full text-[11px] font-bold active:scale-95 transition-transform ${
              value === option
                ? "bg-foreground text-background"
                : "bg-surface text-foreground"
            }`}
          >
            {option} {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}
