import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
import AuthNotice from "./AuthNotice";
import { canUseProtectedApi } from "../lib/telegram";
import { fetchProfile, queryKeys } from "../lib/queries";

export default function AdminGuard() {
  const canAccessProtectedApi = canUseProtectedApi();
  const profileQuery = useQuery({
    enabled: canAccessProtectedApi,
    queryFn: fetchProfile,
    queryKey: queryKeys.profile,
  });

  if (!canAccessProtectedApi) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <AuthNotice title="Admin panel faqat Telegram ichida ishlaydi" />
      </div>
    );
  }

  if (profileQuery.isLoading) {
    return <div className="p-6 text-sm text-textSecondary">Admin panel yuklanmoqda...</div>;
  }

  if (!profileQuery.data?.is_admin) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
