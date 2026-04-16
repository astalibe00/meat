import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { fetchProduct, fetchProducts, queryKeys } from "../lib/queries";
import { canUseProtectedApi } from "../lib/telegram";
import { formatPrice, toNumber } from "../lib/utils";

const detailStats = [
  { label: "Tayyorlash", value: "18 daqiqa" },
  { label: "Yetkazish", value: "~30 daqiqa" },
  { label: "Porsiya", value: "To'yimli" },
];

export default function ProductDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const { ToastComponent, showToast } = useToast();
  const canAccessProtectedApi = canUseProtectedApi();

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
    mutationFn: () =>
      api.post("/cart", {
        product_id: id,
        quantity,
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

  const product = productQuery.data;

  if (productQuery.isLoading) {
    return <div className="p-4 text-sm text-textSecondary">Mahsulot yuklanmoqda...</div>;
  }

  if (!product) {
    return (
      <div className="p-4">
        <p className="text-sm text-textSecondary">Mahsulot topilmadi.</p>
      </div>
    );
  }

  const total = toNumber(product.price) * quantity;
  const relatedProducts = (relatedQuery.data ?? [])
    .filter((item) => item.id !== product.id)
    .slice(0, 2);

  return (
    <div className="page-wrap pb-32">
      <ToastComponent />

      <div className="relative">
        <div className="media-shell h-[420px] w-full rounded-b-[40px]">
          {product.image_url ? (
            <img
              alt={product.name}
              className="h-full w-full object-cover"
              src={product.image_url}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary/10">
              <span className="text-7xl font-black text-primary">
                {product.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}

          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <button
              className="chip bg-white text-textPrimary"
              onClick={() => navigate(-1)}
              type="button"
            >
              Ortga
            </button>
            <span className="info-pill bg-white/[0.92]">{product.categories?.name ?? "Chef tanlovi"}</span>
          </div>

          <div className="absolute bottom-5 left-5 right-5 z-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/[0.78]">
              Bugungi tavsiya
            </p>
            <h1 className="mt-2 max-w-lg text-4xl font-black text-white">
              {product.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/[0.92] px-4 py-2 text-base font-black text-primary shadow-sm">
                {formatPrice(toNumber(product.price))}
              </span>
              <span className="rounded-full bg-black/[0.24] px-4 py-2 text-sm font-bold text-white">
                Yangi tayyorlanadi
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="section-shell">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-primary">Tavsif</p>
              <h2 className="section-title">Mazali tafsilotlar</h2>
            </div>
            <span className="info-pill">Issiq yetkaziladi</span>
          </div>

          <p className="mt-4 text-base leading-7 text-textSecondary">
            {product.description || "Mahsulot tavsifi mavjud emas"}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {detailStats.map((stat) => (
              <div className="flavor-card p-3" key={stat.label}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-textSecondary">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm font-black text-textPrimary">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-shell flex items-center justify-between">
          <div>
            <p className="eyebrow text-primary">Miqdor</p>
            <h2 className="section-title">Buyurtma miqdorini tanlang</h2>
            <p className="mt-2 text-sm text-textSecondary">Jami: {formatPrice(total)}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-lg font-bold text-textPrimary"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              type="button"
            >
              -
            </button>
            <span className="min-w-8 text-center text-xl font-black text-textPrimary">{quantity}</span>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-lg"
              onClick={() => setQuantity((current) => current + 1)}
              type="button"
            >
              +
            </button>
          </div>
        </div>

        {relatedProducts.length ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow text-primary">Yana tavsiya qilamiz</p>
                <h2 className="section-title">Ta'mni davom ettiring</h2>
              </div>
              <Link className="text-sm font-bold text-primary" to="/products">
                To'liq menyu
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
          </div>
        ) : null}
      </div>

      <div className="nav-shell fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 border-none p-3">
        <div className="w-full">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-textSecondary">
                Buyurtma summasi
              </p>
              <p className="text-lg font-black text-textPrimary">{formatPrice(total)}</p>
            </div>
            <p className="text-sm font-semibold text-textSecondary">{quantity} ta</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              if (!canAccessProtectedApi) {
                showToast("Savat uchun Telegram avtorizatsiyasi kerak", "error");
                return;
              }

              addToCart.mutate();
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
