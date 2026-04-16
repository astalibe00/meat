export interface Category {
  icon?: string | null;
  id: string;
  name: string;
  sort_order?: number | null;
}

export interface UserProfile {
  created_at?: string;
  default_address?: string | null;
  first_name: string;
  id: string;
  is_admin: boolean;
  is_registered: boolean;
  last_name?: string | null;
  phone?: string | null;
  telegram_id: number;
  updated_at?: string | null;
  username?: string | null;
}

export interface Product {
  categories?: Category | null;
  category_id?: string | null;
  created_at?: string;
  description?: string | null;
  id: string;
  image_url?: string | null;
  is_available?: boolean;
  name: string;
  price: number | string;
}

export interface AdminProductInput {
  category_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  is_available?: boolean;
  name: string;
  price: number;
}

export interface AdminCategoryInput {
  icon?: string | null;
  name: string;
  sort_order: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  products?: Product | null;
  quantity: number;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "delivering"
  | "completed"
  | "cancelled";

export interface OrderItem {
  name: string;
  price: number | string;
  product_id: string;
  quantity: number;
}

export interface Order {
  created_at: string;
  id: string;
  items: OrderItem[];
  location: string;
  payment_method: string;
  phone: string;
  status: OrderStatus;
  total_price: number | string;
  updated_at?: string;
  user_id?: string;
  users?: {
    first_name?: string | null;
    last_name?: string | null;
    telegram_id?: number | null;
    username?: string | null;
  } | null;
}

export interface TopProductAnalytics {
  count: number;
  name: string;
  product_id: string;
  revenue: number;
}

export interface AdminDashboard {
  active_deliveries: number;
  active_products: number;
  categories_count: number;
  month_revenue: number;
  pending_orders: number;
  recent_orders: Order[];
  today_revenue: number;
  top_products: TopProductAnalytics[];
}
