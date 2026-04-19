import { useState } from "react";
import { Bot, CircleHelp, MapPin, MessageCircle, PackageSearch, Send } from "lucide-react";
import { toast } from "sonner";
import { getTelegramUser } from "@/lib/telegram-webapp";
import { useApp } from "@/store/useApp";

const SUPPORT_TOPICS = [
  "Address change",
  "Delivery timing",
  "Order contents",
  "Payment question",
  "Other",
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
      toast.error("Write a short message for support.");
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
        throw new Error(payload?.error ?? "Support request failed");
      }

      setMessage("");
      toast.success("Support request sent.", {
        description: "We will reply in the Telegram bot first.",
      });
    } catch (error) {
      toast.error("Support request was not sent.", {
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Support</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
        Help and support
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Send a message to the team, jump back into checkout, or manage your latest order.
      </p>

      <div className="mt-5 grid gap-3">
        <QuickAction
          icon={<MapPin className="w-5 h-5" strokeWidth={2.25} />}
          title="Change address"
          body="Open checkout and switch to another saved address."
          actionLabel="Open checkout"
          onClick={() => navigate({ name: "checkout" })}
        />
        <QuickAction
          icon={<PackageSearch className="w-5 h-5" strokeWidth={2.25} />}
          title="Check latest order"
          body={latestOrder ? `Latest order: ${latestOrder.id}` : "No order placed yet."}
          actionLabel="Open orders"
          onClick={() => navigate({ name: "orders" })}
        />
        <QuickAction
          icon={<Bot className="w-5 h-5" strokeWidth={2.25} />}
          title="Back to catalog"
          body="Continue shopping from the Mini App without leaving Telegram."
          actionLabel="Open catalog"
          onClick={() => navigate({ name: "categories" })}
        />
      </div>

      <div className="mt-5 rounded-2xl bg-surface p-4 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageCircle className="w-4 h-4 text-primary" strokeWidth={2.25} />
          Send support request
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Messages go to the support Telegram flow together with your latest order and address.
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
            placeholder="Describe what is wrong: address update, courier instructions, wrong cut, delivery timing..."
          />

          <button
            onClick={handleSubmit}
            disabled={isSending}
            className="tap h-12 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
          >
            <Send className="w-4 h-4" strokeWidth={2.25} />
            {isSending ? "Sending..." : "Send request"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-paper p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CircleHelp className="w-4 h-4 text-primary" strokeWidth={2.25} />
          Support notes
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          If you already placed an order, include any door code or landmark in the note above.
          Replies are mirrored through the Telegram bot workflow.
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
