import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AuthNotice from "../components/AuthNotice";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchProfile, queryKeys } from "../lib/queries";

export default function Profile() {
  const queryClient = useQueryClient();
  const canAccessProtectedApi = canUseProtectedApi();
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
    <div className="page-wrap">
      <ToastComponent />
      <div className="space-y-5 p-4 pb-28">
        <div className="hero-panel">
          <p className="eyebrow">Shaxsiy kabinet</p>
          <h1 className="hero-title text-[2rem]">Profil va manzil</h1>
          <p className="mt-2 text-sm text-white/80">
            Bir marta to'ldirilgan ma'lumot checkout sahifasiga avtomatik tushadi.
          </p>
        </div>

        <div className="surface-panel space-y-4">
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
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
