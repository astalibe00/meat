import { CircleHelp, Phone, Send, ShieldCheck } from "lucide-react";
import { openTelegramLink } from "@/lib/telegram-webapp";
import { useApp } from "@/store/useApp";

const FAQS = [
  {
    q: "Buyurtma statusini qayerdan ko'raman?",
    a: "Buyurtmalar bo'limida admin tasdiqlashi, tayyorlash, tayyor bo'lish va yetkazilishni bosqichma-bosqich ko'rasiz.",
  },
  {
    q: "Katta buyurtma bo'lsa nima qilaman?",
    a: "Mavjud kg limitidan oshadigan buyurtmalar uchun support telefoniga qo'ng'iroq qiling.",
  },
  {
    q: "Online to'lovdan keyin nima bo'ladi?",
    a: "HUMO, UZCARD, CLICK yoki PAYME tanlansa, to'lov qabul qilingach mahsulot tayyorlash jarayoni boshlanadi.",
  },
];

export function SupportScreen() {
  const supportContact = useApp((state) => state.supportContact);

  return (
    <div className="animate-screen-in px-5 pt-3 pb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Yordam</p>
      <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight mt-0.5">
        FAQ va support kontaktlari
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Bu bo'limda faqat tez-tez so'raladigan savollar va bevosita aloqa ma'lumotlari turadi.
      </p>

      <div className="mt-5 space-y-3">
        {FAQS.map((item) => (
          <div key={item.q} className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-2xl bg-primary-soft text-primary grid place-items-center shrink-0">
                <CircleHelp className="w-4 h-4" strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-sm font-semibold">{item.q}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-surface p-4 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Phone className="w-4 h-4 text-primary" strokeWidth={2.25} />
          Support telefoni
        </div>
        <a
          href={`tel:${supportContact.phone.replace(/\s+/g, "")}`}
          className="mt-3 block rounded-2xl bg-paper px-4 py-3 text-sm font-semibold"
        >
          {supportContact.phone}
        </a>
      </div>

      <div className="mt-3 rounded-2xl bg-surface p-4 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Send className="w-4 h-4 text-primary" strokeWidth={2.25} />
          Telegram support
        </div>
        <button
          onClick={() => openTelegramLink(supportContact.telegram)}
          className="tap mt-3 w-full rounded-2xl bg-paper px-4 py-3 text-left text-sm font-semibold active:scale-[0.99] transition-transform"
        >
          t.me/saidazizov_s
        </button>
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-paper p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="w-4 h-4 text-primary" strokeWidth={2.25} />
          Eslatma
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Support chat formasi olib tashlangan. Tezkor aloqa uchun yuqoridagi telefon yoki Telegram manzildan foydalaning.
        </p>
      </div>
    </div>
  );
}
