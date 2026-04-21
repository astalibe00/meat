import { useEffect } from "react";
import { BellRing, Megaphone, PackageCheck } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { formatDate, formatTime } from "@/lib/format";
import { useApp } from "@/store/useApp";

function getNotificationIcon(kind: "order" | "broadcast" | "system") {
  if (kind === "broadcast") {
    return <Megaphone className="h-4 w-4" strokeWidth={2.2} />;
  }

  if (kind === "order") {
    return <PackageCheck className="h-4 w-4" strokeWidth={2.2} />;
  }

  return <BellRing className="h-4 w-4" strokeWidth={2.2} />;
}

export function NotificationsScreen() {
  const notifications = useApp((state) => state.notifications);
  const navigate = useApp((state) => state.navigate);
  const markNotificationsRead = useApp((state) => state.markNotificationsRead);

  useEffect(() => {
    void markNotificationsRead();
  }, [markNotificationsRead]);

  if (notifications.length === 0) {
    return (
      <div className="animate-screen-in px-5 pt-3 pb-6">
        <EmptyState
          icon={<BellRing className="w-9 h-9" strokeWidth={1.75} />}
          title="Xabarlar yo'q"
          body="Buyurtma holatlari, aksiyalar va tizim yangiliklari shu yerda ko'rinadi."
          action={
            <button
              onClick={() => navigate({ name: "home" })}
              className="tap h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-fab active:scale-95 transition-transform"
            >
              Bosh sahifaga qaytish
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Xabarlar</p>
      <h1 className="mt-0.5 font-serif text-[26px] leading-tight font-semibold tracking-tight">
        Yangilanishlar markazi
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Buyurtma statuslari va admin yuborgan e'lonlar shu yerda jamlanadi.
      </p>

      <div className="mt-5 space-y-3">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`rounded-2xl p-4 shadow-card ${
              notification.readAt ? "bg-surface" : "bg-primary-soft/35"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-full bg-paper text-primary">
                  {getNotificationIcon(notification.kind)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {notification.body}
                  </p>
                </div>
              </div>
              {!notification.readAt && (
                <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                  Yangi
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                {formatDate(notification.createdAt)} {formatTime(notification.createdAt)}
              </p>
              {notification.orderId && (
                <button
                  onClick={() => navigate({ name: "orders" })}
                  className="tap h-9 rounded-full border border-border bg-paper px-3 text-xs font-semibold active:scale-95 transition-transform"
                >
                  Buyurtmani ko'rish
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
