import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchProduct, fetchProducts, queryKeys } from "../lib/queries";
import { formatPrice, toNumber } from "../lib/utils";

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

      {product.image_url ? (
        <img
          alt={product.name}
          className="h-80 w-full object-cover"
          src={product.image_url}
        />
      ) : (
        <div className="flex h-80 items-center justify-center bg-primary/10">
          <span className="text-6xl font-black text-primary">
            {product.name.slice(0, 1).toUpperCase()}
          </span>
        </div>
      )}

      <div className="space-y-5 p-5">
        <button
          className="text-sm font-semibold text-primary"
          onClick={() => navigate(-1)}
          type="button"
        >
          Ortga
        </button>

        <div>
          <p className="eyebrow text-primary">{product.categories?.name ?? "Mahsulot"}</p>
          <h1 className="mt-2 text-3xl font-black text-textPrimary">{product.name}</h1>
          <p className="mt-2 text-2xl font-black text-primary">
            {formatPrice(toNumber(product.price))}
          </p>
        </div>

        <p className="text-base leading-7 text-textSecondary">
          {product.description || "Mahsulot tavsifi mavjud emas"}
        </p>

        <div className="surface-panel flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-textPrimary">Miqdor</p>
            <p className="mt-1 text-sm text-textSecondary">Jami: {formatPrice(total)}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-lg font-bold"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              type="button"
            >
              -
            </button>
            <span className="text-lg font-bold text-textPrimary">{quantity}</span>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white"
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
              <h2 className="section-title">Yana tavsiya qilamiz</h2>
              <Link className="text-sm font-bold text-primary" to="/products">
                Ko'proq
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
          Savatga qo'shish - {formatPrice(total)}
        </button>
      </div>
    </div>
  );
}
