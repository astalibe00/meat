import { Link } from "react-router-dom";
import { clientEnv } from "../lib/env";

interface AuthNoticeProps {
  title: string;
}

export default function AuthNotice({ title }: AuthNoticeProps) {
  return (
    <div className="card p-5">
      <h2 className="text-lg font-bold text-textPrimary">{title}</h2>
      <p className="mt-2 text-sm text-textSecondary">
        Bu bo'lim Telegram Web App avtorizatsiyasini talab qiladi.
      </p>
      <p className="mt-2 text-sm text-textSecondary">
        Telegram ichida oching yoki lokal sinov uchun{" "}
        {clientEnv.devTelegramId
          ? "DEV_TELEGRAM_ID orqali kirish yoqilgan."
          : "DEV_TELEGRAM_ID ni root .env fayliga qo'shing."}
      </p>
      <Link className="mt-4 inline-flex text-sm font-semibold text-primary" to="/">
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
