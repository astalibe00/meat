import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import AuthNotice from "../components/AuthNotice";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import type { SupportTicket } from "../lib/types";

export default function Wholesale() {
  const canAccessProtectedApi = canUseProtectedApi();
  const { ToastComponent, showToast } = useToast();
  const [details, setDetails] = useState("");

  const submitWholesale = useMutation({
    mutationFn: () =>
      api.post<SupportTicket>("/support", {
        category: "wholesale",
        details,
      }),
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Wholesale so'rovi yuborilmadi", "error");
    },
    onSuccess: (ticket) => {
      setDetails("");
      showToast(`Wholesale so'rovi yuborildi: #${ticket.id}`);
    },
  });

  if (!canAccessProtectedApi) {
    return (
      <div className="p-4">
        <AuthNotice title="Wholesale Telegram ichida ishlaydi" />
      </div>
    );
  }

  return (
    <div className="page-wrap space-y-5 p-4 pb-32">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow text-white/70">Wholesale</p>
        <h1 className="hero-title text-[2rem]">Biznes uchun supply oqimi</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
          Restoran, oshxona va ulgurji xaridor uchun MOQ, invoice va doimiy supply so'rovi shu yerda boshlanadi.
        </p>
      </div>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="feature-card">
          <p className="eyebrow text-dark">MOQ</p>
          <p className="mt-2 text-lg font-black text-textPrimary">5 kg va undan yuqori tier pricing</p>
        </div>
        <div className="feature-card">
          <p className="eyebrow text-dark">Invoice</p>
          <p className="mt-2 text-lg font-black text-textPrimary">Yuridik shaxs oqimi tayyor</p>
        </div>
        <div className="feature-card">
          <p className="eyebrow text-dark">Supply</p>
          <p className="mt-2 text-lg font-black text-textPrimary">Doimiy yetkazib berish mumkin</p>
        </div>
      </section>

      <section className="section-shell space-y-4">
        <div>
          <p className="eyebrow text-primary">So'rov formasi</p>
          <h2 className="section-title">Wholesale request</h2>
        </div>

        <textarea
          className="input-field min-h-40 resize-none"
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Masalan: Haftasiga 25 kg mol go'shti, invoice kerak, yetkazish Yunusobod."
          value={details}
        />

        <button
          className="btn-primary"
          onClick={() => {
            if (details.trim().length < 10) {
              showToast("Wholesale so'rovini to'liq yozing", "error");
              return;
            }

            submitWholesale.mutate();
          }}
          type="button"
        >
          So'rov yuborish
        </button>
      </section>
    </div>
  );
}
