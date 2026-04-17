import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AuthNotice from "../components/AuthNotice";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { getMarketplaceProductMeta, groupCartItemsBySeller } from "../lib/marketplace";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchCart, fetchProducts, queryKeys } from "../lib/queries";
import { formatPrice, toNumber } from "../lib/utils";

export default function Cart() {
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();
  const canAccessProtectedApi = canUseProtectedApi();
  const [deliveryMode, setDeliveryMode] = useState("cold_express");
  const [promoCode, setPromoCode] = useState("");

  const cartQuery = useQuery({
    enabled: canAccessProtectedApi,
    queryFn: fetchCart,
    queryKey: queryKeys.cart,
  });
  const productsQuery = useQuery({
    queryFn: () => fetchProducts(),
    queryKey: queryKeys.products(),
  });

  const updateQuantity = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.patch(`/cart/${productId}`, { quantity }),
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Savatchani yangilab bo'lmadi", "error");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => api.delete(`/cart/${productId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });

  const clearCart = useMutation({
    mutationFn: () => api.delete("/cart"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });

  if (!canAccessProtectedApi) {
    return (
      <div className="p-4">
        <AuthNotice title="Savatcha Telegram ichida ishlaydi" />
      </div>
    );
  }

  const items = cartQuery.data ?? [];
  const groupedItems = groupCartItemsBySeller(items);
  const total = items.reduce((sum, item) => sum + toNumber(item.products?.price) * item.quantity, 0);
  const shipping = items.length ? (deliveryMode === "cold_express" ? 35000 : 18000) : 0;
  const grandTotal = total + shipping;
  const recommendedProducts = (productsQuery.data ?? [])
    .filter((product) => !items.some((item) => item.product_id === product.id))
    .slice(0, 2);

  return (
    <div className="page-wrap space-y-4 p-4 pb-40">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow text-white/70">Cart</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="hero-title text-[2rem]">Multi-vendor savatcha tayyor</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
              Seller bo'yicha guruhlangan, sovuq zanjir va delivery option oldindan ko'rinadi.
            </p>
          </div>
          {items.length ? (
            <button className="btn-ghost" onClick={() => clearCart.mutate()} type="button">
              Tozalash
            </button>
          ) : null}
        </div>
      </div>

      {cartQuery.isLoading ? <ListSkeleton count={3} /> : null}

      {!cartQuery.isLoading && !items.length ? (
        <div className="empty-state">
          <p className="eyebrow">Cart empty</p>
          <h2 className="section-title">Savatcha bo'sh</h2>
          <p className="mt-3 text-sm leading-6 text-textSecondary">
            Assortimentdan mahsulot qo'shing, keyin delivery va checkout bosqichi shu yerda chiqadi.
          </p>
          <Link className="btn-primary mt-5 inline-flex !w-auto items-center justify-center px-5" to="/products">
            Katalogni ochish
          </Link>
        </div>
      ) : null}

      <div className="space-y-4">
        {groupedItems.map((group) => {
          const vendorTotal = group.items.reduce(
            (sum, item) => sum + toNumber(item.products?.price) * item.quantity,
            0,
          );

          return (
            <section className="section-shell" key={group.sellerName}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow text-primary">Seller</p>
                  <h2 className="section-title !text-[1.55rem]">{group.sellerName}</h2>
                </div>
                <span className="badge-success">Cold delivery</span>
              </div>

              <div className="mt-4 space-y-3">
                {group.items.map((item) => {
                  const meta = item.products ? getMarketplaceProductMeta(item.products) : null;
                  const itemTotal = toNumber(item.products?.price) * item.quantity;

                  return (
                    <div className="feature-card" key={item.id}>
                      <div className="flex items-start gap-4">
                        {item.products?.image_url ? (
                          <img
                            alt={item.products?.name ?? "Mahsulot"}
                            className="h-20 w-20 rounded-[22px] object-cover"
                            src={item.products.image_url}
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-primary/10 text-2xl font-black text-primary">
                            {item.products?.name?.slice(0, 1).toUpperCase() ?? "M"}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-black text-textPrimary">
                                {item.products?.name ?? "Mahsulot"}
                              </h3>
                              <p className="mt-1 text-sm text-textSecondary">
                                {meta?.minimumOrderLabel ?? "Min. 1"} • {meta?.deliveryEta ?? "~30 daqiqa"}
                              </p>
                            </div>
                            <button
                              className="text-sm font-bold text-danger"
                              onClick={() => removeItem.mutate(item.product_id)}
                              type="button"
                            >
                              O'chirish
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {meta ? <span className="badge-soft">{meta.packaging}</span> : null}
                            {meta ? (
                              <span className={meta.stockTone === "success" ? "badge-success" : "badge-warning"}>
                                {meta.stockLabel}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-primary">
                                {formatPrice(toNumber(item.products?.price))}
                              </p>
                              <p className="text-xs text-textSecondary">
                                Jami: {formatPrice(itemTotal)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                className="inline-icon-button"
                                onClick={() =>
                                  updateQuantity.mutate({
                                    productId: item.product_id,
                                    quantity: Math.max(1, item.quantity - 1),
                                  })
                                }
                                type="button"
                              >
                                -
                              </button>
                              <span className="font-semibold text-textPrimary">{item.quantity}</span>
                              <button
                                className="inline-icon-button active"
                                onClick={() =>
                                  updateQuantity.mutate({
                                    productId: item.product_id,
                                    quantity: item.quantity + 1,
                                  })
                                }
                                type="button"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[24px] bg-bgMain/80 px-4 py-4 text-sm text-textSecondary">
                Seller subtotal: <span className="font-black text-textPrimary">{formatPrice(vendorTotal)}</span>
              </div>
            </section>
          );
        })}
      </div>

      {items.length ? (
        <>
          <section className="section-shell space-y-4">
            <div>
              <p className="eyebrow text-primary">Delivery option</p>
              <h2 className="section-title">Yetkazib berish usuli</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                {
                  description: "Fresh buyurtmalar uchun ustuvor slot va sovuq transport.",
                  label: "Cold express",
                  value: "cold_express",
                },
                {
                  description: "Katta savat va wholesale uchun mos, narxi pastroq.",
                  label: "Rejalashtirilgan slot",
                  value: "scheduled",
                },
              ].map((option) => (
                <button
                  className={`feature-card text-left ${deliveryMode === option.value ? "ring-2 ring-dark/20" : ""}`}
                  key={option.value}
                  onClick={() => setDeliveryMode(option.value)}
                  type="button"
                >
                  <p className="text-lg font-black text-textPrimary">{option.label}</p>
                  <p className="mt-2 text-sm leading-6 text-textSecondary">{option.description}</p>
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                className="input-field"
                onChange={(event) => setPromoCode(event.target.value)}
                placeholder="Promo code bo'lsa kiriting"
                value={promoCode}
              />
              <button
                className="btn-secondary"
                onClick={() => showToast("Promo kod tizimi keyingi bosqichda ulanadi")}
                type="button"
              >
                Qo'llash
              </button>
            </div>

            <div className="rounded-[24px] bg-primary-soft/60 px-4 py-4 text-sm leading-6 text-textSecondary">
              Minimal buyurtma ogohlantirishi: fresh sellerlar uchun 0.5 kg yoki 1 dona dan kam savatlarda delivery slot torayishi mumkin.
            </div>
          </section>

          {recommendedProducts.length ? (
            <section className="section-shell">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-primary">Qayta buyurtma tavsiyasi</p>
                  <h2 className="section-title">Savatni to'ldirish uchun qo'shimcha mahsulotlar</h2>
                </div>
                <Link className="text-sm font-bold text-primary" to="/products">
                  Ko'proq
                </Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {recommendedProducts.map((product) => (
                  <div className="feature-card" key={product.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-textPrimary">{product.name}</h3>
                        <p className="mt-1 text-sm text-textSecondary">
                          {getMarketplaceProductMeta(product).sellerName}
                        </p>
                      </div>
                      <button
                        className="chip"
                        onClick={() =>
                          api
                            .post("/cart", { product_id: product.id, quantity: 1 })
                            .then(async () => {
                              await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
                              showToast(`${product.name} savatga qo'shildi`);
                            })
                        }
                        type="button"
                      >
                        Qo'shish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {items.length ? (
        <div className="floating-cta">
          <div className="w-full">
            <div className="mb-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-textSecondary">Subtotal</span>
                <span className="font-bold text-textPrimary">{formatPrice(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-textSecondary">Shipping</span>
                <span className="font-bold text-textPrimary">{formatPrice(shipping)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-textSecondary">Jami</span>
                <span className="text-lg font-black text-textPrimary">{formatPrice(grandTotal)}</span>
              </div>
            </div>
            <Link className="btn-primary flex items-center justify-center" to="/checkout">
              Checkout ga o'tish
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
