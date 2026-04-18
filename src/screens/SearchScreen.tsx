import { useMemo, useState } from "react";
import { Search, X, Clock, TrendingUp, SearchX } from "lucide-react";
import { useApp } from "@/store/useApp";
import { CATEGORIES, PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/app/ProductCard";
import { EmptyState } from "@/components/app/EmptyState";

const POPULAR_QUERIES = ["Ribeye", "Lamb chops", "Whole chicken", "Wings", "Family box", "Salmon"];

export function SearchScreen() {
  const recent = useApp((s) => s.recentSearches);
  const pushRecent = useApp((s) => s.pushRecentSearch);
  const clearRecent = useApp((s) => s.clearRecentSearches);
  const navigate = useApp((s) => s.navigate);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term)) ||
        p.category.includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }, [q]);

  const onSubmit = () => { if (q.trim()) pushRecent(q.trim()); };

  return (
    <div className="animate-screen-in px-5 pt-3 pb-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Find</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5 mb-4">
        What are you craving?
      </h1>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={onSubmit}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="Search beef, lamb, chicken…"
          className="w-full h-12 rounded-full bg-surface shadow-card pl-11 pr-12 text-sm font-medium outline-none focus:ring-2 focus:ring-primary border border-border/50"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="tap absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full bg-paper active:scale-90 transition-transform"
            aria-label="Clear"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Empty (no query) */}
      {!q && (
        <div className="mt-6 space-y-6">
          {recent.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Recent
                </h2>
                <button
                  onClick={clearRecent}
                  className="tap text-[11px] font-semibold text-primary active:scale-95 transition-transform"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => setQ(r)}
                    className="tap inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-surface shadow-xs border border-border/50 text-xs font-semibold active:scale-95 transition-transform"
                  >
                    <Clock className="w-3 h-3 text-muted-foreground" strokeWidth={2.5} />
                    {r}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
              Trending searches
            </h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_QUERIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setQ(p)}
                  className="tap inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-primary-soft text-primary-soft-foreground text-xs font-semibold active:scale-95 transition-transform"
                >
                  <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                  {p}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
              Browse categories
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate({ name: "categories", category: c.id })}
                  className="tap aspect-[4/3] rounded-2xl bg-surface shadow-xs border border-border/40 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-[11px] font-bold">{c.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Results */}
      {q && (
        <div className="mt-5">
          <p className="text-xs text-muted-foreground mb-3">
            <span className="font-bold tabular-nums text-foreground">{results.length}</span>{" "}
            result{results.length === 1 ? "" : "s"} for <span className="text-foreground font-semibold">"{q}"</span>
          </p>
          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} variant="grid" />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<SearchX className="w-9 h-9" strokeWidth={1.75} />}
              title="No matches found"
              body={`We couldn't find anything for "${q}". Try a different cut or category.`}
              action={
                <button
                  onClick={() => setQ("")}
                  className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
                >
                  Clear search
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
