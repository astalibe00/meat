import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useToast } from "../../components/Toast";
import { api } from "../../lib/api";
import { getMarketplaceProductMeta } from "../../lib/marketplace";
import { fetchAdminCategories, fetchAdminProduct, queryKeys } from "../../lib/queries";
import type { Product } from "../../lib/types";
import { fileToBase64, formatPrice } from "../../lib/utils";

type SaveMode = "publish" | "save_and_continue" | "save_hidden";

const initialForm = {
  category_id: "",
  description: "",
  image_url: "",
  is_available: true,
  name: "",
  price: "0",
};

function getProductAppLink(productId?: string) {
  if (typeof window === "undefined" || !productId) {
    return "";
  }

  const url = new URL(window.location.origin);
  url.searchParams.set("startapp", `product_${productId}`);
  return url.toString();
}

function getProductPreviewLink(productId?: string) {
  if (typeof window === "undefined" || !productId) {
    return "";
  }

  return `${window.location.origin}/products/${productId}`;
}

export default function AdminProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const { ToastComponent, showToast } = useToast();

  const isEditing = Boolean(id);

  const categoriesQuery = useQuery({
    queryFn: fetchAdminCategories,
    queryKey: queryKeys.adminCategories,
  });

  const productQuery = useQuery({
    enabled: isEditing,
    queryFn: () => fetchAdminProduct(id!),
    queryKey: queryKeys.adminProduct(id ?? "new"),
  });

  useEffect(() => {
    if (!productQuery.data) {
      return;
    }

    setForm({
      category_id: productQuery.data.category_id ?? "",
      description: productQuery.data.description ?? "",
      image_url: productQuery.data.image_url ?? "",
      is_available: Boolean(productQuery.data.is_available),
      name: productQuery.data.name,
      price: String(productQuery.data.price ?? "0"),
    });
  }, [productQuery.data]);

  const selectedCategory = categoriesQuery.data?.find((category) => category.id === form.category_id);
  const productAppLink = getProductAppLink(id);
  const productPreviewLink = getProductPreviewLink(id);
  const normalizedPrice = Number(form.price || 0);

  const previewProduct: Product = {
    categories: selectedCategory ?? null,
    category_id: form.category_id || null,
    description: form.description,
    id: id ?? "preview-product",
    image_url: form.image_url || null,
    is_available: form.is_available,
    name: form.name || "Mahsulot nomi",
    price: normalizedPrice || 0,
  };
  const previewMeta = getMarketplaceProductMeta(previewProduct);

  function validateForm() {
    if (form.name.trim().length < 2) {
      showToast("Mahsulot nomini to'liq kiriting", "error");
      return false;
    }

    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      showToast("Narx 0 dan katta bo'lishi kerak", "error");
      return false;
    }

    return true;
  }

  const saveProduct = useMutation({
    mutationFn: async (mode: SaveMode) => {
      const payload = {
        category_id: form.category_id || null,
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        is_available: mode === "save_hidden" ? false : form.is_available,
        name: form.name.trim(),
        price: normalizedPrice,
      };

      if (isEditing) {
        await api.patch(`/admin/products/${id}`, payload);
        return { id: id! };
      }

      return api.post<{ id: string }>("/admin/products", payload);
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Mahsulot saqlanmadi", "error");
    },
    onSuccess: async (product, mode) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });

      if (!isEditing && mode === "save_and_continue") {
        showToast("Mahsulot saqlandi, tahrirlash oynasi ochildi");
        navigate(`/admin/products/${product.id}`);
        return;
      }

      showToast(mode === "save_hidden" ? "Mahsulot yashirin holatda saqlandi" : "Mahsulot saqlandi");

      if (mode === "save_and_continue") {
        return;
      }

      navigate("/admin/products");
    },
  });

  const deleteProduct = useMutation({
    mutationFn: () => api.delete(`/admin/products/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      showToast("Mahsulot o'chirildi");
      navigate("/admin/products");
    },
  });

  const duplicateProduct = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>("/admin/products", {
        category_id: form.category_id || null,
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        is_available: form.is_available,
        name: `${form.name.trim()} copy`,
        price: normalizedPrice,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      showToast("Mahsulot nusxasi yaratildi");
      navigate("/admin/products");
    },
  });

  async function copyLink(value: string, successMessage: string) {
    if (!value) {
      showToast("Avval mahsulotni saqlang", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      showToast(successMessage);
    } catch {
      showToast("Linkni nusxalab bo'lmadi", "error");
    }
  }

  return (
    <AdminLayout
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className="chip" to="/admin/products">
            Ro'yxatga qaytish
          </Link>
          {isEditing && productPreviewLink ? (
            <a className="chip" href={productPreviewLink} rel="noreferrer" target="_blank">
              Public preview
            </a>
          ) : null}
          {isEditing ? (
            <button
              className="chip"
              onClick={() => copyLink(productAppLink, "Mini App link nusxalandi")}
              type="button"
            >
              Mini App link
            </button>
          ) : null}
        </div>
      }
      description="Mahsulot kartochkasini yaratish, preview qilish va publish oqimini bitta workspace ichida boshqaring."
      title={isEditing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
    >
      <ToastComponent />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="section-shell space-y-4">
          <div>
            <p className="eyebrow text-primary">Content editor</p>
            <h2 className="section-title">Kartochka ma'lumotlari</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
            <div>
              <label className="mb-2 block text-sm font-bold text-textPrimary">Mahsulot nomi</label>
              <input
                className="input-field"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Masalan: Premium mol go'shti"
                value={form.name}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-textPrimary">Narx</label>
              <input
                className="input-field"
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                type="number"
                value={form.price}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-textPrimary">Tavsif</label>
            <textarea
              className="input-field min-h-32 resize-none"
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Sifat, kesim, qadoqlash, kelib chiqish va delivery haqida qisqa professional matn yozing."
              value={form.description}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-textPrimary">Kategoriya</label>
              <select
                className="input-field"
                onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                value={form.category_id}
              >
                <option value="">Tanlanmagan</option>
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-textPrimary">Katalog holati</label>
              <label className="flex h-[50px] items-center gap-3 rounded-[22px] border border-black/10 bg-bgMain/70 px-4">
                <input
                  checked={form.is_available}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, is_available: event.target.checked }))
                  }
                  type="checkbox"
                />
                <span className="text-sm font-semibold text-textPrimary">Katalogda ko'rinsin</span>
              </label>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-bold text-textPrimary">Rasm</label>
              {form.image_url ? (
                <button
                  className="text-sm font-semibold text-danger"
                  onClick={() => setForm((current) => ({ ...current, image_url: "" }))}
                  type="button"
                >
                  Rasmni olib tashlash
                </button>
              ) : null}
            </div>
            <div className="space-y-3">
              <input
                accept="image/*"
                className="input-field"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  try {
                    const fileBase64 = await fileToBase64(file);
                    const response = await api.post<{ url: string }>("/admin/upload", {
                      fileBase64,
                      fileName: file.name,
                      mimeType: file.type,
                    });

                    setForm((current) => ({ ...current, image_url: response.url }));
                    showToast("Rasm yuklandi");
                  } catch (error) {
                    showToast(error instanceof Error ? error.message : "Rasm yuklanmadi", "error");
                  }
                }}
                type="file"
              />
              <input
                className="input-field"
                onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
                placeholder="Yoki rasm URL kiriting"
                value={form.image_url}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="feature-card">
              <p className="eyebrow text-dark">Card logic</p>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                Narx, nom va kategoriya product card ustunligini belgilaydi.
              </p>
            </div>
            <div className="feature-card">
              <p className="eyebrow text-dark">Trust layer</p>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                Halal, cold chain va MOQ signallari previewda avtomatik ko'rinadi.
              </p>
            </div>
            <div className="feature-card">
              <p className="eyebrow text-dark">Distribution</p>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                Saqlangach public preview va Mini App deep link ishlaydi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary !w-auto px-5"
              disabled={saveProduct.isPending}
              onClick={() => {
                if (!validateForm()) {
                  return;
                }

                saveProduct.mutate("publish");
              }}
              type="button"
            >
              Saqlash
            </button>
            <button
              className="btn-secondary"
              disabled={saveProduct.isPending}
              onClick={() => {
                if (!validateForm()) {
                  return;
                }

                saveProduct.mutate("save_and_continue");
              }}
              type="button"
            >
              Saqlab qolish
            </button>
            <button
              className="btn-secondary"
              disabled={saveProduct.isPending}
              onClick={() => {
                if (!validateForm()) {
                  return;
                }

                saveProduct.mutate("save_hidden");
              }}
              type="button"
            >
              Yashirin saqlash
            </button>
            {isEditing ? (
              <>
                <button
                  className="btn-secondary"
                  disabled={duplicateProduct.isPending}
                  onClick={() => {
                    if (!validateForm()) {
                      return;
                    }

                    duplicateProduct.mutate();
                  }}
                  type="button"
                >
                  Nusxa yaratish
                </button>
                <button
                  className="btn-secondary !text-danger"
                  disabled={deleteProduct.isPending}
                  onClick={() => deleteProduct.mutate()}
                  type="button"
                >
                  O'chirish
                </button>
              </>
            ) : null}
          </div>
        </section>

        <div className="space-y-5">
          <section className="section-shell">
            <p className="eyebrow text-primary">Live preview</p>
            <h2 className="section-title">Mini App kartochkasi</h2>

            <div className="mt-4 rounded-[28px] bg-bgMain p-4">
              {form.image_url ? (
                <img
                  alt={form.name || "Preview"}
                  className="h-56 w-full rounded-[24px] object-cover"
                  src={form.image_url}
                />
              ) : (
                <div className="flex h-56 items-center justify-center rounded-[24px] bg-primary/10 text-4xl font-black text-primary">
                  {(form.name || "M").slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow text-primary">{previewMeta.sellerName}</p>
                  <h3 className="mt-2 text-2xl font-black text-textPrimary">
                    {form.name || "Mahsulot nomi"}
                  </h3>
                </div>
                <span className={form.is_available ? "badge-success" : "badge-danger"}>
                  {form.is_available ? "Faol" : "Yashirin"}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-textSecondary">
                {form.description || "Qisqa tavsif shu yerda ko'rinadi."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="badge-soft">{selectedCategory?.name ?? "Kategoriya tanlanmagan"}</span>
                <span className="badge-soft">{previewMeta.minimumOrderLabel}</span>
                <span className="badge-success">{previewMeta.stockLabel}</span>
              </div>

              <div className="soft-divider mt-4" />

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-textSecondary">Narx</p>
                  <span className="text-2xl font-black text-primary">
                    {formatPrice(normalizedPrice)}
                  </span>
                </div>
                <span className="badge-soft">{previewMeta.unitLabel}</span>
              </div>
            </div>
          </section>

          <section className="section-shell">
            <p className="eyebrow text-primary">Marketplace metadata</p>
            <h2 className="section-title">Avtomatik signallar</h2>
            <div className="mt-4 grid gap-3">
              <div className="feature-card">
                <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Seller</p>
                <p className="mt-2 text-lg font-black text-textPrimary">{previewMeta.sellerName}</p>
              </div>
              <div className="feature-card">
                <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Trust</p>
                <p className="mt-2 text-sm leading-6 text-textSecondary">
                  Halal, cold chain, veterinary checked, MOQ va rating preview orqali ko'rinadi.
                </p>
              </div>
              <div className="feature-card">
                <p className="text-xs uppercase tracking-[0.16em] text-textSecondary">Wholesale</p>
                <p className="mt-2 text-sm leading-6 text-textSecondary">
                  {previewMeta.wholesaleTiers.map((tier) => tier.label).join(", ")}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
