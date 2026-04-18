import {
  BadgeCheck,
  ChevronRight,
  Clock,
  Flame,
  Leaf,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";
import { useApp } from "@/store/useApp";
import {
  CATEGORIES,
  FREE_SHIPPING_THRESHOLD,
  PRODUCTS,
  getProductsByTag,
} from "@/data/products";
import { ProductCard } from "@/components/app/ProductCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import banner1 from "@/assets/banners/banner-1.jpg";
import banner2 from "@/assets/banners/banner-2.jpg";
import banner3 from "@/assets/banners/banner-3.jpg";

const banners = [
  {
    id: 1,
    img: banner1,
    eyebrow: "This week",
    title: "Premium cuts,\nhand-trimmed daily",
    cta: "Shop premium",
    accent: "from-foreground/85 via-foreground/45",
    action: { name: "categories", category: "beef" } as const,
  },
  {
    id: 2,
    img: banner2,
    eyebrow: "Weekend deal",
    title: "Save up to 25%\non whole roasts",
    cta: "View offers",
    accent: "from-sale/85 via-sale/40",
    action: { name: "categories", saleOnly: true } as const,
  },
  {
    id: 3,
    img: banner3,
    eyebrow: "Free delivery",
    title: `On every order\nover $${FREE_SHIPPING_THRESHOLD}`,
    cta: "Start shopping",
    accent: "from-primary/90 via-primary/45",
    action: { name: "categories" } as const,
  },
];

const TRUST_PILLS = [
  { Icon: BadgeCheck, label: "Halal certified" },
  { Icon: Leaf, label: "Hand-trimmed" },
  { Icon: Truck, label: "Same-day" },
  { Icon: Clock, label: "Cut to order" },
];

export function HomeScreen() {
  const navigate = useApp((state) => state.navigate);
  const popular = getProductsByTag("Popular");
  const sale = PRODUCTS.filter((product) => Boolean(product.oldPrice));
  const fresh = getProductsByTag("Fresh");

  return (
    <div className="animate-screen-in pb-6">
      <div className="px-5 pt-4 pb-3">
        <p className="text-xs text-muted-foreground font-medium">Fresh halal delivery</p>
        <h1 className="font-serif text-[28px] leading-[1.05] font-semibold tracking-tight mt-1 text-balance">
          Fresh halal cuts,
          <br />
          <span className="italic text-primary">delivered to your door.</span>
        </h1>
      </div>

      <div className="px-5">
        <button
          onClick={() => navigate({ name: "search" })}
          className="tap w-full h-12 rounded-full bg-surface shadow-card flex items-center gap-3 pl-4 pr-2 text-left active:scale-[0.99] transition-transform border border-border/50"
        >
          <Search className="w-4 h-4 text-foreground/50" strokeWidth={2.5} />
          <span className="text-sm text-muted-foreground flex-1">
            Search beef, lamb, chicken...
          </span>
          <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
          </span>
        </button>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {TRUST_PILLS.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 py-2 rounded-xl bg-primary-soft/60"
            >
              <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
              <span className="text-[9.5px] font-semibold text-primary-soft-foreground leading-none text-center px-0.5">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-5 pb-1">
          {banners.map((banner) => (
            <button
              key={banner.id}
              onClick={() => navigate(banner.action)}
              className="tap shrink-0 w-[296px] h-[160px] rounded-3xl overflow-hidden relative shadow-card text-left"
            >
              <img
                src={banner.img}
                alt={banner.title.replace("\n", " ")}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-tr ${banner.accent} to-transparent`} />
              <div className="absolute inset-0 p-5 flex flex-col justify-end text-primary-foreground">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-90 mb-1.5">
                  {banner.eyebrow}
                </p>
                <h3 className="font-serif text-[22px] leading-[1.05] font-semibold whitespace-pre-line text-balance">
                  {banner.title}
                </h3>
                <span className="mt-2.5 inline-flex items-center text-[11px] font-bold w-fit">
                  {banner.cta}
                  <ChevronRight className="w-3.5 h-3.5 -mr-1" strokeWidth={2.5} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7">
        <SectionHeader
          eyebrow="Shop by"
          title="Categories"
          onSeeAll={() => navigate({ name: "categories" })}
        />
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 px-5 pb-1">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => navigate({ name: "categories", category: category.id })}
                className="tap shrink-0 w-[72px] flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <span className="w-16 h-16 rounded-2xl bg-surface grid place-items-center text-3xl shadow-card border border-border/40">
                  {category.emoji}
                </span>
                <span className="text-[11px] font-semibold text-foreground leading-tight text-center">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7">
        <SectionHeader
          eyebrow="Loved by customers"
          title="Popular this week"
          onSeeAll={() => navigate({ name: "categories", sort: "popular" })}
        />
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 px-5 pb-1">
            {popular.map((product) => (
              <ProductCard key={product.id} product={product} variant="horizontal" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7">
        <SectionHeader
          eyebrow="Limited time"
          title="On sale"
          onSeeAll={() => navigate({ name: "categories", saleOnly: true })}
        />
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 px-5 pb-1">
            {sale.map((product) => (
              <ProductCard key={product.id} product={product} variant="horizontal" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7 px-5">
        <SectionHeader eyebrow="Cut today" title="Fresh from the block" inline />
        <div className="grid grid-cols-2 gap-3 mt-1">
          {fresh.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} variant="grid" />
          ))}
        </div>
      </div>

      <div className="mt-7 mx-5 rounded-3xl bg-foreground text-background p-6 relative overflow-hidden shadow-elevated">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative">
          <span className="chip bg-primary text-primary-foreground mb-3">
            <BadgeCheck className="w-3 h-3" strokeWidth={3} />
            Certified
          </span>
          <h3 className="font-serif text-[22px] leading-tight font-semibold mb-1.5">
            100% halal,
            <br />
            no compromises.
          </h3>
          <p className="text-xs text-background/70 leading-relaxed max-w-[280px]">
            Every cut is halal certified, ethically sourced, and prepared for reliable
            same-day delivery.
          </p>
          <div className="mt-4 flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
              Halal
            </span>
            <span className="w-px h-3 bg-background/20" />
            <span className="flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
              Ethical
            </span>
            <span className="w-px h-3 bg-background/20" />
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
              Hand-cut
            </span>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground font-medium tracking-[0.2em] uppercase mt-8 mb-2">
        Fresh Halal Direct - Same-day delivery
      </p>
    </div>
  );
}
