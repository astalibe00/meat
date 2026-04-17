import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AuthNotice from "../components/AuthNotice";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchSupportTickets, queryKeys } from "../lib/queries";
import type { SupportTicket } from "../lib/types";

const categories = [
  { label: "Umumiy savol", value: "general" },
  { label: "Buyurtma muammosi", value: "order_issue" },
  { label: "To'lov", value: "payment" },
  { label: "Yetkazish", value: "delivery" },
  { label: "Sifat", value: "quality" },
];

export default function Support() {
  const canAccessProtectedApi = canUseProtectedApi();
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();
  const [category, setCategory] = useState(categories[0].value);
  const [details, setDetails] = useState("");

  const ticketsQuery = useQuery({
    enabled: canAccessProtectedApi,
    queryFn: fetchSupportTickets,
    queryKey: queryKeys.support,
  });

  const createTicket = useMutation({
    mutationFn: () =>
      api.post<SupportTicket>("/support", {
        category,
        details,
      }),
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Support so'rovi yuborilmadi", "error");
    },
    onSuccess: async (ticket) => {
      setDetails("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.support });
      showToast(`Ticket yaratildi: #${ticket.id}`);
    },
  });

  if (!canAccessProtectedApi) {
    return (
      <div className="p-4">
        <AuthNotice title="Support Telegram ichida ishlaydi" />
      </div>
    );
  }

  return (
    <div className="page-wrap space-y-5 p-4 pb-32">
      <ToastComponent />

      <div className="hero-panel">
        <p className="eyebrow text-white/70">Support</p>
        <h1 className="hero-title text-[2rem]">Muammo yoki savolni yuboring</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
          Operatorga so'rov yuboriladi va bot orqali ham javob oqimini davom ettirishingiz mumkin.
        </p>
      </div>

      <section className="section-shell space-y-4">
        <div>
          <p className="eyebrow text-primary">Yangi ticket</p>
          <h2 className="section-title">Support so'rovi</h2>
        </div>

        <select className="input-field" onChange={(event) => setCategory(event.target.value)} value={category}>
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <textarea
          className="input-field min-h-32 resize-none"
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Muammo tafsilotini yozing"
          value={details}
        />

        <button
          className="btn-primary"
          onClick={() => {
            if (details.trim().length < 5) {
              showToast("Tafsilotni to'liq yozing", "error");
              return;
            }

            createTicket.mutate();
          }}
          type="button"
        >
          Ticket yuborish
        </button>
      </section>

      <section className="section-shell">
        <div>
          <p className="eyebrow text-primary">Tarix</p>
          <h2 className="section-title">Oldingi so'rovlar</h2>
        </div>

        {ticketsQuery.isLoading ? <ListSkeleton count={2} /> : null}

        <div className="mt-4 grid gap-3">
          {ticketsQuery.data?.map((ticket) => (
            <div className="feature-card" key={ticket.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-textPrimary">Ticket #{ticket.id}</p>
                  <p className="mt-1 text-sm text-textSecondary">{ticket.category}</p>
                </div>
                <span className="badge-soft">{ticket.status}</span>
              </div>
            </div>
          ))}

          {!ticketsQuery.isLoading && !ticketsQuery.data?.length ? (
            <div className="feature-card">
              <p className="text-sm leading-6 text-textSecondary">
                Hozircha support ticket yo'q.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
