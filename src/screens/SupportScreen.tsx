import { useState } from "react";
import { Bot, CircleHelp, MapPin, MessageCircle, PackageSearch, Send } from "lucide-react";
import { toast } from "sonner";
import { getTelegramUser } from "@/lib/telegram-webapp";
import { useApp } from "@/store/useApp";

const SUPPORT_TOPICS = [
  "Manzilni o'zgartirish",
  "Yetkazish vaqti",
  "Buyurtma tarkibi",
  "To'lov savoli",
  "Boshqa",
];

export function SupportScreen() {
  const navigate = useApp((state) => state.navigate);
  const checkout = useApp((state) => state.checkout);
  const orders = useApp((state) => state.orders);
  const [topic, setTopic] = useState(SUPPORT_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const latestOrder = orders[0];

  const handleSubmit = async () => {
    if (isSending) {
      return;
    }

    if (!message.trim()) {
      toast.error("Yordam uchun qisqa xabar yozing.");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/support-request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          topic,
          message: message.trim(),
          latestOrderId: latestOrder?.id,
          customer: {
            name: checkout.name,
            phone: checkout.phone,
            address: checkout.address,
          },
          telegramUser: getTelegramUser(),
          source: "mini-app",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Yordam so'rovi yuborilmadi");
      }

      setMessage("");
      toast.success("Yordam so'rovi yuborildi.", {
        description: "Javob birinchi navbatda Telegram botga qaytadi.",
      });
    } catch (error) {
      toast.error("Yordam so'rovi yuborilmadi.", {
        description:
          error instanceof Error ? error.message : "Birozdan keyin qayta urinib ko'ring.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Yordam</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
        Yordam bo'limi
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Jamoaga xabar yuboring, rasmiylashtirishga qayting yoki oxirgi buyurtmangizni oching.
      </p>

      <div className="mt-5 grid gap-3">
        <QuickAction
          icon={<MapPin className="w-5 h-5" strokeWidth={2.25} />}
          title="Manzilni o'zgartirish"
          body="Rasmiylashtirishni ochib, boshqa saqlangan manzilni tanlang."
          actionLabel="Rasmiylashtirishni ochish"
          onClick={() => navigate({ name: "checkout" })}
        />
        <QuickAction
          icon={<PackageSearch className="w-5 h-5" strokeWidth={2.25} />}
          title="Oxirgi buyurtma"
          body={latestOrder ? `Oxirgi buyurtma: ${latestOrder.id}` : "Hali buyurtma yo'q."}
          actionLabel="Buyurtmalarni ochish"
          onClick={() => navigate({ name: "orders" })}
        />
        <QuickAction
          icon={<Bot className="w-5 h-5" strokeWidth={2.25} />}
          title="Katalogga qaytish"
          body="Telegramdan chiqmasdan Mini App ichida xaridni davom ettiring."
          actionLabel="Katalogni ochish"
          onClick={() => navigate({ name: "categories" })}
        />
      </div>

      <div className="mt-5 rounded-2xl bg-surface p-4 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageCircle className="w-4 h-4 text-primary" strokeWidth={2.25} />
          Yordam so'rovi yuborish
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Xabar yordam Telegram oqimiga buyurtma va manzil bilan birga yuboriladi.
        </p>

        <div className="mt-4 space-y-3">
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="w-full rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border"
          >
            {SUPPORT_TOPICS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-2xl bg-paper px-4 py-3 text-sm outline-none border border-border resize-none min-h-[110px]"
            placeholder="Muammoni yozing: manzil, kuryer uchun izoh, noto'g'ri mahsulot, yetkazish vaqti..."
          />

          <button
            onClick={handleSubmit}
            disabled={isSending}
            className="tap h-12 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
          >
            <Send className="w-4 h-4" strokeWidth={2.25} />
            {isSending ? "Yuborilmoqda..." : "So'rov yuborish"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-paper p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CircleHelp className="w-4 h-4 text-primary" strokeWidth={2.25} />
          Muhim eslatma
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Agar buyurtma allaqachon berilgan bo'lsa, domofon kodi yoki mo'ljalni yozib yuboring.
          Javoblar Telegram bot oqimi orqali qaytadi.
        </p>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  body,
  actionLabel,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-2xl bg-primary-soft text-primary grid place-items-center shrink-0">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
          <button
            onClick={onClick}
            className="tap mt-3 h-9 px-4 rounded-full bg-paper border border-border text-xs font-semibold active:scale-95 transition-transform"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
