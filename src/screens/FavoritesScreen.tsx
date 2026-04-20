import { useApp } from "@/store/useApp";
import { ProductCard } from "@/components/app/ProductCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Heart } from "lucide-react";

export function FavoritesScreen() {
  const favorites = useApp((s) => s.favorites);
  const navigate = useApp((s) => s.navigate);
  const products = useApp((s) => s.products);
  const favProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="animate-screen-in px-5 pt-3 pb-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Saqlanganlar</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mb-4">
        Sevimli mahsulotlar
      </h1>

      {favProducts.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-9 h-9" strokeWidth={1.75} />}
          title="Sevimlilar hozircha yo'q"
          body="Har qanday mahsulotdagi yurak belgisini bossangiz, u shu yerga saqlanadi."
          action={
            <button
              onClick={() => navigate({ name: "categories" })}
              className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
            >
              Mahsulotlarni ko'rish
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {favProducts.map((p) => (
            <ProductCard key={p.id} product={p} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
