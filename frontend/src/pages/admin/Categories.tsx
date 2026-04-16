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
      description="Kategoriya nomi, emoji belgisi va tartibini boshqaring."
      title="Kategoriyalar"
    >
      <ToastComponent />

      <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
        <div className="surface-panel space-y-4">
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
                placeholder="🍔"
                value={form.icon}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-textPrimary">Tartib</label>
              <input
                className="input-field"
                onChange={(event) =>
                  setForm((current) => ({ ...current, sort_order: event.target.value }))
                }
                type="number"
                value={form.sort_order}
              />
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => saveCategory.mutate()}
            type="button"
          >
            {editing ? "Yangilash" : "Kategoriya qo'shish"}
          </button>
        </div>

        <div className="grid gap-3">
          {categoriesQuery.data?.map((category) => (
            <div className="surface-panel" key={category.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/10 text-xl">
                    {category.icon || "•"}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-textPrimary">{category.name}</h2>
                    <p className="text-sm text-textSecondary">
                      Tartib: {category.sort_order ?? 0}
                    </p>
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
      </div>
    </AdminLayout>
  );
}
