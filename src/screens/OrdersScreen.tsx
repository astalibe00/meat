import { Clock3, PackageCheck, Truck } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { useApp } from "@/store/useApp";

export function OrdersScreen() {
  const orders = useApp((state) => state.orders);
  const navigate = useApp((state) => state.navigate);

  if (orders.length === 0) {
    return (
      <div className="animate-screen-in px-5 pt-3 pb-6">
        <EmptyState
          icon={<PackageCheck className="w-9 h-9" strokeWidth={1.75} />}
          title="No orders yet"
          body="Once you place an order, the delivery timeline will appear here."
          action={
            <button
              onClick={() => navigate({ name: "categories" })}
              className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
            >
              Start shopping
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Orders</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
        Delivery timeline
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Keep this page handy to track your latest order and repeat favourites quickly.
      </p>

      <div className="mt-5 space-y-3">
        {orders.map((order, index) => {
          const createdAt = new Date(order.createdAt);
          const status = index === 0 ? "Preparing now" : "Confirmed";

          return (
            <div key={order.id} className="rounded-2xl bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{order.id}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDate(createdAt)} at {formatTime(createdAt)}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary-soft text-primary text-[11px] font-semibold">
                  {status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <OrderStat icon={<PackageCheck className="w-4 h-4" strokeWidth={2.25} />} label="Items" value={String(order.items.length)} />
                <OrderStat icon={<Clock3 className="w-4 h-4" strokeWidth={2.25} />} label="Slot" value={order.customer.deliveryWindow.split(",")[0]} />
                <OrderStat icon={<Truck className="w-4 h-4" strokeWidth={2.25} />} label="Total" value={formatCurrency(order.total)} />
              </div>

              <div className="mt-4 space-y-2">
                {order.items.map((line) => (
                  <div key={`${line.product.id}-${line.weightOption ?? line.product.weight}`} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {line.quantity} x {line.product.name}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(line.product.price * line.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-border my-4" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Delivery to {order.customer.address}
                {order.customer.notes ? ` - ${order.customer.notes}` : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-paper p-3">
      <div className="flex items-center justify-center text-primary">{icon}</div>
      <p className="text-sm font-semibold mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mt-0.5">
        {label}
      </p>
    </div>
  );
}
