import { useMemo, useState } from "react";
import { Clock3, PackageCheck, Star, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/EmptyState";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-status";
import { useApp } from "@/store/useApp";
import type { CustomerOrder } from "@/types/app-data";

export function OrdersScreen() {
  const orders = useApp((state) => state.orders);
  const navigate = useApp((state) => state.navigate);
  const cancelOrder = useApp((state) => state.cancelOrder);
  const submitReview = useApp((state) => state.submitReview);

  if (orders.length === 0) {
    return (
      <div className="animate-screen-in px-5 pt-3 pb-6">
        <EmptyState
          icon={<PackageCheck className="w-9 h-9" strokeWidth={1.75} />}
          title="Buyurtmalar yo'q"
          body="Buyurtma qilganingizdan keyin uning holati shu yerda ko'rinadi."
          action={
            <button
              onClick={() => navigate({ name: "categories" })}
              className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
            >
              Xaridni boshlash
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Buyurtmalar</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
        Buyurtma tracking
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Admin tasdiqlashi, tayyorlash va yetkazishni shu sahifada kuzatasiz.
      </p>

      <div className="mt-5 space-y-3">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onCancel={async () => {
              const result = await cancelOrder(order.id);
              if (!result.ok) {
                toast.error(result.error ?? "Bekor qilish bajarilmadi.");
                return;
              }

              toast.success("Bekor qilish so'rovi yuborildi.");
            }}
            onReview={async (rating, comment) => {
              const firstLine = order.items[0];
              if (!firstLine) {
                return;
              }

              const result = await submitReview({
                orderId: order.id,
                productId: firstLine.product.id,
                rating,
                comment,
              });

              if (!result.ok) {
                toast.error(result.error ?? "Sharh yuborilmadi.");
                return;
              }

              toast.success("Sharh qabul qilindi.");
            }}
          />
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onCancel,
  onReview,
}: {
  order: CustomerOrder;
  onCancel: () => Promise<void>;
  onReview: (rating: number, comment?: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busyAction, setBusyAction] = useState<"" | "cancel" | "review">("");
  const createdAt = new Date(order.createdAt);
  const canCancel = !["completed", "cancelled"].includes(order.status);
  const canReview = order.status === "completed" && (order.reviewIds?.length ?? 0) === 0;
  const headlineEvent = useMemo(
    () => order.statusHistory[order.statusHistory.length - 1],
    [order.statusHistory],
  );

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{order.id}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatDate(createdAt)} {formatTime(createdAt)}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-primary-soft text-primary text-[11px] font-semibold">
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <OrderStat icon={<PackageCheck className="w-4 h-4" strokeWidth={2.25} />} label="Tovar" value={String(order.items.length)} />
        <OrderStat icon={<Clock3 className="w-4 h-4" strokeWidth={2.25} />} label="To'lov" value={PAYMENT_METHOD_LABELS[order.paymentMethod]} />
        <OrderStat icon={<Truck className="w-4 h-4" strokeWidth={2.25} />} label="Jami" value={formatCurrency(order.total)} />
      </div>

      <div className="mt-4 rounded-2xl bg-paper p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Holat
        </p>
        <p className="mt-2 text-sm font-semibold">
          {headlineEvent?.label ?? ORDER_STATUS_LABELS[order.status]}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </p>
        <div className="mt-3 space-y-2">
          {order.statusHistory.map((event) => (
            <div key={event.id} className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDate(event.createdAt)} {formatTime(event.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {order.items.map((line) => (
          <div key={`${line.product.id}-${line.weightOption ?? line.product.weight}`} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {line.quantity} x {line.product.name} ({line.weightOption ?? line.product.weight})
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(line.product.price * line.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-border my-4" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        {order.customer.fulfillmentType === "pickup"
          ? "Tarqatish punkti"
          : `Yetkazish manzili: ${order.customer.address ?? "-"}`}
      </p>

      {canCancel && (
        <button
          onClick={async () => {
            setBusyAction("cancel");
            await onCancel();
            setBusyAction("");
          }}
          className="tap mt-4 h-10 px-4 rounded-full bg-paper border border-border text-sm font-semibold active:scale-95 transition-transform inline-flex items-center gap-2"
        >
          <XCircle className="w-4 h-4 text-sale" strokeWidth={2.3} />
          {busyAction === "cancel" ? "Yuborilmoqda..." : "Buyurtmani bekor qilish"}
        </button>
      )}

      {canReview && (
        <div className="mt-4 rounded-2xl bg-paper p-4">
          <p className="text-sm font-semibold">Qabul qilingandan keyingi baholash</p>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className="tap rounded-full p-1 active:scale-95 transition-transform"
                  aria-label={`${value} yulduz`}
                >
                  <Star
                    className={`w-5 h-5 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                    strokeWidth={2.1}
                  />
                </button>
              );
            })}
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="mt-3 w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none border border-border resize-none min-h-[84px]"
            placeholder="Majburiy emas. Mahsulot va xizmat haqida izoh qoldirishingiz mumkin."
          />
          <button
            onClick={async () => {
              setBusyAction("review");
              await onReview(rating, comment);
              setBusyAction("");
            }}
            className="tap mt-3 h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
          >
            {busyAction === "review" ? "Yuborilmoqda..." : "Bahoni yuborish"}
          </button>
        </div>
      )}
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
