import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AuthNotice from "../components/AuthNotice";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchOrders, queryKeys } from "../lib/queries";
import {
  formatDate,
  formatPrice,
  getOrderStatusMeta,
  shortId,
  toNumber,
} from "../lib/utils";

export default function Orders() {
  const canAccessProtectedApi = canUseProtectedApi();
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();
  const ordersQuery = useQuery({
    enabled: canAccessProtectedApi,
    queryFn: fetchOrders,
    queryKey: queryKeys.orders,
  });

  if (!canAccessProtectedApi) {
    return (
      <div className="p-4">
        <AuthNotice title="Buyurtmalar Telegram ichida ishlaydi" />
      </div>
    );
  }

  const orders = ordersQuery.data ?? [];
  const activeOrders = orders.filter((order) => !["completed", "cancelled"].includes(order.status));
  const completedOrders = orders.filter((order) => order.status === "completed");
  const totalSpent = completedOrders.reduce((sum, order) => sum + toNumber(order.total_price), 0);

  return (
    <div className="page-wrap space-y-4 p-4 pb-32">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow text-white/70">Orders</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="hero-title text-[2rem]">Buyurtma markazi</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
              Status, tracking va repeat order bitta professional oqimga yig'ilgan.
            </p>
          </div>
          <button className="btn-ghost" onClick={() => void ordersQuery.refetch()} type="button">
            Yangilash
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Faol</p>
            <p className="mt-2 text-lg font-black text-white">{activeOrders.length}</p>
          </div>
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Yakunlangan</p>
            <p className="mt-2 text-lg font-black text-white">{completedOrders.length}</p>
          </div>
          <div className="rounded-[24px] bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Jami xarid</p>
            <p className="mt-2 text-lg font-black text-white">{formatPrice(totalSpent)}</p>
          </div>
        </div>
      </div>

      {ordersQuery.isLoading ? <ListSkeleton count={3} /> : null}

      {!ordersQuery.isLoading && !orders.length ? (
        <div className="empty-state">
          <p className="eyebrow">No orders</p>
          <h2 className="section-title">Hozircha buyurtma yo'q</h2>
          <p className="mt-3 text-sm leading-6 text-textSecondary">
            Birinchi retail yoki wholesale buyurtmani katalogdan boshlang.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {orders.map((order) => {
          const status = getOrderStatusMeta(order.status);
          return (
            <Link className="block" key={order.id} to={`/orders/${order.id}`}>
              <div className="section-shell">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-textPrimary">
                      Buyurtma {shortId(order.id)}
                    </p>
                    <p className="mt-1 text-sm text-textSecondary">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`chip ${status.tone}`}>{status.label}</span>
                </div>

                <p className="mt-4 text-sm leading-6 text-textSecondary">
                  {order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <div className="feature-card">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">
                      Jami
                    </p>
                    <p className="mt-1 text-lg font-black text-primary">
                      {formatPrice(toNumber(order.total_price))}
                    </p>
                  </div>
                  <div className="feature-card">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">
                      Manzil
                    </p>
                    <p className="mt-1 text-sm leading-6 text-textPrimary">{order.location}</p>
                  </div>
                  {order.status === "completed" ? (
                    <button
                      className="btn-secondary"
                      onClick={async (event) => {
                        event.preventDefault();
                        await api.post(`/orders/${order.id}/reorder`, {});
                        await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
                        showToast("Buyurtma savatchaga qayta qo'shildi");
                      }}
                      type="button"
                    >
                      Yana buyurtma
                    </button>
                  ) : (
                    <span className="badge-soft">Live tracking</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
