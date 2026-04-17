import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { ProductListSkeleton } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";
import { api } from "../../lib/api";
import { getMarketplaceProductMeta } from "../../lib/marketplace";
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

  const products = productsQuery.data ?? [];
  const activeProducts = products.filter((product) => product.is_available).length;

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
      description="Catalog card, seller trust signallari va availability boshqaruvi bir joyda. Qidiruv va quick actions mahsulot operatsiyalarini tezlashtiradi."
      title="Mahsulotlar"
    >
      <ToastComponent />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Jami mahsulot</p>
          <p className="mt-2 text-3xl font-black">{products.length}</p>
        </div>
        <div className="section-shell !p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-textSecondary">Faol katalog</p>
          <p className="mt-2 text-3xl font-black text-textPrimary">{activeProducts}</p>
        </div>
        <div className="section-shell !p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-textSecondary">Preview quality</p>
          <p className="mt-2 text-lg font-black text-textPrimary">Product card funksiyalari tayyor</p>
        </div>
      </div>

      {productsQuery.isLoading ? <ProductListSkeleton count={4} /> : null}

      <div className="grid gap-3">
        {products.map((product) => {
          const meta = getMarketplaceProductMeta(product);
          return (
            <div className="section-shell" key={product.id}>
              <div className="flex flex-col gap-4 lg:flex-row">
                {product.image_url ? (
                  <img
                    alt={product.name}
                    className="h-40 w-full rounded-[24px] object-cover lg:w-48"
                    src={product.image_url}
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center rounded-[24px] bg-primary/10 text-3xl font-black text-primary lg:w-48">
                    {product.name.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow text-primary">{meta.sellerName}</p>
                      <h2 className="mt-2 text-2xl font-black text-textPrimary">{product.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-textSecondary">
                        {product.description || `${meta.cutType}, ${meta.packaging}, ${meta.region}.`}
                      </p>
                    </div>
                    <span
                      className={product.is_available ? "badge-success" : "badge-danger"}
                    >
                      {product.is_available ? "Faol" : "Yashirilgan"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="badge-soft">{meta.proteinType}</span>
                    <span className="badge-soft">{meta.minimumOrderLabel}</span>
                    <span className="badge-soft">{meta.unitLabel}</span>
                    <span className={meta.stockTone === "success" ? "badge-success" : "badge-warning"}>
                      {meta.stockLabel}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[auto_auto_1fr] md:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-textSecondary">Narx</p>
                      <p className="mt-1 text-2xl font-black text-primary">
                        {formatPrice(toNumber(product.price))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-textSecondary">Rating</p>
                      <p className="mt-1 text-lg font-black text-textPrimary">{meta.rating.toFixed(1)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
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
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
