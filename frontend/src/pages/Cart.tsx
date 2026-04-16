import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AuthNotice from "../components/AuthNotice";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchCart, queryKeys } from "../lib/queries";
import { formatPrice, toNumber } from "../lib/utils";

export default function Cart() {
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();
  const canAccessProtectedApi = canUseProtectedApi();

  const cartQuery = useQuery({
    enabled: canAccessProtectedApi,
    queryFn: fetchCart,
    queryKey: queryKeys.cart,
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
        <AuthNotice title="Savatcha yopiq" />
      </div>
    );
  }

  const items = cartQuery.data ?? [];
  const total = items.reduce(
    (sum, item) => sum + toNumber(item.products?.price) * item.quantity,
    0,
  );

  return (
    <div className="page-wrap space-y-4 p-4 pb-40">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow">Savatcha</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hero-title text-[2rem]">Buyurtma uchun tayyor</h1>
            <p className="mt-2 text-sm text-white/80">Taxminiy yetkazish vaqti: ~30 daqiqa</p>
          </div>
          {items.length ? (
            <button
              className="chip bg-white/[0.14] text-white"
              onClick={() => clearCart.mutate()}
              type="button"
            >
              Tozalash
            </button>
          ) : null}
        </div>
      </div>

      {cartQuery.isLoading ? <ListSkeleton /> : null}

      {!cartQuery.isLoading && !items.length ? (
        <div className="surface-panel text-sm text-textSecondary">
          Savatcha bo'sh. Mahsulot qo'shish uchun mahsulotlar sahifasiga o'ting.
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <div className="surface-panel" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {item.products?.image_url ? (
                  <img
                    alt={item.products?.name ?? "Mahsulot"}
                    className="h-16 w-16 rounded-[20px] object-cover"
                    src={item.products.image_url}
                  />
                ) : null}
                <div>
                  <h2 className="text-sm font-semibold text-textPrimary">
                    {item.products?.name ?? "Mahsulot"}
                  </h2>
                  <p className="mt-1 text-sm text-primary">
                    {formatPrice(toNumber(item.products?.price))}
                  </p>
                </div>
              </div>
              <button
                className="text-sm font-semibold text-danger"
                onClick={() => removeItem.mutate(item.product_id)}
                type="button"
              >
                O'chirish
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-lg font-bold"
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
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-lg font-bold text-white"
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
        ))}
      </div>

      {items.length ? (
        <div className="nav-shell fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 border-none p-4">
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-textSecondary">Jami</span>
              <span className="text-lg font-bold text-textPrimary">
                {formatPrice(total)}
              </span>
            </div>
            <Link className="btn-primary flex items-center justify-center" to="/checkout">
              Buyurtma berish
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
