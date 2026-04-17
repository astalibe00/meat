import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import {
  getDeliveryZoneMeta,
  getMarketplaceProductMeta,
} from "../lib/marketplace";
import { fetchProduct, fetchProducts, queryKeys } from "../lib/queries";
import { canUseProtectedApi } from "../lib/telegram";
import { formatPrice, toNumber } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";

const storageNotes = [
  "0–4°C oralig'ida saqlang.",
  "Fresh buyurtma 24 soat ichida ishlatish tavsiya qilinadi.",
  "Frozen format eritilgach qayta muzlatmang.",
];

export default function ProductDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedWeightIndex, setSelectedWeightIndex] = useState(1);
  const [selectedPackaging, setSelectedPackaging] = useState(0);
  const [selectedFreshness, setSelectedFreshness] = useState<"fresh" | "frozen" | "same">("same");
  const [deliveryZone, setDeliveryZone] = useState("");
  const { ToastComponent, showToast } = useToast();
  const canAccessProtectedApi = canUseProtectedApi();
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const favoriteIds = useAppStore((state) => state.favoriteIds);

  const productQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => fetchProduct(id),
    queryKey: queryKeys.product(id),
  });

  const relatedQuery = useQuery({
    enabled: Boolean(productQuery.data?.category_id),
    queryFn: () => fetchProducts(productQuery.data?.category_id ?? undefined),
    queryKey: queryKeys.products(productQuery.data?.category_id ?? undefined),
  });

  const addToCart = useMutation({
    mutationFn: (cartQuantity: number) =>
      api.post("/cart", {
        product_id: id,
        quantity: cartQuantity,
      }),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Mahsulotni savatga qo'shib bo'lmadi";
      showToast(message, "error");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      showToast("Mahsulot savatga qo'shildi");
    },
  });

  if (productQuery.isLoading) {
    return <div className="p-4 text-sm text-textSecondary">Mahsulot yuklanmoqda...</div>;
  }

  const product = productQuery.data;

  if (!product) {
    return (
      <div className="p-4">
        <p className="text-sm text-textSecondary">Mahsulot topilmadi.</p>
      </div>
    );
  }

  const meta = getMarketplaceProductMeta(product);
  const weightOption = meta.weightOptions[selectedWeightIndex] ?? meta.weightOptions[0];
  const variantFreshness = selectedFreshness === "same" ? meta.freshness : selectedFreshness;
  const unitAdjustedPrice =
    variantFreshness === "fresh"
      ? toNumber(product.price)
      : Math.round(toNumber(product.price) * 0.92);
  const total = unitAdjustedPrice * weightOption.multiplier * quantity;
  const isFavorite = favoriteIds.includes(product.id);
  const relatedProducts = (relatedQuery.data ?? [])
    .filter((item) => item.id !== product.id)
    .slice(0, 3);
  const deliveryZoneMeta = getDeliveryZoneMeta(deliveryZone);
  const packagingOptions = [meta.packaging, "Restoran qadoq", "Family pack"];

  return (
    <div className="page-wrap pb-32">
      <ToastComponent />

      <div className="relative">
        <div className="media-shell h-[430px] w-full rounded-b-[42px]">
          {product.image_url ? (
            <img alt={product.name} className="h-full w-full object-cover" src={product.image_url} />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary/10">
              <span className="text-7xl font-black text-primary">
                {product.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}

          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <button className="btn-ghost" onClick={() => navigate(-1)} type="button">
              Ortga
            </button>
            <span className="info-pill bg-white/[0.95]">
              {product.categories?.name ?? meta.proteinType}
            </span>
          </div>

          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <button
              className={`inline-icon-button ${isFavorite ? "active" : ""}`}
              onClick={() => toggleFavorite(product.id)}
              type="button"
            >
              <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                <path
                  d="M12 20.4 4.95 13.5a4.56 4.56 0 0 1 0-6.65 4.97 4.97 0 0 1 6.82 0L12 7.08l.23-.23a4.97 4.97 0 0 1 6.82 0 4.56 4.56 0 0 1 0 6.65L12 20.4Z"
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-5 left-5 right-5 z-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/[0.78]">
              {meta.sellerName}
            </p>
            <h1 className="mt-2 max-w-2xl text-4xl font-black text-white">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/[0.94] px-4 py-2 text-base font-black text-primary shadow-sm">
                {formatPrice(unitAdjustedPrice)}
              </span>
              <span className="rounded-full bg-black/[0.24] px-4 py-2 text-sm font-bold text-white">
                {meta.unitLabel}
              </span>
              <span className="rounded-full bg-black/[0.24] px-4 py-2 text-sm font-bold text-white">
                {variantFreshness === "fresh" ? "Fresh" : "Frozen"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <section className="section-shell">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-primary">Product overview</p>
              <h2 className="section-title">Premium detail va trust signal</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge-success">Halal certified</span>
              <span className="badge-soft">Cold chain</span>
              <span className="badge-soft">Vet checked</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="feature-card">
              <p className="eyebrow text-dark">Seller</p>
              <p className="mt-2 text-lg font-black text-textPrimary">{meta.sellerName}</p>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                {meta.region} • {meta.favoriteSellerLabel}
              </p>
            </div>
            <div className="feature-card">
              <p className="eyebrow text-dark">Rating</p>
              <p className="mt-2 text-lg font-black text-textPrimary">
                {meta.rating.toFixed(1)} / 5
              </p>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                {meta.reviewCount} ta sharh, ko'p qayta buyurtma bilan.
              </p>
            </div>
            <div className="feature-card">
              <p className="eyebrow text-dark">MOQ</p>
              <p className="mt-2 text-lg font-black text-textPrimary">{meta.minimumOrderLabel}</p>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                Wholesale pricing 5+ birlikdan boshlanadi.
              </p>
            </div>
          </div>

          <p className="mt-5 text-base leading-7 text-textSecondary">
            {product.description ||
              `${meta.cutType}, ${meta.packaging}, ${meta.origin}. ${meta.estimatedFreshness}. ${meta.deliveryEta} slot bilan yetkaziladi.`}
          </p>
        </section>

        <section className="section-shell space-y-4">
          <div>
            <p className="eyebrow text-primary">Variantlar</p>
            <h2 className="section-title">Kesim, weight va packaging tanlang</h2>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-textPrimary">Weight / miqdor</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {meta.weightOptions.map((option, index) => (
                <button
                  className={`filter-chip ${selectedWeightIndex === index ? "active" : ""}`}
                  key={option.label}
                  onClick={() => setSelectedWeightIndex(index)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-textPrimary">Fresh / frozen</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { label: "Asl format", value: "same" as const },
                { label: "Fresh", value: "fresh" as const },
                { label: "Frozen", value: "frozen" as const },
              ].map((option) => (
                <button
                  className={`filter-chip ${selectedFreshness === option.value ? "active" : ""}`}
                  key={option.value}
                  onClick={() => setSelectedFreshness(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-textPrimary">Packaging turi</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {packagingOptions.map((option, index) => (
                <button
                  className={`filter-chip ${selectedPackaging === index ? "active" : ""}`}
                  key={option}
                  onClick={() => setSelectedPackaging(index)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="feature-card">
              <p className="eyebrow text-dark">Kesim turi</p>
              <p className="mt-2 text-lg font-black text-textPrimary">{meta.cutType}</p>
            </div>
            <div className="feature-card">
              <p className="eyebrow text-dark">Stock holati</p>
              <p className="mt-2 text-lg font-black text-textPrimary">{meta.stockLabel}</p>
              <p className="mt-1 text-sm text-textSecondary">{meta.stockCount} birlik atrofida</p>
            </div>
            <div className="feature-card">
              <p className="eyebrow text-dark">Yetkazish</p>
              <p className="mt-2 text-lg font-black text-textPrimary">{meta.deliveryEta}</p>
              <p className="mt-1 text-sm text-textSecondary">{meta.warehouseOrigin}</p>
            </div>
          </div>
        </section>

        <section className="section-shell">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-primary">Delivery zone</p>
              <h2 className="section-title">Hudud bo'yicha mavjudlik</h2>
            </div>
            <span className={deliveryZoneMeta.available ? "badge-success" : "badge-warning"}>
              {deliveryZoneMeta.label}
            </span>
          </div>
          <input
            className="input-field mt-4"
            onChange={(event) => setDeliveryZone(event.target.value)}
            placeholder="Masalan: Toshkent, Yunusobod"
            value={deliveryZone}
          />
          <p className="mt-3 text-sm leading-6 text-textSecondary">{deliveryZoneMeta.note}</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="section-shell">
            <p className="eyebrow text-primary">Tarkib va saqlash</p>
            <h2 className="section-title">Quality assurance</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="feature-card">
                <p className="eyebrow text-dark">Kelib chiqish</p>
                <p className="mt-2 text-lg font-black text-textPrimary">{meta.origin}</p>
              </div>
              <div className="feature-card">
                <p className="eyebrow text-dark">Freshness</p>
                <p className="mt-2 text-lg font-black text-textPrimary">{meta.estimatedFreshness}</p>
              </div>
              <div className="feature-card">
                <p className="eyebrow text-dark">Nutrition</p>
                <p className="mt-2 text-lg font-black text-textPrimary">Protein boy, tabiiy mahsulot</p>
              </div>
              <div className="feature-card">
                <p className="eyebrow text-dark">Return support</p>
                <p className="mt-2 text-lg font-black text-textPrimary">Claim support mavjud</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {storageNotes.map((note) => (
                <div className="feature-card" key={note}>
                  <p className="text-sm leading-6 text-textSecondary">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-shell">
            <p className="eyebrow text-primary">Wholesale tiers</p>
            <h2 className="section-title">Katta hajm uchun narxlar</h2>

            <div className="mt-4 space-y-3">
              {meta.wholesaleTiers.map((tier) => (
                <div className="feature-card flex items-center justify-between" key={tier.label}>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-textSecondary">
                      {tier.label}
                    </p>
                    <p className="mt-2 text-lg font-black text-textPrimary">{formatPrice(tier.price)}</p>
                  </div>
                  <span className="badge-soft">{meta.unitLabel}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 metric-card">
              <p className="eyebrow text-white/70">Subscription delivery</p>
              <p className="mt-2 text-2xl font-black">{meta.subscriptionLabel}</p>
              <p className="mt-3 text-sm leading-6 text-white/82">
                Restoran, kafe va oilaviy xarid uchun qayta yetkazib berish oqimi tayyor.
              </p>
            </div>
          </div>
        </section>

        {relatedProducts.length ? (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow text-primary">O'xshash mahsulotlar</p>
                <h2 className="section-title">Shu seller yoki kategoriya bo'yicha davom eting</h2>
              </div>
              <Link className="text-sm font-bold text-primary" to="/products">
                To'liq katalog
              </Link>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  onAdd={() => {
                    if (!canAccessProtectedApi) {
                      showToast("Savat uchun Telegram avtorizatsiyasi kerak", "error");
                      return;
                    }

                    void api
                      .post("/cart", {
                        product_id: relatedProduct.id,
                        quantity: 1,
                      })
                      .then(() => {
                        void queryClient.invalidateQueries({ queryKey: queryKeys.cart });
                        showToast("Mahsulot savatga qo'shildi");
                      });
                  }}
                  product={relatedProduct}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="floating-cta">
        <div className="w-full">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-textSecondary">
                Jami
              </p>
              <p className="text-lg font-black text-textPrimary">{formatPrice(total)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="inline-icon-button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                type="button"
              >
                -
              </button>
              <span className="min-w-8 text-center text-xl font-black text-textPrimary">{quantity}</span>
              <button
                className="inline-icon-button active"
                onClick={() => setQuantity((current) => current + 1)}
                type="button"
              >
                +
              </button>
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              if (!canAccessProtectedApi) {
                showToast("Savat uchun Telegram avtorizatsiyasi kerak", "error");
                return;
              }

              addToCart.mutate(quantity);
            }}
            type="button"
          >
            Savatga qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}
