import type {
  CustomerOrder,
  CustomerProfile,
  GeoPoint,
  ManagedProduct,
  PaymentMethod,
  PickupPoint,
  Review,
} from "@/types/app-data";

interface AppStateResponse {
  ok: boolean;
  profile?: CustomerProfile | null;
  pickupPoints?: PickupPoint[];
  products?: ManagedProduct[];
  orders?: CustomerOrder[];
  reviews?: Review[];
  support?: {
    phone: string;
    telegram: string;
  };
  error?: string;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
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
  promoCode?: string;
  customer: {
    name: string;
    phone?: string;
    address?: string;
    addressLabel?: string;
    coordinates?: GeoPoint;
    pickupPointId?: string;
    fulfillmentType: "delivery" | "pickup";
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

export function updateOrderStatusRequest(orderId: string, status: string) {
  return requestJson<{ ok: boolean; order?: CustomerOrder }>(`/api/orders`, {
    method: "PATCH",
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

export function saveProduct(payload: Partial<ManagedProduct>) {
  return requestJson<{ ok: boolean; products?: ManagedProduct[] }>(`/api/products`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(productId: string) {
  return requestJson<{ ok: boolean; products?: ManagedProduct[] }>(`/api/products`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ id: productId }),
  });
}

export function sendBroadcast(payload: { title: string; body: string }) {
  return requestJson<{ ok: boolean; sent?: number }>(`/api/broadcast`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
