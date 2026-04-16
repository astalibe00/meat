import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface AdminLayoutProps {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
}

const tabs = [
  { label: "Dashboard", path: "/admin" },
  { label: "Mahsulotlar", path: "/admin/products" },
  { label: "Kategoriyalar", path: "/admin/categories" },
  { label: "Buyurtmalar", path: "/admin/orders" },
];

export default function AdminLayout({
  actions,
  children,
  description,
  title,
}: AdminLayoutProps) {
  const location = useLocation();

  return (
    <div className="page-wrap min-h-screen pb-10">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        <div className="hero-panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Admin panel</p>
              <h1 className="hero-title text-[2rem]">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">{description}</p>
            </div>
            <Link className="chip bg-white/14 text-white" to="/">
              Do'kon
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive =
                tab.path === "/admin"
                  ? location.pathname === tab.path
                  : location.pathname.startsWith(tab.path);

              return (
                <Link
                  className={`chip ${isActive ? "bg-white text-textPrimary" : "bg-white/12 text-white"}`}
                  key={tab.path}
                  to={tab.path}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}

        {children}
      </div>
    </div>
  );
}
