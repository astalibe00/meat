import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BellRing,
  CreditCard,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  PackagePlus,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteProduct,
  fetchAdminState,
  requestAdminCode,
  saveProduct,
  sendBroadcast,
  updateOrderStatusRequest,
  validateAdminToken,
  verifyAdminCode,
} from "@/lib/app-api";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-status";
import type { CustomerProfile, ManagedProduct, OrderStatus } from "@/types/app-data";

const ADMIN_TOKEN_KEY = "fresh-halal-admin-token";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivering",
  "completed",
  "cancelled",
];

type AdminStateResponse = Awaited<ReturnType<typeof fetchAdminState>>;

const EMPTY_PRODUCT: Partial<ManagedProduct> = {
  category: "beef",
  weight: "1 kg",
  stockKg: 10,
  minOrderKg: 0.3,
  enabled: true,
  tags: ["Fresh"],
  weightOptions: ["1 kg"],
  image: "",
};

function normalizeCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [adminState, setAdminState] = useState<AdminStateResponse | null>(null);
  const [draft, setDraft] = useState<Partial<ManagedProduct>>(EMPTY_PRODUCT);
  const [broadcast, setBroadcast] = useState({ title: "Aksiya", body: "" });
  const [loading, setLoading] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const savedToken = window.localStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
    if (!savedToken) {
      return;
    }

    void (async () => {
      try {
        const validation = await validateAdminToken(savedToken);
        if (!validation.authenticated) {
          window.localStorage.removeItem(ADMIN_TOKEN_KEY);
          return;
        }

        setAdminToken(savedToken);
        setLoading(true);
        try {
          const response = await fetchAdminState(savedToken);
          setAdminState(response);
        } catch {
          window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        } finally {
          setLoading(false);
        }
      } catch {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    })();
  }, []);

  const analyticsCards = useMemo(() => {
    if (!adminState) {
      return [];
    }

    return [
      {
        title: "Jami buyurtmalar",
        value: String(adminState.analytics.ordersTotal),
        hint: `${adminState.analytics.pendingOrders} ta kutilmoqda`,
        icon: LayoutDashboard,
      },
      {
        title: "To'langan tushum",
        value: formatCurrency(adminState.analytics.paidRevenue),
        hint: `O'rtacha buyurtma ${formatCurrency(adminState.analytics.averageOrderValue)}`,
        icon: Wallet,
      },
      {
        title: "Mijozlar",
        value: String(adminState.analytics.customersTotal),
        hint: `${adminState.analytics.lowStockCount} ta mahsulot kam qoldi`,
        icon: UserRound,
      },
      {
        title: "Kutilayotgan to'lov",
        value: formatCurrency(adminState.analytics.pendingRevenue),
        hint: `${adminState.analytics.cancelledOrders} ta bekor qilingan`,
        icon: CreditCard,
      },
    ];
  }, [adminState]);

  async function loadAdminState(token = adminToken) {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAdminState(token);
      setAdminState(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Admin ma'lumotlari yuklanmadi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestCode() {
    setRequestingCode(true);
    try {
      const response = await requestAdminCode();
      toast.success(`Kod yuborildi`, {
        description: `${response.sent} ta admin chatga jo'natildi.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kod yuborilmadi.");
    } finally {
      setRequestingCode(false);
    }
  }

  async function handleVerifyCode() {
    setVerifyingCode(true);
    try {
      const response = await verifyAdminCode(verifyCode, "Vercel admin");
      window.localStorage.setItem(ADMIN_TOKEN_KEY, response.token);
      setAdminToken(response.token);
      setVerifyCode("");
      await loadAdminState(response.token);
      toast.success("Admin panel ochildi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kod tasdiqlanmadi.");
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleSaveProduct() {
    if (!adminToken) {
      toast.error("Avval admin sifatida kiring.");
      return;
    }

    setLoading(true);
    try {
      await saveProduct(
        {
          ...draft,
          tags: normalizeCsv((draft.tags ?? []).join(",")),
          weightOptions: normalizeCsv((draft.weightOptions ?? []).join(",")),
        },
        adminToken,
      );
      setDraft(EMPTY_PRODUCT);
      setImagePreview("");
      toast.success("Mahsulot saqlandi.");
      await loadAdminState(adminToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mahsulot saqlanmadi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!adminToken) {
      return;
    }

    setLoading(true);
    try {
      await deleteProduct(productId, adminToken);
      toast.success("Mahsulot o'chirildi.");
      await loadAdminState(adminToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "O'chirib bo'lmadi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    if (!adminToken) {
      return;
    }

    setLoading(true);
    try {
      await updateOrderStatusRequest(orderId, status, adminToken);
      toast.success("Buyurtma statusi yangilandi.");
      await loadAdminState(adminToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status yangilanmadi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBroadcast() {
    if (!adminToken) {
      return;
    }

    setLoading(true);
    try {
      await sendBroadcast(broadcast, adminToken);
      toast.success("Reklama xabari yuborildi.");
      setBroadcast({ title: "Aksiya", body: "" });
      await loadAdminState(adminToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xabar yuborilmadi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageChange(file?: File | null) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextImage = typeof reader.result === "string" ? reader.result : "";
      setImagePreview(nextImage);
      setDraft((state) => ({ ...state, image: nextImage }));
    };
    reader.readAsDataURL(file);
  }

  const topCustomers = useMemo(() => {
    const customers = adminState?.customers ?? [];
    return [...customers].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 12);
  }, [adminState?.customers]);

  if (!adminToken || !adminState) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-md rounded-[32px] bg-surface p-6 shadow-elevated">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
            <ShieldCheck className="h-7 w-7" strokeWidth={2.2} />
          </div>
          <h1 className="mt-4 text-center font-serif text-3xl font-semibold">Admin panel</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Kirish kodi admin Telegram chatiga yuboriladi.
          </p>

          <div className="mt-6 grid gap-3">
            <button
              onClick={() => void handleRequestCode()}
              disabled={requestingCode}
              className="tap h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {requestingCode ? "Kod yuborilmoqda..." : "Telegramga kod yuborish"}
            </button>

            <div className="rounded-2xl border border-border bg-paper px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Tasdiqlash kodi
              </p>
              <input
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm outline-none"
                placeholder="6 xonali kod"
              />
            </div>

            <button
              onClick={() => void handleVerifyCode()}
              disabled={verifyingCode || verifyCode.trim().length < 6}
              className="tap h-12 rounded-2xl border border-border bg-paper text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {verifyingCode ? "Tekshirilmoqda..." : "Admin panelga kirish"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Agar kod kelmasa, `ADMIN_TELEGRAM_IDS` env qiymatini tekshiring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Admin Panel</p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">Dashboard va boshqaruv</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void loadAdminState()}
              className="tap h-11 rounded-full border border-border bg-surface px-5 text-sm font-semibold inline-flex items-center gap-2 active:scale-95 transition-transform"
            >
              <RefreshCcw className="h-4 w-4" strokeWidth={2.2} />
              Yangilash
            </button>
            <button
              onClick={() => {
                window.localStorage.removeItem(ADMIN_TOKEN_KEY);
                window.location.reload();
              }}
              className="tap h-11 rounded-full border border-border bg-paper px-5 text-sm font-semibold inline-flex items-center gap-2 active:scale-95 transition-transform"
            >
              <KeyRound className="h-4 w-4" strokeWidth={2.2} />
              Chiqish
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary">
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.2} />
            Yangilanmoqda...
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analyticsCards.map((card) => (
            <section key={card.title} className="rounded-3xl bg-surface p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="mt-3 text-2xl font-semibold">{card.value}</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <card.icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{card.hint}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" strokeWidth={2.2} />
                <h2 className="font-serif text-2xl font-semibold">Buyurtmalar</h2>
              </div>
              <div className="mt-4 space-y-3">
                {adminState.orders.map((order) => (
                  <article key={order.id} className="rounded-2xl bg-paper p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{order.id}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.customer.name} • {order.customer.phone || "Telefon yo'q"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {PAYMENT_METHOD_LABELS[order.paymentMethod]} • {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                        <p className="text-[11px] text-muted-foreground">{ORDER_STATUS_LABELS[order.status]}</p>
                        {order.paymentReference && (
                          <p className="mt-1 text-[11px] text-muted-foreground">{order.paymentReference}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          onClick={() => void handleStatusUpdate(order.id, status)}
                          className={`tap h-9 rounded-full border px-3 text-xs font-semibold active:scale-95 transition-transform ${
                            order.status === status
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border bg-surface"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-primary" strokeWidth={2.2} />
                <h2 className="font-serif text-2xl font-semibold">Mahsulot boshqaruvi</h2>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="grid gap-3">
                  <input
                    value={draft.name ?? ""}
                    onChange={(event) => setDraft((state) => ({ ...state, name: event.target.value }))}
                    className="rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                    placeholder="Mahsulot nomi"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={draft.price ?? ""}
                      onChange={(event) => setDraft((state) => ({ ...state, price: Number(event.target.value) }))}
                      className="rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                      placeholder="Narx"
                    />
                    <input
                      value={draft.oldPrice ?? ""}
                      onChange={(event) => setDraft((state) => ({ ...state, oldPrice: Number(event.target.value) || undefined }))}
                      className="rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                      placeholder="Eski narx"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={draft.weight ?? ""}
                      onChange={(event) => setDraft((state) => ({ ...state, weight: event.target.value }))}
                      className="rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                      placeholder="Asosiy kg"
                    />
                    <input
                      value={draft.stockKg ?? ""}
                      onChange={(event) => setDraft((state) => ({ ...state, stockKg: Number(event.target.value) }))}
                      className="rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                      placeholder="Qoldiq kg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={draft.minOrderKg ?? ""}
                      onChange={(event) => setDraft((state) => ({ ...state, minOrderKg: Number(event.target.value) }))}
                      className="rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                      placeholder="Minimal kg"
                    />
                    <input
                      value={draft.origin ?? ""}
                      onChange={(event) => setDraft((state) => ({ ...state, origin: event.target.value }))}
                      className="rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                      placeholder="Manba"
                    />
                  </div>
                  <input
                    value={(draft.weightOptions ?? []).join(", ")}
                    onChange={(event) =>
                      setDraft((state) => ({ ...state, weightOptions: normalizeCsv(event.target.value) }))
                    }
                    className="rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                    placeholder="Variantlar: 0.5 kg, 1 kg, 2 kg"
                  />
                  <input
                    value={(draft.tags ?? []).join(", ")}
                    onChange={(event) =>
                      setDraft((state) => ({ ...state, tags: normalizeCsv(event.target.value) as ManagedProduct["tags"] }))
                    }
                    className="rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                    placeholder="Teglar: Fresh, Popular, Sale"
                  />
                  <textarea
                    value={draft.description ?? ""}
                    onChange={(event) => setDraft((state) => ({ ...state, description: event.target.value }))}
                    className="min-h-[110px] resize-none rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                    placeholder="Mahsulot tavsifi"
                  />
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-dashed border-border bg-paper p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Rasm
                    </p>
                    <div className="mt-3 overflow-hidden rounded-2xl bg-surface aspect-[4/3]">
                      {imagePreview || draft.image ? (
                        <img
                          src={imagePreview || draft.image}
                          alt={draft.name ?? "Preview"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-muted-foreground">
                          <ImagePlus className="h-8 w-8" strokeWidth={1.8} />
                        </div>
                      )}
                    </div>
                    <input
                      value={draft.image ?? ""}
                      onChange={(event) => {
                        setImagePreview(event.target.value);
                        setDraft((state) => ({ ...state, image: event.target.value }));
                      }}
                      className="mt-3 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none"
                      placeholder="Rasm URL yoki data:image..."
                    />
                    <label className="tap mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-primary-soft px-4 text-sm font-semibold text-primary">
                      <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                      Rasm yuklash
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => void handleImageChange(event.target.files?.[0])}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => void handleSaveProduct()}
                      className="tap h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform inline-flex items-center justify-center gap-2"
                    >
                      <Save className="h-4 w-4" strokeWidth={2.2} />
                      Saqlash
                    </button>
                    <button
                      onClick={() => {
                        setDraft(EMPTY_PRODUCT);
                        setImagePreview("");
                      }}
                      className="tap h-11 rounded-full border border-border bg-paper text-sm font-semibold active:scale-95 transition-transform"
                    >
                      Tozalash
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {adminState.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={product.image} alt={product.name} className="h-14 w-14 rounded-2xl object-cover" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold line-clamp-1">{product.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {product.stockKg} kg • {formatCurrency(product.price)} • {product.reviewCount} sharh
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setDraft(product);
                          setImagePreview(product.image);
                        }}
                        className="tap h-9 rounded-full border border-border bg-surface px-3 text-xs font-semibold active:scale-95 transition-transform"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => void handleDeleteProduct(product.id)}
                        className="tap grid h-9 w-9 place-items-center rounded-full border border-border bg-surface active:scale-95 transition-transform"
                      >
                        <Trash2 className="h-4 w-4 text-sale" strokeWidth={2.1} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" strokeWidth={2.2} />
                <h2 className="font-serif text-2xl font-semibold">Moliya va analitika</h2>
              </div>
              <div className="mt-4 grid gap-3">
                <FinanceRow label="To'langan tushum" value={formatCurrency(adminState.analytics.paidRevenue)} />
                <FinanceRow label="Kutilayotgan to'lov" value={formatCurrency(adminState.analytics.pendingRevenue)} />
                <FinanceRow label="O'rtacha buyurtma" value={formatCurrency(adminState.analytics.averageOrderValue)} />
                <FinanceRow label="Kam qolgan mahsulotlar" value={`${adminState.analytics.lowStockCount} ta`} />
              </div>
            </section>

            <section className="rounded-3xl bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" strokeWidth={2.2} />
                <h2 className="font-serif text-2xl font-semibold">Broadcast va reklama</h2>
              </div>
              <div className="mt-4 grid gap-3">
                <input
                  value={broadcast.title}
                  onChange={(event) => setBroadcast((state) => ({ ...state, title: event.target.value }))}
                  className="rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                  placeholder="Sarlavha"
                />
                <textarea
                  value={broadcast.body}
                  onChange={(event) => setBroadcast((state) => ({ ...state, body: event.target.value }))}
                  className="min-h-[120px] resize-none rounded-2xl border border-border bg-paper px-4 py-3 text-sm outline-none"
                  placeholder="Bot orqali mijozlarga yuboriladigan aksiya yoki yangilik matni"
                />
                <button
                  onClick={() => void handleBroadcast()}
                  disabled={!broadcast.body.trim()}
                  className="tap h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform disabled:opacity-60"
                >
                  Xabar yuborish
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" strokeWidth={2.2} />
                <h2 className="font-serif text-2xl font-semibold">Mijozlar</h2>
              </div>
              <div className="mt-4 space-y-2">
                {topCustomers.map((customer: CustomerProfile) => (
                  <div key={customer.telegramUserId} className="rounded-2xl bg-paper px-4 py-3">
                    <p className="text-sm font-semibold">{customer.name}</p>
                    <p className="text-[11px] text-muted-foreground">{customer.phone || "Telefon yo'q"}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                      {customer.address || customer.pickupPointId || "Manzil yo'q"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-5 w-5 text-primary" strokeWidth={2.2} />
                <h2 className="font-serif text-2xl font-semibold">Oxirgi xabarlar</h2>
              </div>
              <div className="mt-4 space-y-2">
                {adminState.broadcasts.slice(0, 8).map((message) => (
                  <div key={message.id} className="rounded-2xl bg-paper px-4 py-3">
                    <p className="text-sm font-semibold">{message.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{message.body}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {formatDate(message.createdAt)} {formatTime(message.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
