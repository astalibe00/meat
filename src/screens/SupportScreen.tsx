import { Bot, CircleHelp, MessageCircle, Phone, Truck } from "lucide-react";

const SUPPORT_ACTIONS = [
  {
    title: "Telegram bot",
    body: "Browse categories, delivery help, and quick reorders from Telegram.",
    icon: Bot,
  },
  {
    title: "Delivery support",
    body: "Need to update an address or time slot? Reach us before dispatch.",
    icon: Truck,
  },
  {
    title: "Customer care",
    body: "Questions about freshness, halal certification, or replacements.",
    icon: MessageCircle,
  },
];

export function SupportScreen() {
  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Support</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
        Help and support
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Use the Telegram bot for quick actions, or contact the team directly for delivery updates.
      </p>

      <div className="mt-5 space-y-3">
        {SUPPORT_ACTIONS.map(({ title, body, icon: Icon }) => (
          <div key={title} className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-2xl bg-primary-soft text-primary grid place-items-center shrink-0">
                <Icon className="w-5 h-5" strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-foreground text-background p-5 shadow-elevated">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" strokeWidth={2.25} />
          <p className="text-sm font-semibold">Fastest contact flow</p>
        </div>
        <ol className="mt-3 space-y-2 text-xs text-background/75 leading-relaxed">
          <li>1. Open the Telegram bot from the menu button in the deployed site.</li>
          <li>2. Use "Shop", "Deals", "Delivery", or "Support" for quick replies.</li>
          <li>3. If an order is already placed, keep the order ID ready before chatting.</li>
        </ol>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-paper p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CircleHelp className="w-4 h-4 text-primary" strokeWidth={2.25} />
          Delivery notes
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Same-day delivery applies to in-stock items ordered before 2pm. Evening slots are
          confirmed in the site and mirrored in the Telegram bot.
        </p>
      </div>
    </div>
  );
}
