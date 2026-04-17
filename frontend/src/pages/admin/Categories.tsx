import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { useToast } from "../../components/Toast";
import { api } from "../../lib/api";
import { fetchAdminCategories, queryKeys } from "../../lib/queries";
import type { Category } from "../../lib/types";

const initialForm = {
  icon: "",
  name: "",
  sort_order: "0",
};

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(initialForm);
  const { ToastComponent, showToast } = useToast();

  const categoriesQuery = useQuery({
    queryFn: fetchAdminCategories,
    queryKey: queryKeys.adminCategories,
  });

  const saveCategory = useMutation({
    mutationFn: () => {
      const payload = {
        icon: form.icon || null,
        name: form.name.trim(),
        sort_order: Number(form.sort_order),
      };

      if (editing) {
        return api.patch(`/admin/categories/${editing.id}`, payload);
      }

      return api.post("/admin/categories", payload);
    },
    onSuccess: async () => {
      setEditing(null);
      setForm(initialForm);
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories });
      showToast("Kategoriya saqlandi");
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories });
      showToast("Kategoriya o'chirildi");
    },
  });

  return (
    <AdminLayout
      description="Kategoriya nomi, icon va tartibini professional katalog oqimiga moslab boshqaring."
      title="Kategoriyalar"
    >
      <ToastComponent />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="section-shell space-y-4">
          <div>
            <p className="eyebrow text-primary">Editor</p>
            <h2 className="section-title">Kategoriya yaratish</h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-textPrimary">Nomi</label>
            <input
              className="input-field"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              value={form.name}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-textPrimary">Icon</label>
              <input
                className="input-field"
                onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                placeholder="Masalan: M"
                value={form.icon}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-textPrimary">Tartib</label>
              <input
                className="input-field"
                onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
                type="number"
                value={form.sort_order}
              />
            </div>
          </div>

          <div className="rounded-[24px] bg-bgMain/80 px-4 py-4 text-sm leading-6 text-textSecondary">
            Kategoriya tartibi home page va katalog chip'larida ko'rinish prioritetiga ta'sir qiladi.
          </div>

          <button className="btn-primary" onClick={() => saveCategory.mutate()} type="button">
            {editing ? "Yangilash" : "Kategoriya qo'shish"}
          </button>
        </section>

        <section className="section-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-primary">Ro'yxat</p>
              <h2 className="section-title">Mavjud kategoriyalar</h2>
            </div>
            <span className="badge-soft">{categoriesQuery.data?.length ?? 0} ta</span>
          </div>

          <div className="mt-4 grid gap-3">
            {categoriesQuery.data?.map((category) => (
              <div className="feature-card" key={category.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary/10 text-xl font-black text-primary">
                      {category.icon || category.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-textPrimary">{category.name}</h2>
                      <p className="text-sm text-textSecondary">Tartib: {category.sort_order ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="chip"
                      onClick={() => {
                        setEditing(category);
                        setForm({
                          icon: category.icon ?? "",
                          name: category.name,
                          sort_order: String(category.sort_order ?? 0),
                        });
                      }}
                      type="button"
                    >
                      Tahrirlash
                    </button>
                    <button
                      className="chip bg-danger/10 text-danger"
                      onClick={() => deleteCategory.mutate(category.id)}
                      type="button"
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
