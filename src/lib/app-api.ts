import type {
  AuditLogEntry,
  BroadcastAudience,
  CustomerNotification,
  CustomerOrder,
  CustomerProfile,
  DeliverySlot,
  GeoPoint,
  ManagedProduct,
  PaymentMethod,
  PaymentReceipt,
  PickupPoint,
  Review,
} from "@/types/app-data";

interface AppStateResponse {
  ok: boolean;
  profile?: CustomerProfile | null;
  pickupPoints?: PickupPoint[];
  products?: ManagedProduct[];
  orders?: CustomerOrder[];
  notifications?: CustomerNotification[];
  reviews?: Review[];
  support?: {
    phone: string;
    telegram: string;
  };
  error?: string;
}

interface RequestOptions extends RequestInit {
  adminToken?: string;
}

function withAdminHeaders(init?: RequestOptions) {
  const headers = new Headers(init?.headers);
  if (init?.adminToken) {
    headers.set("authorization", `Bearer ${init.adminToken}`);
  }

  return headers;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestOptions): Promise<T> {
  const { adminToken, ...requestInit } = init ?? {};
  void adminToken;
  const response = await fetch(input, {
    ...requestInit,
    headers: withAdminHeaders(init),
  });
  const payload = (await response.json().catch(() => null)) as T & { error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "So'rov bajarilmadi");
  }

  return (payload ?? {}) as T;
}

export function fetchAppState(telegramUserId?: number) {
  const query = telegramUserId ? `?telegramUserId=${telegramUserId}` : "";
  return requestJson<AppStateResponse>(`/api/app-state${query}`);
}

export function fetchCatalogProducts() {
  return requestJson<{ ok: boolean; products?: ManagedProduct[] }>(`/api/products`);
}

export function markNotificationsReadRequest(payload: {
  telegramUserId: number;
  notificationIds?: string[];
}) {
  return requestJson<{ ok: boolean; notifications?: CustomerNotification[]; unreadCount?: number }>(
    `/api/app-state`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export function saveCustomerProfile(payload: {
  telegramUserId: number;
  name: string;
  username?: string;
  phone?: string;
  address?: string;
  addressLabel?: string;
  coordinates?: GeoPoint;
  preferredFulfillment: "delivery" | "pickup";
  pickupPointId?: string;
}) {
  return requestJson<{ ok: boolean; profile?: CustomerProfile }>(`/api/customer-profile`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function reverseGeocode(lat: number, lon: number) {
  return requestJson<{ ok: boolean; address: string; coordinates: GeoPoint }>(
    `/api/reverse-geocode?lat=${lat}&lon=${lon}`,
  );
}

export function submitOrder(payload: {
  telegramUserId?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentReceipt?: PaymentReceipt;
  promoCode?: string;
  customer: {
    name: string;
    phone?: string;
    address?: string;
    addressLabel?: string;
    coordinates?: GeoPoint;
    pickupPointId?: string;
    fulfillmentType: "delivery" | "pickup";
    deliverySlot?: DeliverySlot;
  };
  items: Array<{
    productId: string;
    quantity: number;
    weightOption?: string;
  }>;
}) {
  return requestJson<{ ok: boolean; order?: CustomerOrder }>(`/api/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function cancelOrderRequest(orderId: string, reason?: string) {
  return requestJson<{ ok: boolean; order?: CustomerOrder }>(`/api/orders`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action: "cancel",
      orderId,
      reason,
    }),
  });
}

export function updateOrderStatusRequest(orderId: string, status: string, adminToken?: string) {
  return requestJson<{ ok: boolean; order?: CustomerOrder }>(`/api/orders`, {
    method: "PATCH",
    adminToken,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action: "status",
      orderId,
      status,
    }),
  });
}

export function requestSupport(payload: {
  topic?: string;
  message: string;
  latestOrderId?: string;
  source?: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  telegramUser?: {
    id?: number;
    username?: string;
  };
}) {
  return requestJson<{ ok: boolean; notified?: number }>(`/api/support-request`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function submitReviewRequest(payload: {
  orderId: string;
  productId: string;
  customerName: string;
  rating: number;
  comment?: string;
}) {
  return requestJson<{ ok: boolean; reviews?: Review[]; products?: ManagedProduct[] }>(
    `/api/reviews`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export function saveProduct(payload: Partial<ManagedProduct>, adminToken?: string) {
  return requestJson<{ ok: boolean; products?: ManagedProduct[] }>(`/api/products`, {
    method: "POST",
    adminToken,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(productId: string, adminToken?: string) {
  return requestJson<{ ok: boolean; products?: ManagedProduct[] }>(`/api/products`, {
    method: "DELETE",
    adminToken,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ id: productId }),
  });
}

export function sendBroadcast(
  payload: { title: string; body: string; audience?: BroadcastAudience },
  adminToken?: string,
) {
  return requestJson<{ ok: boolean; sent?: number }>(`/api/broadcast`, {
    method: "POST",
    adminToken,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function requestAdminCode() {
  return requestJson<{ ok: boolean; sent: number; expiresAt: string }>(`/api/admin-auth`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ action: "request" }),
  });
}

export function verifyAdminCode(code: string, label?: string) {
  return requestJson<{
    ok: boolean;
    token: string;
    expiresAt: string;
    session: {
      token: string;
      label: string;
      expiresAt: string;
    };
  }>(`/api/admin-auth`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ action: "verify", code, label }),
  });
}

export function validateAdminToken(adminToken: string) {
  return requestJson<{ ok: boolean; authenticated: boolean }>(`/api/admin-auth`, {
    adminToken,
  });
}

export function fetchAdminState(adminToken: string) {
  return requestJson<{
    ok: boolean;
    session: {
      token: string;
      label: string;
      role: "owner" | "manager" | "support";
      expiresAt: string;
    };
    orders: CustomerOrder[];
    products: ManagedProduct[];
    customers: CustomerProfile[];
    reviews: Review[];
    broadcasts: Array<{
      id: string;
      title: string;
      body: string;
      createdAt: string;
      audience: BroadcastAudience;
      sentCount?: number;
    }>;
    customerInsights: Array<{
      customer: CustomerProfile;
      totalOrders: number;
      paidOrders: number;
      totalSpent: number;
      averageOrderValue: number;
      lastOrderAt?: string;
      favoriteCategory?: ManagedProduct["category"];
      segment: "new" | "active" | "vip" | "at-risk";
    }>;
    lowStockProducts: ManagedProduct[];
    orderBuckets: Record<string, CustomerOrder[]>;
    auditLog: AuditLogEntry[];
    pickupPoints: PickupPoint[];
    analytics: {
      ordersTotal: number;
      pendingOrders: number;
      cancelledOrders: number;
      customersTotal: number;
      paidRevenue: number;
      pendingRevenue: number;
      averageOrderValue: number;
      lowStockCount: number;
      paymentsByMethod: Array<{
        method: "humo" | "uzcard" | "click" | "payme" | "paynet" | "cash";
        totalOrders: number;
        paidOrders: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
      }>;
      paymentsByStatus: Array<{
        status: "pending" | "paid" | "refund-pending" | "refunded" | "cancelled";
        count: number;
        amount: number;
      }>;
      revenueSeries: Array<{
        date: string;
        label: string;
        orders: number;
        revenue: number;
      }>;
    };
  }>(`/api/admin-state`, {
    adminToken,
  });
}
