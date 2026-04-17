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
      description="Retail va wholesale oqimining asosiy ko'rsatkichlari, top seller signal va so'nggi buyurtmalar shu sahifada jamlangan."
      title="Operatsiyalar markazi"
    >
      {dashboardQuery.isLoading ? <ListSkeleton count={4} /> : null}

      {dashboard ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, index) => (
              <div className={index < 2 ? "metric-card" : "section-shell"} key={metric.key}>
                <p className={`text-xs uppercase tracking-[0.2em] ${index < 2 ? "text-white/70" : "text-textSecondary"}`}>
                  {metric.label}
                </p>
                <p className={`mt-3 text-4xl font-black ${index < 2 ? "text-white" : "text-textPrimary"}`}>
                  {dashboard[metric.key]}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="section-shell">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-primary">Tushum</p>
                  <h2 className="section-title">Bugungi va oylik ko'rsatkichlar</h2>
                </div>
                <Link className="chip" to="/admin/orders">
                  Buyurtmalarga o'tish
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70">Bugun</p>
                  <p className="mt-2 text-3xl font-black">{formatPrice(toNumber(dashboard.today_revenue))}</p>
                </div>
                <div className="section-shell !p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-textSecondary">Shu oy</p>
                  <p className="mt-2 text-3xl font-black text-textPrimary">
                    {formatPrice(toNumber(dashboard.month_revenue))}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="feature-card">
                  <p className="eyebrow text-dark">Fulfillment</p>
                  <p className="mt-2 text-lg font-black text-textPrimary">Cold chain monitoring</p>
                </div>
                <div className="feature-card">
                  <p className="eyebrow text-dark">Moderation</p>
                  <p className="mt-2 text-lg font-black text-textPrimary">Seller va katalog oqimi faol</p>
                </div>
                <div className="feature-card">
                  <p className="eyebrow text-dark">B2B</p>
                  <p className="mt-2 text-lg font-black text-textPrimary">Contract supply tayyor</p>
                </div>
              </div>
            </section>

            <section className="section-shell">
              <div className="flex items-center justify-between gap-3">
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
                  <div className="feature-card flex items-center justify-between" key={product.product_id}>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-textSecondary">TOP {index + 1}</p>
                      <p className="mt-1 text-sm font-black text-textPrimary">{product.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">{product.count} dona</p>
                      <p className="text-xs text-textSecondary">{formatPrice(toNumber(product.revenue))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="section-shell">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-primary">So'nggi buyurtmalar</p>
                <h2 className="section-title">Live operations feed</h2>
              </div>
              <Link className="chip" to="/admin/orders">
                To'liq ro'yxat
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {dashboard.recent_orders.map((order) => {
                const status = getOrderStatusMeta(order.status);
                return (
                  <div className="feature-card" key={order.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-textPrimary">Buyurtma {shortId(order.id)}</p>
                        <p className="mt-1 text-sm text-textSecondary">{formatDateTime(order.created_at)}</p>
                      </div>
                      <span className={`chip ${status.tone}`}>{status.label}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-textSecondary">
                      {order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </AdminLayout>
  );
}
