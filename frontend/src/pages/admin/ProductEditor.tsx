import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useToast } from "../../components/Toast";
import { api } from "../../lib/api";
import {
  fetchAdminCategories,
  fetchAdminProduct,
  queryKeys,
} from "../../lib/queries";
import { fileToBase64 } from "../../lib/utils";

export default function AdminProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    category_id: "",
    description: "",
    image_url: "",
    is_available: true,
    name: "",
    price: "0",
  });
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

  const saveProduct = useMutation({
    mutationFn: async () => {
      const payload = {
        category_id: form.category_id || null,
        description: form.description || null,
        image_url: form.image_url || null,
        is_available: form.is_available,
        name: form.name.trim(),
        price: Number(form.price),
      };

      if (isEditing) {
        return api.patch(`/admin/products/${id}`, payload);
      }

      return api.post("/admin/products", payload);
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Mahsulot saqlanmadi", "error");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      showToast("Mahsulot saqlandi");
      navigate("/admin/products");
    },
  });

  return (
    <AdminLayout
      actions={<Link className="chip" to="/admin/products">Ro'yxatga qaytish</Link>}
      description="Mahsulotni yaratish, rasm yuklash va katalogda ko'rinishini boshqarish."
      title={isEditing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
    >
      <ToastComponent />

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-panel space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-textPrimary">Nomi</label>
            <input
              className="input-field"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              value={form.name}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-textPrimary">Tavsif</label>
            <textarea
              className="input-field min-h-32 resize-none"
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              value={form.description}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-textPrimary">Narx</label>
              <input
                className="input-field"
                min="0"
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
                type="number"
                value={form.price}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-textPrimary">Kategoriya</label>
              <select
                className="input-field"
                onChange={(event) =>
                  setForm((current) => ({ ...current, category_id: event.target.value }))
                }
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
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-textPrimary">Rasm</label>
            <div className="flex flex-wrap gap-3">
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
                    showToast(
                      error instanceof Error ? error.message : "Rasm yuklanmadi",
                      "error",
                    );
                  }
                }}
                type="file"
              />
              <input
                className="input-field"
                onChange={(event) =>
                  setForm((current) => ({ ...current, image_url: event.target.value }))
                }
                placeholder="Yoki rasm URL kiriting"
                value={form.image_url}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-[22px] bg-bgMain/70 px-4 py-3">
            <input
              checked={form.is_available}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_available: event.target.checked }))
              }
              type="checkbox"
            />
            <span className="text-sm font-semibold text-textPrimary">
              Mahsulot katalogda ko'rinsin
            </span>
          </label>

          <button
            className="btn-primary"
            onClick={() => saveProduct.mutate()}
            type="button"
          >
            Saqlash
          </button>
        </div>

        <div className="surface-panel">
          <p className="eyebrow text-primary">Jonli preview</p>
          <h2 className="section-title">Ko'rinishi</h2>
          <div className="mt-4 rounded-[28px] bg-bgMain p-4">
            {form.image_url ? (
              <img
                alt={form.name || "Preview"}
                className="h-52 w-full rounded-[24px] object-cover"
                src={form.image_url}
              />
            ) : (
              <div className="flex h-52 items-center justify-center rounded-[24px] bg-primary/10 text-4xl font-black text-primary">
                {(form.name || "M").slice(0, 1).toUpperCase()}
              </div>
            )}
            <h3 className="mt-4 text-xl font-black text-textPrimary">
              {form.name || "Mahsulot nomi"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-textSecondary">
              {form.description || "Qisqa tavsif shu yerda ko'rinadi."}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xl font-black text-primary">
                {Number(form.price || 0).toLocaleString("ru-RU")} so'm
              </span>
              <span className="chip">
                {form.is_available ? "Faol" : "Yashirin"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
