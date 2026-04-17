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
        <AuthNotice title="Tracking Telegram ichida ishlaydi" />
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

      <button className="btn-secondary !w-auto" onClick={() => navigate(-1)} type="button">
        Ortga
      </button>

      <div className="hero-panel">
        <p className="eyebrow text-white/70">Tracking</p>
        <h1 className="hero-title text-[2rem]">Buyurtma {shortId(order.id)}</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
          Status realtime yangilanadi. Admin panel va bot orqali o'zgargan har bir bosqich shu yerda ko'rinadi.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="section-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-primary">Timeline</p>
              <h2 className="section-title">Buyurtma holati</h2>
            </div>
            <span className={order.status === "cancelled" ? "badge-danger" : "badge-success"}>
              {order.status === "cancelled" ? "Bekor qilingan" : "Faol"}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {orderTimeline.map((step, index) => {
              const isDone = currentIndex >= index;
              const isActive = currentIndex === index;

              return (
                <div className="flex items-start gap-4" key={step.key}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                        isDone ? "bg-primary text-white" : "bg-bgMain text-textSecondary"
                      } ${isActive ? "ring-4 ring-primary/20" : ""}`}
                    >
                      {index + 1}
                    </div>
                    {index !== orderTimeline.length - 1 ? (
                      <div className={`mt-2 h-10 w-px ${isDone ? "bg-primary/30" : "bg-black/8"}`} />
                    ) : null}
                  </div>
                  <div className="pt-2">
                    <p className={`text-base font-black ${isDone ? "text-textPrimary" : "text-textSecondary"}`}>
                      {step.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-textSecondary">
                      {isActive
                        ? "Hozirgi bosqich shu yerda."
                        : isDone
                          ? "Bosqich muvaffaqiyatli yakunlangan."
                          : "Keyingi avtomatik yangilanishda yoki admin actiondan so'ng ko'rinadi."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-5">
          <section className="section-shell">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-primary">Order details</p>
                <h2 className="section-title">Tafsilotlar</h2>
              </div>
              <Link className="chip" to="/orders">
                Barcha buyurtmalar
              </Link>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="feature-card">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">Manzil</p>
                <p className="mt-2 text-textPrimary">{order.location}</p>
              </div>
              <div className="feature-card">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">Telefon</p>
                <p className="mt-2 text-textPrimary">{order.phone}</p>
              </div>
              <div className="feature-card">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">Yetkazish</p>
                <p className="mt-2 text-textPrimary">~30 daqiqa, sovuq zanjir nazoratida</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-black/5 pt-4">
              {order.items.map((item) => (
                <div className="flex items-center justify-between" key={`${item.product_id}-${item.name}`}>
                  <span className="text-sm text-textSecondary">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="text-sm font-semibold text-textPrimary">
                    {formatPrice(toNumber(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
              <span className="font-semibold text-textPrimary">Jami</span>
              <span className="text-lg font-black text-primary">{formatPrice(toNumber(order.total_price))}</span>
            </div>
          </section>

          <section className="metric-card">
            <p className="eyebrow text-white/70">Repeat order</p>
            <h2 className="mt-2 text-3xl font-black">Buyurtma yoqqan bo'lsa bir tegishda takrorlang</h2>
            <p className="mt-3 text-sm leading-6 text-white/82">
              Savatchaga qayta tushadi, checkout oqimi esa profil bilan avtomatik to'ladi.
            </p>
            <button className="chip mt-5 bg-white text-textPrimary" onClick={() => reorder.mutate()} type="button">
              Yana buyurtma
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
