import { api } from "./api";
import type {
  AdminDashboard,
  CartItem,
  Category,
  Order,
  Product,
  SupportTicket,
  TopProductAnalytics,
  UserProfile,
} from "./types";

function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const suffix = searchParams.toString();
  return suffix ? `?${suffix}` : "";
}

export const queryKeys = {
  adminCategories: ["admin", "categories"] as const,
  adminDashboard: ["admin", "dashboard"] as const,
  adminOrders: (status?: string) => ["admin", "orders", status ?? "all"] as const,
  adminProduct: (id: string) => ["admin", "products", id] as const,
  adminProducts: (search?: string) => ["admin", "products", search ?? ""] as const,
  cart: ["cart"] as const,
  categories: ["categories"] as const,
  order: (id: string) => ["orders", id] as const,
  orders: ["orders"] as const,
  product: (id: string) => ["products", id] as const,
  profile: ["me"] as const,
  products: (categoryId?: string, search?: string) =>
    ["products", categoryId ?? "all", search ?? ""] as const,
  support: ["support"] as const,
};

export function fetchCategories() {
  return api.get<Category[]>("/categories");
}

export function fetchProducts(categoryId?: string, search?: string) {
  return api.get<Product[]>(
    `/products${buildQuery({
      category_id: categoryId,
      search,
    })}`,
  );
}

export function fetchProduct(id: string) {
  return api.get<Product>(`/products/${id}`);
}

export function fetchCart() {
  return api.get<CartItem[]>("/cart");
}

export function fetchOrders() {
  return api.get<Order[]>("/orders");
}

export function fetchOrder(id: string) {
  return api.get<Order>(`/orders/${id}`);
}

export function fetchProfile() {
  return api.get<UserProfile>("/me");
}

export function fetchSupportTickets() {
  return api.get<SupportTicket[]>("/support");
}

export function fetchAdminDashboard() {
  return api.get<AdminDashboard>("/admin/dashboard");
}

export function fetchAdminProducts(search?: string) {
  return api.get<Product[]>(
    `/admin/products${buildQuery({
      search,
    })}`,
  );
}

export function fetchAdminProduct(id: string) {
  return api.get<Product>(`/admin/products/${id}`);
}

export function fetchAdminCategories() {
  return api.get<Category[]>("/admin/categories");
}

export function fetchAdminOrders(status?: string) {
  return api.get<Order[]>(
    `/admin/orders${buildQuery({
      status,
    })}`,
  );
}

export function fetchAdminAnalytics() {
  return api.get<{ topProducts: TopProductAnalytics[] }>("/admin/analytics");
}
