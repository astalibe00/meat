import type {
  AdminRole,
  AuditLogEntry,
  BroadcastAudience,
  CustomerOrder,
  CustomerProfile,
  CustomerSegment,
  ManagedProduct,
  PaymentMethod,
  PaymentStatus,
} from "../types/app-data.js";

export interface CustomerInsight {
  customer: CustomerProfile;
  totalOrders: number;
  paidOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt?: string;
  favoriteCategory?: ManagedProduct["category"];
  segment: CustomerSegment;
}

export interface PaymentMethodSummary {
  method: PaymentMethod;
  totalOrders: number;
  paidOrders: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface PaymentStatusSummary {
  status: PaymentStatus;
  count: number;
  amount: number;
}

export interface RevenuePoint {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function getCustomerSegment(totalOrders: number, paidRevenue: number, lastOrderAt?: string): CustomerSegment {
  const daysSinceLastOrder = lastOrderAt
    ? Math.floor((Date.now() - Date.parse(lastOrderAt)) / (1000 * 60 * 60 * 24))
    : Number.POSITIVE_INFINITY;

  if (totalOrders >= 5 || paidRevenue >= 2_500_000) {
    return "vip";
  }

  if (daysSinceLastOrder <= 30) {
    return totalOrders <= 1 ? "new" : "active";
  }

  if (daysSinceLastOrder <= 75) {
    return "active";
  }

  return "at-risk";
}

export function buildCustomerInsights(customers: CustomerProfile[], orders: CustomerOrder[]) {
  return customers
    .map((customer) => {
      const relatedOrders = orders
        .filter((order) => order.customer.telegramUserId === customer.telegramUserId)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
      const paidOrders = relatedOrders.filter((order) => order.paymentStatus === "paid");
      const totalSpent = sum(paidOrders.map((order) => order.total));
      const categoryWeights = new Map<string, number>();

      for (const order of relatedOrders) {
        for (const line of order.items) {
          categoryWeights.set(
            line.product.category,
            (categoryWeights.get(line.product.category) ?? 0) + line.quantity,
          );
        }
      }

      const favoriteCategory = [...categoryWeights.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] as
        | ManagedProduct["category"]
        | undefined;
      const lastOrderAt = relatedOrders[0]?.createdAt;

      return {
        customer,
        totalOrders: relatedOrders.length,
        paidOrders: paidOrders.length,
        totalSpent,
        averageOrderValue: paidOrders.length ? Math.round(totalSpent / paidOrders.length) : 0,
        lastOrderAt,
        favoriteCategory,
        segment: getCustomerSegment(relatedOrders.length, totalSpent, lastOrderAt),
      } satisfies CustomerInsight;
    })
    .sort((left, right) => {
      if (right.totalSpent !== left.totalSpent) {
        return right.totalSpent - left.totalSpent;
      }

      return right.totalOrders - left.totalOrders;
    });
}

export function filterAudienceInsights(
  insights: CustomerInsight[],
  audience: BroadcastAudience,
) {
  if (audience === "all") {
    return insights;
  }

  return insights.filter((entry) => entry.segment === audience);
}

export function summarizeAuditActor(actor: string, role?: AdminRole) {
  return role ? `${actor} (${role})` : actor;
}

export function groupOrdersByStatus(orders: CustomerOrder[]) {
  return {
    pending: orders.filter((order) => order.status === "pending"),
    confirmed: orders.filter((order) => order.status === "confirmed"),
    preparing: orders.filter((order) => order.status === "preparing"),
    ready: orders.filter((order) => order.status === "ready"),
    delivering: orders.filter((order) => order.status === "delivering"),
    completed: orders.filter((order) => order.status === "completed"),
    cancelled: orders.filter((order) => order.status === "cancelled"),
  };
}

export function summarizeLowStockProducts(products: ManagedProduct[], threshold = 3) {
  return [...products]
    .filter((product) => product.stockKg <= threshold)
    .sort((left, right) => left.stockKg - right.stockKg);
}

export function latestAuditEntries(auditLog: AuditLogEntry[], limit = 20) {
  return [...auditLog]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, limit);
}

export function summarizePaymentsByMethod(orders: CustomerOrder[]): PaymentMethodSummary[] {
  const methods: PaymentMethod[] = ["click", "payme", "paynet", "humo", "uzcard", "cash"];

  return methods.map((method) => {
    const relatedOrders = orders.filter((order) => order.paymentMethod === method);
    const paidOrders = relatedOrders.filter((order) => order.paymentStatus === "paid");
    const totalAmount = sum(relatedOrders.map((order) => order.total));
    const paidAmount = sum(paidOrders.map((order) => order.total));

    return {
      method,
      totalOrders: relatedOrders.length,
      paidOrders: paidOrders.length,
      totalAmount,
      paidAmount,
      pendingAmount: Math.max(0, totalAmount - paidAmount),
    };
  });
}

export function summarizePaymentsByStatus(orders: CustomerOrder[]): PaymentStatusSummary[] {
  const statuses: PaymentStatus[] = ["pending", "paid", "refund-pending", "refunded", "cancelled"];

  return statuses.map((status) => {
    const relatedOrders = orders.filter((order) => order.paymentStatus === status);
    return {
      status,
      count: relatedOrders.length,
      amount: sum(relatedOrders.map((order) => order.total)),
    };
  });
}

export function buildRevenueSeries(orders: CustomerOrder[], days = 7): RevenuePoint[] {
  const points: RevenuePoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayOrders = orders.filter((order) => {
      const createdAt = Date.parse(order.createdAt);
      return createdAt >= date.getTime() && createdAt < nextDay.getTime();
    });

    const paidOrders = dayOrders.filter((order) => order.paymentStatus === "paid");

    points.push({
      date: date.toISOString(),
      label: new Intl.DateTimeFormat("uz-UZ", { weekday: "short" }).format(date),
      orders: dayOrders.length,
      revenue: sum(paidOrders.map((order) => order.total)),
    });
  }

  return points;
}
