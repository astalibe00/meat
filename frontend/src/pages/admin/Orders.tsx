import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useToast } from "../../components/Toast";
import { api } from "../../lib/api";
import { fetchAdminOrders, queryKeys } from "../../lib/queries";
import {
  formatDateTime,
  formatPrice,
  getOrderStatusMeta,
  shortId,
  toNumber,
} from "../../lib/utils";
import type { OrderStatus } from "../../lib/types";

const filters: Array<{ label: string; value?: OrderStatus }> = [
  { label: "Barchasi" },
  { label: "Yangi", value: "pending" },
  { label: "Tasdiqlangan", value: "accepted" },
  { label: "Tayyorlanmoqda", value: "preparing" },
  { label: "Yo'lda", value: "delivering" },
  { label: "Yakunlangan", value: "completed" },
];

const transitions: Record<OrderStatus, OrderStatus[]> = {
  accepted: ["preparing", "delivering", "cancelled"],
  cancelled: [],
  completed: [],
  delivering: ["completed"],
  pending: ["accepted", "cancelled"],
  preparing: ["delivering", "cancelled"],
};

const statusLabels: Record<OrderStatus, string> = {
  accepted: "Tasdiqlandi",
  cancelled: "Bekor qilindi",
  completed: "Yakunlandi",
  delivering: "Yo'lda",
  pending: "Qabul qilish",
  preparing: "Tayyorlanmoqda",
};

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();

  const ordersQuery = useQuery({
    queryFn: () => fetchAdminOrders(statusFilter),
    queryKey: queryKeys.adminOrders(statusFilter),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      showToast("Buyurtma holati yangilandi");
    },
  });

  return (
    <AdminLayout
      description="Operator uchun eng tez oqim: filtrlang, oching, bir tugma bilan statusni almashtiring."
      title="Buyurtmalar"
    >
      <ToastComponent />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            className={`chip ${statusFilter === filter.value ? "bg-primary text-white" : ""}`}
            key={filter.label}
            onClick={() => setStatusFilter(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {ordersQuery.data?.map((order) => {
          const status = getOrderStatusMeta(order.status);

          return (
          <div className="surface-panel" key={order.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-textPrimary">
                  Buyurtma {shortId(order.id)}
                </p>
                <p className="mt-1 text-sm text-textSecondary">
                  {formatDateTime(order.created_at)}
                </p>
                <p className="mt-3 text-sm text-textSecondary">
                  {order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                </p>
              </div>
              <div className="text-right">
                <span className={`chip ${status.tone}`}>{status.label}</span>
                <p className="mt-3 text-lg font-black text-primary">
                  {formatPrice(toNumber(order.total_price))}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-textSecondary">
              <p>Manzil: {order.location}</p>
              <p>Telefon: {order.phone}</p>
              <p>
                Mijoz: {order.users?.first_name ?? "Mijoz"} {order.users?.last_name ?? ""}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {transitions[order.status].map((status) => (
                <button
                  className="chip"
                  key={status}
                  onClick={() => updateStatus.mutate({ id: order.id, status })}
                  type="button"
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>
          </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
