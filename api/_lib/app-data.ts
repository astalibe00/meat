import { createClient } from "@supabase/supabase-js";
import { PRODUCTS, type Product } from "../../src/data/products.js";
import type {
  AppDataState,
  CustomerOrder,
  CustomerProfile,
  ManagedProduct,
  PickupPoint,
  Review,
} from "../../src/types/app-data.js";

const BUCKET_ID = "meat-app-data";
const STATE_OBJECT = "state/app-data.json";

const DEFAULT_PICKUP_POINTS: PickupPoint[] = [
  {
    id: "pickup-yunusobod",
    title: "Yunusobod tarqatish punkti",
    address: "Yunusobod tumani, 14-kvartal, 23-uy",
    landmark: "Mega Planet yaqinida",
    hours: "09:00 - 21:00",
  },
  {
    id: "pickup-oybek",
    title: "Oybek tarqatish punkti",
    address: "Oybek ko'chasi, 18A",
    landmark: "Oybek metrodan 5 daqiqa",
    hours: "10:00 - 22:00",
  },
  {
    id: "pickup-chilonzor",
    title: "Chilonzor tarqatish punkti",
    address: "Chilonzor 19-kvartal, 41-uy",
    landmark: "Katartal bozori ro'parasida",
    hours: "09:00 - 20:00",
  },
];

function getEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getSupabaseClient() {
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error("SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY topilmadi.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function withDefaults(product: Product): ManagedProduct {
  return {
    ...product,
    stockKg: product.weightOptions?.length ? 24 : 12,
    minOrderKg: 0.3,
    enabled: true,
    rating: 4.8,
    reviewCount: 0,
  };
}

export function getDefaultAppData(): AppDataState {
  return {
    products: PRODUCTS.map(withDefaults),
    pickupPoints: DEFAULT_PICKUP_POINTS,
    customers: [],
    orders: [],
    reviews: [],
    broadcasts: [],
  };
}

async function ensureBucket() {
  const supabase = getSupabaseClient();
  const existing = await supabase.storage.getBucket(BUCKET_ID);

  if (!existing.error) {
    return;
  }

  const created = await supabase.storage.createBucket(BUCKET_ID, {
    public: false,
    fileSizeLimit: 1024 * 1024 * 5,
    allowedMimeTypes: ["application/json"],
  });

  if (created.error && !created.error.message.toLowerCase().includes("exists")) {
    throw created.error;
  }
}

export async function readAppData() {
  await ensureBucket();
  const supabase = getSupabaseClient();
  const download = await supabase.storage.from(BUCKET_ID).download(STATE_OBJECT);

  if (download.error) {
    const message = download.error.message.toLowerCase();
    if (message.includes("not found") || message.includes("does not exist")) {
      const initial = getDefaultAppData();
      await writeAppData(initial);
      return initial;
    }

    throw download.error;
  }

  const text = await download.data.text();
  if (!text.trim()) {
    return getDefaultAppData();
  }

  const parsed = JSON.parse(text) as AppDataState;
  return normalizeAppData(parsed);
}

export async function writeAppData(state: AppDataState) {
  await ensureBucket();
  const supabase = getSupabaseClient();
  const payload = new Blob([JSON.stringify(normalizeAppData(state), null, 2)], {
    type: "application/json",
  });

  const upload = await supabase.storage.from(BUCKET_ID).upload(STATE_OBJECT, payload, {
    upsert: true,
    contentType: "application/json",
  });

  if (upload.error) {
    throw upload.error;
  }
}

export async function mutateAppData(
  mutator: (state: AppDataState) => AppDataState | Promise<AppDataState>,
) {
  const current = await readAppData();
  const next = await mutator(current);
  const normalized = normalizeAppData(next);
  await writeAppData(normalized);
  return normalized;
}

export function normalizeAppData(state?: Partial<AppDataState>): AppDataState {
  const defaults = getDefaultAppData();
  const products = (state?.products?.length ? state.products : defaults.products).map((product) => {
    const base = defaults.products.find((item) => item.id === product.id) ?? withDefaults(product);
    return {
      ...base,
      ...product,
      enabled: product.enabled ?? true,
      stockKg: Number(product.stockKg ?? base.stockKg ?? 0),
      minOrderKg: Number(product.minOrderKg ?? base.minOrderKg ?? 0.3),
      rating: Number(product.rating ?? base.rating ?? 4.8),
      reviewCount: Number(product.reviewCount ?? base.reviewCount ?? 0),
    };
  });

  return {
    products,
    pickupPoints: state?.pickupPoints?.length ? state.pickupPoints : defaults.pickupPoints,
    customers: state?.customers ?? [],
    orders: state?.orders ?? [],
    reviews: state?.reviews ?? [],
    broadcasts: state?.broadcasts ?? [],
  };
}

export function upsertCustomer(
  customers: CustomerProfile[],
  profile: Omit<CustomerProfile, "updatedAt">,
) {
  const updatedAt = new Date().toISOString();
  const index = customers.findIndex((item) => item.telegramUserId === profile.telegramUserId);
  const nextProfile = { ...profile, updatedAt };

  if (index >= 0) {
    const next = [...customers];
    next[index] = { ...next[index], ...nextProfile };
    return next;
  }

  return [nextProfile, ...customers];
}

export function findCustomer(customers: CustomerProfile[], telegramUserId?: number) {
  if (!telegramUserId) {
    return undefined;
  }

  return customers.find((item) => item.telegramUserId === telegramUserId);
}

export function attachReviewSummary(products: ManagedProduct[], reviews: Review[]) {
  return products.map((product) => {
    const productReviews = reviews.filter((review) => review.productId === product.id);
    const reviewCount = productReviews.length;
    const rating = reviewCount
      ? Number(
          (
            productReviews.reduce((total, review) => total + review.rating, 0) / reviewCount
          ).toFixed(1),
        )
      : product.rating;

    return {
      ...product,
      rating,
      reviewCount,
    };
  });
}

export function nextReviewId() {
  return createId("review");
}

export function nextOrderId() {
  return `MEAT-${String(Date.now()).slice(-8)}`;
}

export function nextStatusEventId() {
  return createId("status");
}

export function nextBroadcastId() {
  return createId("broadcast");
}

export function replaceOrder(orders: CustomerOrder[], order: CustomerOrder) {
  const index = orders.findIndex((item) => item.id === order.id);
  if (index >= 0) {
    const next = [...orders];
    next[index] = order;
    return next;
  }

  return [order, ...orders];
}
