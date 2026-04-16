import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthNotice from "../components/AuthNotice";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchOrder, queryKeys } from "../lib/queries";
import { supabase } from "../lib/supabase";
import { formatPrice, orderTimeline, shortId, toNumber } from "../lib/utils";

export default function OrderTracking() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canAccessProtectedApi = canUseProtectedApi();
  const { ToastComponent, showToast } = useToast();

  const orderQuery = useQuery({
    enabled: canAccessProtectedApi && Boolean(id),
    queryFn: () => fetchOrder(id),
    queryKey: queryKeys.order(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "cancelled" ? false : 5000;
    },
  });

  const reorder = useMutation({
    mutationFn: () => api.post(`/orders/${id}/reorder`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      showToast("Buyurtma savatchaga qayta qo'shildi");
    },
  });

  useEffect(() => {
    const realtimeClient = supabase;

    if (!realtimeClient || !id) {
      return;
    }

    const channel = realtimeClient
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `id=eq.${id}`,
          schema: "public",
          table: "orders",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
        },
      )
      .subscribe();

    return () => {
      void realtimeClient.removeChannel(channel);
    };
  }, [id, queryClient]);

  if (!canAccessProtectedApi) {
    return (
      <div className="p-4">
        <AuthNotice title="Kuzatuv yopiq" />
      </div>
    );
  }

  if (orderQuery.isLoading) {
    return <div className="p-4 text-sm text-textSecondary">Buyurtma yuklanmoqda...</div>;
  }

  if (!orderQuery.data) {
    return <div className="p-4 text-sm text-textSecondary">Buyurtma topilmadi.</div>;
  }

  const order = orderQuery.data;
  const currentIndex =
    order.status === "cancelled"
      ? -1
      : orderTimeline.findIndex((step) => step.key === order.status);

  return (
    <div className="page-wrap space-y-5 p-4 pb-28">
      <ToastComponent />
      <button
        className="text-sm font-semibold text-primary"
        onClick={() => navigate(-1)}
        type="button"
      >
        Ortga
      </button>

      <div className="hero-panel">
        <p className="eyebrow">Tracking</p>
        <h1 className="hero-title text-[2rem]">
          Buyurtma {shortId(order.id)}
        </h1>
        <p className="mt-2 text-sm text-white/80">Taxminiy yetkazish vaqti: ~30 daqiqa</p>
      </div>

      <div className="surface-panel">
        <div className="space-y-4">
          {orderTimeline.map((step, index) => {
            const isDone = currentIndex >= index;
            const isActive = currentIndex === index;

            return (
              <div className="flex items-center gap-3" key={step.key}>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    isDone ? "bg-primary text-white" : "bg-surface text-textSecondary"
                  } ${isActive ? "ring-4 ring-primary/20" : ""}`}
                >
                  {index + 1}
                </div>
                <span className={isDone ? "font-semibold text-textPrimary" : "text-textSecondary"}>
                  {step.label}
                </span>
              </div>
            );
          })}

          {order.status === "cancelled" ? (
            <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
              Buyurtma bekor qilingan.
            </div>
          ) : null}
        </div>
      </div>

      <div className="surface-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Buyurtma ma'lumotlari</h2>
          <Link className="chip" to="/orders">
            Barcha buyurtmalar
          </Link>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-textSecondary">Manzil</span>
            <span className="text-textPrimary">{order.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-textSecondary">Telefon</span>
            <span className="text-textPrimary">{order.phone}</span>
          </div>
          <div className="space-y-2 border-t border-black/5 pt-3">
            {order.items.map((item) => (
              <div className="flex items-center justify-between" key={`${item.product_id}-${item.name}`}>
                <span className="text-textSecondary">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-semibold text-textPrimary">
                  {formatPrice(toNumber(item.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-black/5 pt-3">
            <span className="font-semibold text-textPrimary">Jami</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(toNumber(order.total_price))}
            </span>
          </div>
        </div>
        <button className="chip mt-4" onClick={() => reorder.mutate()} type="button">
          Yana buyurtma
        </button>
      </div>
    </div>
  );
}
