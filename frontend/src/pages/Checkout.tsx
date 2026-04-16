import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import AuthNotice from "../components/AuthNotice";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchCart, fetchProfile, queryKeys } from "../lib/queries";
import type { Order } from "../lib/types";
import { formatPrice, toNumber } from "../lib/utils";

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("+998");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
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
        <AuthNotice title="Rasmiylashtirish yopiq" />
      </div>
    );
  }

  const items = cartQuery.data ?? [];
  const total = items.reduce(
    (sum, item) => sum + toNumber(item.products?.price) * item.quantity,
    0,
  );

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
        <div className="surface-panel text-sm text-textSecondary">
          Savatcha bo'sh. Avval mahsulot tanlang.
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
        <p className="eyebrow">Checkout</p>
        <h1 className="hero-title text-[2rem]">Bir necha qadamda tasdiqlang</h1>
        <p className="mt-2 text-sm text-white/80">
          Telefon va manzil saqlanadi, keyingi buyurtmalar yanada tezlashadi.
        </p>
      </div>

      <div className="surface-panel space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-textPrimary">
            Telefon raqam
          </label>
          <input
            className="input-field"
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+998901234567"
            type="tel"
            value={phone}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-textPrimary">
            Yetkazish manzili
          </label>
          <textarea
            className="input-field min-h-28 resize-none"
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Toshkent, tuman, ko'cha, uy"
            value={address}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-textPrimary">To'lov turi</p>
          {[
            { label: "Naqd pul", value: "cash", enabled: true },
            { label: "Click - tez orada", value: "click", enabled: false },
            { label: "Payme - tez orada", value: "payme", enabled: false },
          ].map((option) => (
            <button
              className={`w-full rounded-[22px] border px-4 py-3 text-left text-sm font-semibold ${
                paymentMethod === option.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-black/10 text-textSecondary"
              } ${!option.enabled ? "opacity-60" : ""}`}
              disabled={!option.enabled}
              key={option.value}
              onClick={() => setPaymentMethod(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="rounded-[24px] bg-bgMain/80 p-4">
          <p className="text-sm font-semibold text-textPrimary">Buyurtma tarkibi</p>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div className="flex items-center justify-between text-sm" key={item.id}>
                <span className="text-textSecondary">
                  {item.products?.name} x{item.quantity}
                </span>
                <span className="font-semibold text-textPrimary">
                  {formatPrice(toNumber(item.products?.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="nav-shell fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 border-none p-4">
        <div className="w-full">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-textSecondary">Jami</span>
            <span className="text-lg font-bold text-textPrimary">
              {formatPrice(total)}
            </span>
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

              createOrder.mutate();
            }}
            type="button"
          >
            Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
}
