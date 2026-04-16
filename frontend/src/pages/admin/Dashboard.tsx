import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { ListSkeleton } from "../../components/Skeleton";
import { fetchAdminDashboard, queryKeys } from "../../lib/queries";
import {
  formatDateTime,
  formatPrice,
  getOrderStatusMeta,
  shortId,
  toNumber,
} from "../../lib/utils";

const metrics = [
  { key: "pending_orders", label: "Kutilayotgan buyurtmalar" },
  { key: "active_deliveries", label: "Faol yetkazmalar" },
  { key: "active_products", label: "Faol mahsulotlar" },
  { key: "categories_count", label: "Kategoriyalar" },
] as const;

export default function AdminDashboard() {
  const dashboardQuery = useQuery({
    queryFn: fetchAdminDashboard,
    queryKey: queryKeys.adminDashboard,
  });

  const dashboard = dashboardQuery.data;

  return (
    <AdminLayout
      description="Buyurtmalar, mahsulotlar va savdo ko'rsatkichlarini bir joydan boshqaring."
      title="Operatsiyalar markazi"
    >
      {dashboardQuery.isLoading ? <ListSkeleton count={4} /> : null}

      {dashboard ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            {metrics.map((metric) => (
              <div className="surface-panel" key={metric.key}>
                <p className="text-xs uppercase tracking-[0.2em] text-textSecondary">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-black text-textPrimary">
                  {dashboard[metric.key]}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
            <div className="surface-panel">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow text-primary">Bugungi holat</p>
                  <h2 className="section-title">Tushum va so'nggi buyurtmalar</h2>
                </div>
                <Link className="chip" to="/admin/orders">
                  Barchasi
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] bg-primary px-4 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                    Bugun
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {formatPrice(toNumber(dashboard.today_revenue))}
                  </p>
                </div>
                <div className="rounded-[24px] bg-[#1f2a37] px-4 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                    Shu oy
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {formatPrice(toNumber(dashboard.month_revenue))}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {dashboard.recent_orders.map((order) => {
                  const status = getOrderStatusMeta(order.status);

                  return (
                  <div className="rounded-[24px] border border-black/5 px-4 py-4" key={order.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-textPrimary">
                          Buyurtma {shortId(order.id)}
                        </p>
                        <p className="mt-1 text-xs text-textSecondary">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <span className={`chip ${status.tone}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-textSecondary">
                      {order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                    </p>
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="surface-panel">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow text-primary">Top mahsulotlar</p>
                  <h2 className="section-title">Eng ko'p sotilganlar</h2>
                </div>
                <Link className="chip" to="/admin/products">
                  Boshqarish
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {dashboard.top_products.map((product, index) => (
                  <div
                    className="flex items-center justify-between rounded-[24px] border border-black/5 px-4 py-4"
                    key={product.product_id}
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-textSecondary">
                        TOP {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-bold text-textPrimary">
                        {product.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{product.count} dona</p>
                      <p className="text-xs text-textSecondary">
                        {formatPrice(toNumber(product.revenue))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
}
