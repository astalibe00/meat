import { useEffect, useState } from "react";
import { Megaphone, PackagePlus, RefreshCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { useApp } from "@/store/useApp";
import type { ManagedProduct, OrderStatus } from "@/types/app-data";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivering",
  "completed",
  "cancelled",
];

const EMPTY_PRODUCT: Partial<ManagedProduct> = {
  category: "beef",
  weight: "1 kg",
  stockKg: 10,
  minOrderKg: 0.3,
  enabled: true,
  tags: ["Fresh"],
  weightOptions: ["1 kg"],
};

export default function AdminPage() {
  const syncRemoteData = useApp((state) => state.syncRemoteData);
  const orders = useApp((state) => state.orders);
  const products = useApp((state) => state.products);
  const updateOrderStatus = useApp((state) => state.updateOrderStatus);
  const saveManagedProduct = useApp((state) => state.saveManagedProduct);
  const deleteManagedProduct = useApp((state) => state.deleteManagedProduct);
  const broadcastMessage = useApp((state) => state.broadcastMessage);
  const [draft, setDraft] = useState<Partial<ManagedProduct>>(EMPTY_PRODUCT);
  const [broadcast, setBroadcast] = useState({ title: "Aksiya", body: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void syncRemoteData();
  }, [syncRemoteData]);

  const submitProduct = async () => {
    setLoading(true);
    const result = await saveManagedProduct(draft);
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? "Mahsulot saqlanmadi.");
      return;
    }

    toast.success("Mahsulot saqlandi.");
    setDraft(EMPTY_PRODUCT);
  };

  const submitBroadcast = async () => {
    setLoading(true);
    const result = await broadcastMessage(broadcast.title, broadcast.body);
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? "Xabar yuborilmadi.");
      return;
    }

    toast.success("Bildirishnoma yuborildi.");
    setBroadcast({ title: "Aksiya", body: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Admin Panel</p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">Bot va Mini App boshqaruvi</h1>
          </div>
          <button
            onClick={() => void syncRemoteData()}
            className="tap h-11 px-5 rounded-full bg-surface border border-border text-sm font-semibold inline-flex items-center gap-2 active:scale-95 transition-transform"
          >
            <RefreshCcw className="w-4 h-4" strokeWidth={2.2} />
            Yangilash
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl bg-surface p-5 shadow-card">
            <h2 className="font-serif text-2xl font-semibold">Buyurtmalar</h2>
            <div className="mt-4 space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-paper p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{order.id}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.customer.name} • {order.customer.phone || "Telefon yo'q"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                      <p className="text-[11px] text-muted-foreground">{ORDER_STATUS_LABELS[order.status]}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={async () => {
                          const result = await updateOrderStatus(order.id, status);
                          if (!result.ok) {
                            toast.error(result.error ?? "Status yangilanmadi.");
                            return;
                          }

                          toast.success("Status yangilandi.");
                        }}
                        className={`tap h-9 px-3 rounded-full text-xs font-semibold border active:scale-95 transition-transform ${
                          order.status === status
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-border bg-surface"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-primary" strokeWidth={2.2} />
                <h2 className="font-serif text-2xl font-semibold">Mahsulot boshqaruvi</h2>
              </div>
              <div className="mt-4 grid gap-3">
                <input
                  value={draft.name ?? ""}
                  onChange={(event) => setDraft((state) => ({ ...state, name: event.target.value }))}
                  className="rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border"
                  placeholder="Mahsulot nomi"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={draft.price ?? ""}
                    onChange={(event) => setDraft((state) => ({ ...state, price: Number(event.target.value) }))}
                    className="rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border"
                    placeholder="Narx"
                  />
                  <input
                    value={draft.weight ?? ""}
                    onChange={(event) => setDraft((state) => ({ ...state, weight: event.target.value }))}
                    className="rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border"
                    placeholder="Vazn"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={draft.stockKg ?? ""}
                    onChange={(event) => setDraft((state) => ({ ...state, stockKg: Number(event.target.value) }))}
                    className="rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border"
                    placeholder="Qoldiq kg"
                  />
                  <input
                    value={draft.minOrderKg ?? ""}
                    onChange={(event) => setDraft((state) => ({ ...state, minOrderKg: Number(event.target.value) }))}
                    className="rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border"
                    placeholder="Minimal kg"
                  />
                </div>
                <textarea
                  value={draft.description ?? ""}
                  onChange={(event) => setDraft((state) => ({ ...state, description: event.target.value }))}
                  className="rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border resize-none min-h-[96px]"
                  placeholder="Tavsif"
                />
                <button
                  onClick={() => void submitProduct()}
                  disabled={loading}
                  className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" strokeWidth={2.2} />
                  Saqlash
                </button>
              </div>

              <div className="mt-5 space-y-2">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold line-clamp-1">{product.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {product.stockKg} kg • {formatCurrency(product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDraft(product)}
                        className="tap h-9 px-3 rounded-full bg-surface border border-border text-xs font-semibold active:scale-95 transition-transform"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={async () => {
                          const result = await deleteManagedProduct(product.id);
                          if (!result.ok) {
                            toast.error(result.error ?? "O'chirib bo'lmadi.");
                            return;
                          }

                          toast.success("Mahsulot o'chirildi.");
                        }}
                        className="tap h-9 w-9 rounded-full bg-surface border border-border grid place-items-center active:scale-95 transition-transform"
                        aria-label="Mahsulotni o'chirish"
                      >
                        <Trash2 className="w-4 h-4 text-sale" strokeWidth={2.1} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" strokeWidth={2.2} />
                <h2 className="font-serif text-2xl font-semibold">Botga xabar yuborish</h2>
              </div>
              <div className="mt-4 grid gap-3">
                <input
                  value={broadcast.title}
                  onChange={(event) => setBroadcast((state) => ({ ...state, title: event.target.value }))}
                  className="rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border"
                  placeholder="Sarlavha"
                />
                <textarea
                  value={broadcast.body}
                  onChange={(event) => setBroadcast((state) => ({ ...state, body: event.target.value }))}
                  className="rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border resize-none min-h-[120px]"
                  placeholder="Mijozlarga yuboriladigan reklama yoki aksiya matni"
                />
                <button
                  onClick={() => void submitBroadcast()}
                  disabled={loading || !broadcast.body.trim()}
                  className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform disabled:opacity-60"
                >
                  Xabar yuborish
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
