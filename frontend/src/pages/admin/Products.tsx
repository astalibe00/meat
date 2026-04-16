import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { ProductListSkeleton } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";
import { api } from "../../lib/api";
import { fetchAdminProducts, queryKeys } from "../../lib/queries";
import { formatPrice, toNumber } from "../../lib/utils";

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();
  const { ToastComponent, showToast } = useToast();

  const productsQuery = useQuery({
    queryFn: () => fetchAdminProducts(deferredSearch),
    queryKey: queryKeys.adminProducts(deferredSearch),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      showToast("Mahsulot o'chirildi");
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.patch(`/admin/products/${id}`, { is_available: isAvailable }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      showToast("Holat yangilandi");
    },
  });

  return (
    <AdminLayout
      actions={
        <>
          <input
            className="input-field max-w-md"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mahsulot qidirish"
            type="search"
            value={search}
          />
          <Link className="btn-primary !w-auto px-5" to="/admin/products/new">
            Yangi mahsulot
          </Link>
        </>
      }
      description="Narxni, rasmni va mavjudlik holatini shu yerda tez boshqaring."
      title="Mahsulotlar"
    >
      <ToastComponent />

      {productsQuery.isLoading ? <ProductListSkeleton count={4} /> : null}

      <div className="grid gap-3">
        {productsQuery.data?.map((product) => (
          <div className="surface-panel" key={product.id}>
            <div className="flex items-start gap-4">
              {product.image_url ? (
                <img
                  alt={product.name}
                  className="h-20 w-20 rounded-[24px] object-cover"
                  src={product.image_url}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary/10 text-2xl font-black text-primary">
                  {product.name.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-textPrimary">{product.name}</h2>
                    <p className="mt-1 text-sm text-textSecondary">
                      {product.categories?.name ?? "Kategoriya yo'q"}
                    </p>
                  </div>
                  <span
                    className={`chip ${product.is_available ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
                  >
                    {product.is_available ? "Faol" : "Yashirilgan"}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-textSecondary">
                  {product.description || "Tavsif kiritilmagan"}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-lg font-black text-primary">
                    {formatPrice(toNumber(product.price))}
                  </span>
                  <Link className="chip" to={`/admin/products/${product.id}`}>
                    Tahrirlash
                  </Link>
                  <button
                    className="chip"
                    onClick={() =>
                      toggleAvailability.mutate({
                        id: product.id,
                        isAvailable: !product.is_available,
                      })
                    }
                    type="button"
                  >
                    {product.is_available ? "Yashirish" : "Faollashtirish"}
                  </button>
                  <button
                    className="chip bg-danger/10 text-danger"
                    onClick={() => deleteProduct.mutate(product.id)}
                    type="button"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
