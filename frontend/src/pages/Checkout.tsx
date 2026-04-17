import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import AuthNotice from "../components/AuthNotice";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { getDeliveryZoneMeta, getMarketplaceProductMeta } from "../lib/marketplace";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchCart, fetchProfile, queryKeys } from "../lib/queries";
import type { Order } from "../lib/types";
import { formatPrice, toNumber } from "../lib/utils";

const deliverySlots = [
  "Bugun 11:00 - 13:00",
  "Bugun 14:00 - 16:00",
  "Bugun 17:00 - 20:00",
  "Ertaga 09:00 - 12:00",
];

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("+998");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [deliverySlot, setDeliverySlot] = useState(deliverySlots[0]);
  const [needInvoice, setNeedInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const { ToastComponent, showToast } = useToast();
  const canAccessProtectedApi = canUseProtectedApi();

  const cartQuery = useQuery({
    enabled: canAccessProtectedApi,
    queryFn: fetchCart,
    queryKey: queryKeys.cart,
  });
  const profileQuery = useQuery({
    enabled: canAccessProtectedApi,
    queryFn: fetchProfile,
    queryKey: queryKeys.profile,
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setPhone(profileQuery.data.phone ?? "+998");
    setAddress(profileQuery.data.default_address ?? "");
  }, [profileQuery.data]);

  const createOrder = useMutation({
    mutationFn: async () => {
      await api.patch("/me", {
        default_address: address,
        first_name: profileQuery.data?.first_name ?? "Mijoz",
        phone,
      });

      return api.post<Order>("/orders", {
        location: address,
        payment_method: paymentMethod,
        phone,
      });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Buyurtma yuborilmadi", "error");
    },
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      navigate(`/orders/${order.id}`);
    },
  });

  if (!canAccessProtectedApi) {
    return (
      <div className="p-4">
        <AuthNotice title="Checkout Telegram ichida ishlaydi" />
      </div>
    );
  }

  const items = cartQuery.data ?? [];
  const total = items.reduce((sum, item) => sum + toNumber(item.products?.price) * item.quantity, 0);
  const shipping = items.length ? 35000 : 0;
  const grandTotal = total + shipping;
  const deliveryMeta = getDeliveryZoneMeta(address);

  if (cartQuery.isLoading) {
    return (
      <div className="p-4">
        <ListSkeleton />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="p-4">
        <div className="empty-state">
          <p className="eyebrow">Checkout empty</p>
          <h2 className="section-title">Savatcha bo'sh</h2>
          <p className="mt-3 text-sm leading-6 text-textSecondary">
            Buyurtma rasmiylashtirish uchun avval mahsulot tanlang.
          </p>
        </div>
        <Link className="mt-4 inline-flex text-sm font-semibold text-primary" to="/products">
          Mahsulotlarga o'tish
        </Link>
      </div>
    );
  }

  return (
    <div className="page-wrap space-y-5 p-4 pb-40">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow text-white/70">Checkout</p>
        <h1 className="hero-title text-[2rem]">Buyurtmani professional oqim bilan yakunlang</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
          Delivery zone, slot, payment va invoice ehtiyoji bir sahifada yig'ilgan.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <section className="section-shell space-y-4">
            <div>
              <p className="eyebrow text-primary">Kontakt va manzil</p>
              <h2 className="section-title">Autofill qilingan profil</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-textPrimary">Telefon raqam</label>
                <input
                  className="input-field"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+998901234567"
                  type="tel"
                  value={phone}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-textPrimary">Delivery slot</label>
                <select
                  className="input-field"
                  onChange={(event) => setDeliverySlot(event.target.value)}
                  value={deliverySlot}
                >
                  {deliverySlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-textPrimary">Yetkazish manzili</label>
              <textarea
                className="input-field min-h-28 resize-none"
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Toshkent, tuman, ko'cha, uy, mo'ljal"
                value={address}
              />
            </div>

            <div className={`feature-card ${deliveryMeta.available ? "ring-2 ring-success/10" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-textPrimary">Delivery availability</p>
                  <p className="mt-2 text-sm leading-6 text-textSecondary">{deliveryMeta.note}</p>
                </div>
                <span className={deliveryMeta.available ? "badge-success" : "badge-warning"}>
                  {deliveryMeta.label}
                </span>
              </div>
            </div>
          </section>

          <section className="section-shell space-y-4">
            <div>
              <p className="eyebrow text-primary">Payment</p>
              <h2 className="section-title">To'lov va biznes rekvizitlar</h2>
            </div>

            <div className="grid gap-3">
              {[
                { description: "Yetkazib berilganda to'lov qilasiz.", label: "Naqd pul", value: "cash" },
                { description: "Online to'lov integratsiyasi keyingi bosqichda yoqiladi.", label: "Karta / online", value: "card", disabled: true },
                { description: "B2B xaridlar uchun yuridik oqim keyingi bosqichda kengayadi.", label: "Split payment", value: "split", disabled: true },
              ].map((option) => (
                <button
                  className={`feature-card text-left ${paymentMethod === option.value ? "ring-2 ring-dark/20" : ""} ${option.disabled ? "opacity-60" : ""}`}
                  disabled={option.disabled}
                  key={option.value}
                  onClick={() => setPaymentMethod(option.value)}
                  type="button"
                >
                  <p className="text-lg font-black text-textPrimary">{option.label}</p>
                  <p className="mt-2 text-sm leading-6 text-textSecondary">{option.description}</p>
                </button>
              ))}
            </div>

            <label className="flex items-center gap-3 rounded-[24px] bg-bgMain/80 px-4 py-4">
              <input
                checked={needInvoice}
                onChange={(event) => setNeedInvoice(event.target.checked)}
                type="checkbox"
              />
              <span className="text-sm font-semibold text-textPrimary">
                Yuridik shaxs uchun invoice kerak
              </span>
            </label>

            {needInvoice ? (
              <input
                className="input-field"
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Kompaniya nomi yoki rekvizit"
                value={companyName}
              />
            ) : null}

            <textarea
              className="input-field min-h-24 resize-none"
              onChange={(event) => setOrderNote(event.target.value)}
              placeholder="Operator uchun izoh: qadoqlash, qo'ng'iroq, darvoza va h.k."
              value={orderNote}
            />
          </section>
        </div>

        <div className="space-y-5">
          <section className="section-shell">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-primary">Order summary</p>
                <h2 className="section-title">Savat tarkibi</h2>
              </div>
              <span className="badge-soft">{items.length} pozitsiya</span>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((item) => {
                const meta = item.products ? getMarketplaceProductMeta(item.products) : null;
                return (
                  <div className="feature-card" key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-textPrimary">
                          {item.products?.name ?? "Mahsulot"}
                        </p>
                        <p className="mt-1 text-sm text-textSecondary">
                          {meta?.sellerName ?? "Seller"} • x{item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-black text-primary">
                        {formatPrice(toNumber(item.products?.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-2 border-t border-black/5 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-textSecondary">Subtotal</span>
                <span className="font-semibold text-textPrimary">{formatPrice(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-textSecondary">Shipping</span>
                <span className="font-semibold text-textPrimary">{formatPrice(shipping)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-textPrimary">Jami</span>
                <span className="text-lg font-black text-primary">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </section>

          <section className="metric-card">
            <p className="eyebrow text-white/70">Trust & conversion</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-[24px] bg-white/10 px-4 py-4">
                <p className="text-sm font-black">100% secure payment</p>
                <p className="mt-2 text-sm text-white/80">Naqd pul oqimi faol, online to'lov tayyor holatda turibdi.</p>
              </div>
              <div className="rounded-[24px] bg-white/10 px-4 py-4">
                <p className="text-sm font-black">Cold delivery</p>
                <p className="mt-2 text-sm text-white/80">Sovuq zanjir va verified seller signal checkoutdan oldin ko'rinadi.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="floating-cta">
        <div className="w-full">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-textSecondary">Jami</span>
            <span className="text-lg font-black text-textPrimary">{formatPrice(grandTotal)}</span>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              if (!/^\+998\d{9}$/.test(phone)) {
                showToast("Telefon raqam +998 bilan to'g'ri kiriting", "error");
                return;
              }

              if (address.trim().length < 5) {
                showToast("Manzilni to'liq kiriting", "error");
                return;
              }

              if (needInvoice && companyName.trim().length < 3) {
                showToast("Invoice uchun kompaniya ma'lumotini kiriting", "error");
                return;
              }

              createOrder.mutate();
            }}
            type="button"
          >
            Buyurtmani tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
}
