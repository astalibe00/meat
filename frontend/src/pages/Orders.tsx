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
        <AuthNotice title="Buyurtmalar yopiq" />
      </div>
    );
  }

  return (
    <div className="page-wrap space-y-4 p-4 pb-28">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow">Buyurtmalar</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hero-title text-[2rem]">Jarayonni kuzating</h1>
            <p className="mt-2 text-sm text-white/80">
              Holat real vaqtda yangilanadi, kerak bo'lsa bir tugma bilan qayta buyurtma berasiz.
            </p>
          </div>
          <button
            className="chip bg-white/[0.14] text-white"
            onClick={() => void ordersQuery.refetch()}
            type="button"
          >
            Yangilash
          </button>
        </div>
      </div>

      {ordersQuery.isLoading ? <ListSkeleton /> : null}

      {!ordersQuery.isLoading && !ordersQuery.data?.length ? (
        <div className="surface-panel text-sm text-textSecondary">
          Hozircha buyurtmalar yo'q.
        </div>
      ) : null}

      <div className="space-y-3">
        {ordersQuery.data?.map((order) => {
          const status = getOrderStatusMeta(order.status);

          return (
            <Link className="block" key={order.id} to={`/orders/${order.id}`}>
              <div className="surface-panel">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-textPrimary">
                      Buyurtma {shortId(order.id)}
                    </p>
                    <p className="mt-1 text-xs text-textSecondary">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>
                    {status.label}
                  </span>
                </div>
                <div className="mt-3 text-sm text-textSecondary">
                  {order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                </div>
                <div className="mt-3 text-sm font-bold text-primary">
                  {formatPrice(toNumber(order.total_price))}
                </div>
                {order.status === "completed" ? (
                  <button
                    className="chip mt-4"
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
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
