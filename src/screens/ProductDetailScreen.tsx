import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  Flame,
  Heart,
  MessageSquareQuote,
  Plus,
  Share2,
  Shield,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/EmptyState";
import { ProductBadge } from "@/components/app/ProductBadge";
import { ProductCard } from "@/components/app/ProductCard";
import { QtyStepper } from "@/components/app/QtyStepper";
import { SectionHeader } from "@/components/app/SectionHeader";
import { formatCurrency, formatDate } from "@/lib/format";
import { getProductMaxUnits, getLineWeightKg } from "@/lib/weights";
import { useApp } from "@/store/useApp";

export function ProductDetailScreen() {
  const screen = useApp((state) => state.screen);
  const back = useApp((state) => state.back);
  const addToCart = useApp((state) => state.addToCart);
  const navigate = useApp((state) => state.navigate);
  const toggleFavorite = useApp((state) => state.toggleFavorite);
  const favorites = useApp((state) => state.favorites);
  const rawProducts = useApp((state) => state.products);
  const getProductById = useApp((state) => state.getProductById);
  const getProductReviews = useApp((state) => state.getProductReviews);

  const productId = screen.name === "product" ? screen.id : "";
  const products = useMemo(
    () => rawProducts.filter((product) => product.enabled !== false),
    [rawProducts],
  );
  const product = getProductById(productId);
  const isFavorite = favorites.includes(productId);
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState<string | undefined>(product?.weightOptions?.[0] ?? product?.weight);
  const related = useMemo(
    () =>
      products
        .filter((item) => item.id !== productId && item.category === product?.category)
        .slice(0, 4),
    [product?.category, productId, products],
  );
  const reviews = getProductReviews(productId);

  if (!product) {
    return (
      <div className="px-5 pt-6">
        <EmptyState
          icon={<MessageSquareQuote className="w-9 h-9" strokeWidth={1.75} />}
          title="Mahsulot topilmadi"
          body="Katalog qayta yuklanmoqda yoki mahsulot o'chirilgan."
          action={
            <button
              onClick={back}
              className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
            >
              Katalogga qaytish
            </button>
          }
        />
      </div>
    );
  }

  const onSale = Boolean(product.oldPrice);
  const safeImage = product.image || "/placeholder.svg";
  const safeTags = Array.isArray(product.tags) ? product.tags : [];
  const selectedWeight = weight ?? product.weight;
  const selectedKg = getLineWeightKg(selectedWeight, product.weight);
  const maxUnits = getProductMaxUnits(product.stockKg, selectedWeight, product.weight);
  const savings = onSale ? (product.oldPrice! - product.price) * quantity : 0;

  const handleAdd = () => {
    const result = addToCart(product, quantity, selectedWeight);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(`${quantity} x ${product.name} savatga qo'shildi`, {
      description: `${selectedWeight} - ${formatCurrency(product.price * quantity)}`,
      duration: 1700,
    });
  };

  const handleShare = async () => {
    const message = `${product.name} - ${formatCurrency(product.price)}. Fresh Halal katalogidan.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: message });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
      }

      toast.success("Mahsulot ma'lumoti nusxalandi");
    } catch {
      toast.error("Ulashish bekor qilindi");
    }
  };

  return (
    <div className="animate-screen-in pb-24 bg-background min-h-full">
      <div className="relative bg-paper aspect-[4/3.6]">
        <img src={safeImage} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />

        <button
          onClick={back}
          aria-label="Orqaga"
          className="tap absolute left-3 w-10 h-10 rounded-full bg-surface/95 backdrop-blur grid place-items-center shadow-card active:scale-90 transition-transform"
          style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <div
          className="absolute right-3 flex flex-col gap-2"
          style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <button
            onClick={() => toggleFavorite(product.id)}
            aria-label="Saqlash"
            className="tap w-10 h-10 rounded-full bg-surface/95 backdrop-blur grid place-items-center shadow-card active:scale-90 transition-transform"
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? "fill-sale text-sale" : "text-foreground/70"}`}
              strokeWidth={2.5}
            />
          </button>
          <button
            onClick={handleShare}
            aria-label="Ulashish"
            className="tap w-10 h-10 rounded-full bg-surface/95 backdrop-blur grid place-items-center shadow-card active:scale-90 transition-transform"
          >
            <Share2 className="w-4 h-4 text-foreground/70" strokeWidth={2.5} />
          </button>
        </div>

        {onSale && (
          <div className="absolute bottom-4 left-4">
            <ProductBadge
              label={`Tejash ${formatCurrency(savings)}`}
              variant="Sale"
              className="!h-7 !px-3 !text-xs"
            />
          </div>
        )}
      </div>

      <div className="bg-surface -mt-5 rounded-t-3xl px-5 pt-5 relative shadow-elevated">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-foreground/15" />

        <div className="flex flex-wrap gap-1.5 mb-3">
          {safeTags.map((tag) => (
            <ProductBadge key={tag} label={tag} />
          ))}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-[26px] leading-[1.05] font-semibold tracking-tight text-balance">
              {product.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              {product.weight}
              {product.origin ? ` - ${product.origin}` : ""}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 text-[11px] font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" strokeWidth={2.2} />
              {product.rating.toFixed(1)}
              <span className="text-muted-foreground">({product.reviewCount} sharh)</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-serif text-[26px] font-semibold leading-none text-primary tabular-nums">
              {formatCurrency(product.price)}
            </p>
            {onSale && (
              <p className="text-xs text-muted-foreground line-through mt-1.5 tabular-nums">
                {formatCurrency(product.oldPrice!)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-foreground text-background">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
              <BadgeCheck className="w-5 h-5" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold">100% halol sertifikatlangan</p>
              <p className="text-[11px] text-background/70 leading-tight mt-0.5">
                Halol sertifikatli, buyurtma tushishi bilan tayyorlanadi va nazorat ostida jo'natiladi.
              </p>
            </div>
          </div>
        </div>

        {product.weightOptions && product.weightOptions.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Vaznni tanlang
              </p>
              <p className="text-[11px] text-muted-foreground">{selectedWeight}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {product.weightOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setWeight(option);
                    setQuantity(1);
                  }}
                  className={`tap h-11 px-5 rounded-full text-sm font-bold border-2 active:scale-95 transition-all ${
                    selectedWeight === option
                      ? "bg-foreground text-background border-foreground"
                      : "bg-surface text-foreground border-border"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
            Mahsulot haqida
          </p>
          <p className="text-[14px] text-foreground/85 leading-relaxed">{product.description}</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <TrustBullet Icon={Flame} label="Tayyorlash" sub={product.prepTime ?? "Yangi"} />
          <TrustBullet Icon={Truck} label="Qoldiq" sub={`${product.stockKg} kg mavjud`} />
          <TrustBullet Icon={Shield} label="Sifat" sub="Ishonchli kafolat" />
        </div>

        <div className="mt-6 rounded-2xl bg-paper p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                Miqdor
              </p>
              <p className="text-xs text-muted-foreground">
                1 birlik = {selectedKg} kg
              </p>
              <p className="text-xs text-muted-foreground">
                Maksimum {maxUnits} ta paket
              </p>
              <p className="text-xs text-muted-foreground">
                Katta buyurtma uchun +998990197548 raqamiga qo'ng'iroq qiling
              </p>
            </div>
            <QtyStepper value={quantity} onChange={setQuantity} min={1} max={Math.max(1, maxUnits)} size="lg" />
          </div>

          <button
            onClick={handleAdd}
            disabled={maxUnits <= 0}
            className="tap mt-4 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-fab active:scale-[0.98] transition-transform flex items-center justify-between px-5 disabled:opacity-50 disabled:active:scale-100"
          >
            <span className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-primary-foreground/15 grid place-items-center">
                <Plus className="w-4 h-4" strokeWidth={3} />
              </span>
              Savatga qo'shish
            </span>
            <span className="tabular-nums">{formatCurrency(product.price * quantity)}</span>
          </button>
        </div>

        <div className="mt-7">
          <SectionHeader eyebrow="Mijozlar fikri" title="Sharhlar" inline />
          {reviews.length > 0 ? (
            <div className="mt-3 space-y-3">
              {reviews.slice(0, 4).map((review) => (
                <div key={review.id} className="rounded-2xl bg-paper p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{review.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                      <Star className="w-3.5 h-3.5 fill-current" strokeWidth={2.2} />
                      {review.rating}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-foreground/85">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-paper p-4 text-sm text-muted-foreground flex items-center gap-3">
              <MessageSquareQuote className="w-4 h-4 text-primary shrink-0" strokeWidth={2.4} />
              Sharhlar buyurtma yakunlangach paydo bo'ladi.
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-7 -mx-5">
            <SectionHeader eyebrow="Sizga yoqishi mumkin" title="Birga oling" />
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-3 px-5 pb-1">
                {related.map((item) => (
                  <ProductCard key={item.id} product={item} variant="horizontal" />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}

function TrustBullet({
  Icon,
  label,
  sub,
}: {
  Icon: typeof Flame;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl bg-paper p-3 flex flex-col items-start">
      <Icon className="w-4 h-4 text-primary mb-1.5" strokeWidth={2.5} />
      <p className="text-[11px] font-bold leading-tight">{label}</p>
      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{sub}</p>
    </div>
  );
}
