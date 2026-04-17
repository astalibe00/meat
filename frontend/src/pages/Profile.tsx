import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AuthNotice from "../components/AuthNotice";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchProfile, queryKeys } from "../lib/queries";
import { useAppStore } from "../store/useAppStore";

export default function Profile() {
  const queryClient = useQueryClient();
  const canAccessProtectedApi = canUseProtectedApi();
  const favoriteIds = useAppStore((state) => state.favoriteIds);
  const compareIds = useAppStore((state) => state.compareIds);
  const [form, setForm] = useState({
    default_address: "",
    first_name: "",
    phone: "+998",
  });
  const { ToastComponent, showToast } = useToast();

  const profileQuery = useQuery({
    enabled: canAccessProtectedApi,
    queryFn: fetchProfile,
    queryKey: queryKeys.profile,
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setForm({
      default_address: profileQuery.data.default_address ?? "",
      first_name: profileQuery.data.first_name ?? "",
      phone: profileQuery.data.phone ?? "+998",
    });
  }, [profileQuery.data]);

  const saveProfile = useMutation({
    mutationFn: () => api.patch("/me", form),
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Profil saqlanmadi", "error");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      showToast("Profil yangilandi");
    },
  });

  if (!canAccessProtectedApi) {
    return (
      <div className="p-4">
        <AuthNotice title="Profil Telegram ichida ochiladi" />
      </div>
    );
  }

  return (
    <div className="page-wrap space-y-5 p-4 pb-32">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow text-white/70">Account</p>
        <h1 className="hero-title text-[2rem]">Profil, manzil va tezkor preference'lar</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
          Checkout, tracking va repeat order shu profildagi asosiy ma'lumot bilan ishlaydi.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="section-shell space-y-4">
          <div>
            <p className="eyebrow text-primary">Asosiy ma'lumot</p>
            <h2 className="section-title">Buyer profile</h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-textPrimary">Ism</label>
            <input
              className="input-field"
              onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
              value={form.first_name}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-textPrimary">Telefon</label>
            <input
              className="input-field"
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              value={form.phone}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-textPrimary">Asosiy manzil</label>
            <textarea
              className="input-field min-h-32 resize-none"
              onChange={(event) =>
                setForm((current) => ({ ...current, default_address: event.target.value }))
              }
              value={form.default_address}
            />
          </div>
          <button className="btn-primary" onClick={() => saveProfile.mutate()} type="button">
            Profilni saqlash
          </button>
        </section>

        <div className="space-y-5">
          <section className="section-shell">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-primary">Quick stats</p>
                <h2 className="section-title">Mini App activity</h2>
              </div>
              <div className="flex gap-2">
                <Link className="chip" to="/orders">
                  Buyurtmalar
                </Link>
                <Link className="chip" to="/favorites">
                  Favorites
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="feature-card">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">Wishlist</p>
                <p className="mt-2 text-2xl font-black text-textPrimary">{favoriteIds.length}</p>
              </div>
              <div className="feature-card">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">Compare</p>
                <p className="mt-2 text-2xl font-black text-textPrimary">{compareIds.length}</p>
              </div>
              <div className="feature-card">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">Loyalty</p>
                <p className="mt-2 text-lg font-black text-textPrimary">Bonus va cashback roadmapda</p>
              </div>
              <div className="feature-card">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">Support</p>
                <p className="mt-2 text-lg font-black text-textPrimary">Claim support faol</p>
              </div>
            </div>
          </section>

          <section className="section-shell space-y-3">
            <div>
              <p className="eyebrow text-primary">Preference'lar</p>
              <h2 className="section-title">Buyer qulayliklari</h2>
            </div>
            {[
              "Fresh kelganda bildirishnoma yuborish",
              "Wholesale takliflar uchun prioritet alert",
              "Sevimli seller aksiyalarini ko'rsatish",
            ].map((item) => (
              <label className="flex items-center gap-3 rounded-[24px] bg-bgMain/80 px-4 py-4" key={item}>
                <input defaultChecked type="checkbox" />
                <span className="text-sm font-semibold text-textPrimary">{item}</span>
              </label>
            ))}

            <div className="grid gap-3 pt-2 md:grid-cols-2">
              <Link className="feature-card" to="/support">
                <p className="eyebrow text-dark">Support</p>
                <p className="mt-2 text-lg font-black text-textPrimary">Operator bilan bog'lanish</p>
              </Link>
              <Link className="feature-card" to="/wholesale">
                <p className="eyebrow text-dark">Wholesale</p>
                <p className="mt-2 text-lg font-black text-textPrimary">Biznes uchun so'rov</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
