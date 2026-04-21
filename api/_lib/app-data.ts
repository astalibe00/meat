import { createClient } from "@supabase/supabase-js";
import type {
  AdminAuthState,
  AuditLogEntry,
  AppDataState,
  CustomerNotification,
  CustomerOrder,
  CustomerProfile,
  ManagedProduct,
  PickupPoint,
  Review,
} from "../../src/types/app-data.js";

const BUCKET_ID = "meat-app-data";
const STATE_OBJECT = "state/app-data.json";

interface SeedProduct {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  weight: string;
  category: ManagedProduct["category"];
  image: string;
  tags: ManagedProduct["tags"];
  description: string;
  weightOptions?: string[];
  origin?: string;
  prepTime?: string;
}

const DEFAULT_PRODUCTS: SeedProduct[] = [
  {
    id: "ground-beef",
    name: "Qiyma mol go'shti",
    price: 110000,
    weight: "0.5 kg",
    category: "beef",
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=900&q=80",
    tags: ["Popular", "Fresh"],
    description: "100% halol mol go'shti qiyma qilinib tayyorlangan.",
    weightOptions: ["0.5 kg", "1 kg", "2 kg"],
    origin: "AQSH, yaylovda boqilgan",
    prepTime: "15 daqiqa",
  },
  {
    id: "beef-chuck",
    name: "Mol go'shti dimlamalik bo'lagi",
    price: 195000,
    oldPrice: 245000,
    weight: "1 kg",
    category: "beef",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    tags: ["Sale", "Best Value"],
    description: "Dimlama va qozon taomlari uchun mos yumshoq bo'lak.",
    weightOptions: ["1 kg", "1.5 kg"],
    origin: "AQSH, o't bilan boqilgan",
    prepTime: "3 soat",
  },
  {
    id: "beef-ribeye",
    name: "Mol ribay steyki",
    price: 232000,
    weight: "0.3 kg",
    category: "beef",
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80",
    tags: ["Premium", "Popular"],
    description: "Uy sharoitida premium steyk tayyorlash uchun qo'lda kesilgan bo'lak.",
    weightOptions: ["0.3 kg", "0.45 kg"],
    origin: "AQSH, prime sifat",
    prepTime: "10 daqiqa",
  },
  {
    id: "lamb-leg",
    name: "Butun qo'y soni",
    price: 427000,
    oldPrice: 525000,
    weight: "2 kg",
    category: "lamb",
    image: "https://images.unsplash.com/photo-1514516345957-556ca7c90a33?auto=format&fit=crop&w=900&q=80",
    tags: ["Sale", "Premium", "Traditional"],
    description: "Bayramlar va katta dasturxon uchun butun qo'y soni.",
    weightOptions: ["2 kg", "2.5 kg"],
    origin: "Yangi Zelandiya yaylovi",
    prepTime: "2 soat",
  },
  {
    id: "lamb-chops",
    name: "Qo'y kotleti",
    price: 305000,
    weight: "0.6 kg",
    category: "lamb",
    image: "https://images.unsplash.com/photo-1529692236671-f1dc31f2d302?auto=format&fit=crop&w=900&q=80",
    tags: ["Premium", "Popular"],
    description: "Tovada yoki grilda tez pishadigan yumshoq qo'y kotletlari.",
    weightOptions: ["0.6 kg", "1.2 kg"],
    origin: "Yangi Zelandiya yaylovi",
    prepTime: "8 daqiqa",
  },
  {
    id: "ground-lamb",
    name: "Qiyma qo'y go'shti",
    price: 158000,
    weight: "0.5 kg",
    category: "lamb",
    image: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=900&q=80",
    tags: ["Fresh"],
    description: "Kabob va milliy taomlar uchun yangi qiyma.",
    weightOptions: ["0.5 kg", "1 kg"],
    origin: "Yaylovda boqilgan",
    prepTime: "15 daqiqa",
  },
  {
    id: "whole-chicken",
    name: "Butun tovuq",
    price: 158000,
    weight: "2 kg",
    category: "chicken",
    image: "https://images.unsplash.com/photo-1603048719539-9ecb4c0b18f0?auto=format&fit=crop&w=900&q=80",
    tags: ["Popular", "Fresh", "Best Value"],
    description: "Pechda yoki bo'laklab tayyorlash uchun butun halol tovuq.",
    weightOptions: ["1.5 kg", "2 kg"],
    origin: "AQSH, erkin boqilgan",
    prepTime: "1.5 soat",
  },
  {
    id: "chicken-wings",
    name: "Tovuq qanotlari",
    price: 122000,
    oldPrice: 158000,
    weight: "1.4 kg",
    category: "chicken",
    image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=900&q=80",
    tags: ["Sale", "Popular"],
    description: "Mehmonlar va oilaviy yig'ilish uchun qulay qanotlar.",
    origin: "AQSH, erkin boqilgan",
    prepTime: "40 daqiqa",
  },
  {
    id: "goat-shoulder",
    name: "Echki yelkasi",
    price: 280000,
    weight: "1.5 kg",
    category: "goat",
    image: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=900&q=80",
    tags: ["Traditional", "Premium"],
    description: "Biryani va curry uchun tayyor yumshoq echki yelkasi.",
    weightOptions: ["1.5 kg", "2 kg"],
    origin: "Yaylovda boqilgan",
    prepTime: "3 soat",
  },
  {
    id: "goat-curry",
    name: "Echki curry bo'laklari",
    price: 220000,
    weight: "0.9 kg",
    category: "goat",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    tags: ["Traditional", "Popular"],
    description: "Curry va dimlama uchun toza, suyakka ajratilgan bo'laklar.",
    origin: "Yaylovda boqilgan",
    prepTime: "2 soat",
  },
  {
    id: "wild-salmon",
    name: "Yovvoyi losos",
    price: 183000,
    weight: "0.5 kg",
    category: "seafood",
    image: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=900&q=80",
    tags: ["Wild Caught", "Premium", "Fresh"],
    description: "Omega-3 ga boy, tayyorlashga qulay losos filesi.",
    weightOptions: ["0.5 kg", "1 kg"],
    origin: "Alyaska, yovvoyi ov",
    prepTime: "12 daqiqa",
  },
  {
    id: "family-box",
    name: "Oilaviy halol to'plam",
    price: 793000,
    oldPrice: 1037000,
    weight: "4.5 kg",
    category: "bundles",
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=900&q=80",
    tags: ["Sale", "Best Deal", "Best Value"],
    description: "Bir haftalik oilaviy xarid uchun tayyor to'plam.",
    origin: "Aralash tanlov",
    prepTime: "Turlicha",
  },
];

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

function withDefaults(product: SeedProduct): ManagedProduct {
  return {
    ...product,
    stockKg: product.weightOptions?.length ? 24 : 12,
    minOrderKg: 0.3,
    enabled: true,
    rating: 4.8,
    reviewCount: 0,
  };
}

function normalizeProduct(product: Partial<ManagedProduct>, defaults: ManagedProduct[]) {
  const firstDefault = defaults[0];
  const base =
    defaults.find((item) => item.id === product.id) ??
    withDefaults({
      id: product.id?.trim() || createId("product"),
      name: product.name?.trim() || "Yangi mahsulot",
      price: Number(product.price ?? 0),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : undefined,
      weight: product.weight?.trim() || "1 kg",
      category: product.category ?? "beef",
      image: product.image?.trim() || firstDefault.image,
      tags: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags : ["Fresh"],
      description: product.description?.trim() || "Tavsif kiritilmagan.",
      weightOptions:
        Array.isArray(product.weightOptions) && product.weightOptions.length > 0
          ? product.weightOptions
          : [product.weight?.trim() || "1 kg"],
      origin: product.origin?.trim(),
      prepTime: product.prepTime?.trim(),
    });

  return {
    ...base,
    ...product,
    id: product.id?.trim() || base.id,
    name: product.name?.trim() || base.name,
    price: Number(product.price ?? base.price ?? 0),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : base.oldPrice,
    weight: product.weight?.trim() || base.weight,
    category: product.category ?? base.category,
    image: product.image?.trim() || base.image || firstDefault.image,
    tags: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags : base.tags,
    description: product.description?.trim() || base.description || "Tavsif kiritilmagan.",
    weightOptions:
      Array.isArray(product.weightOptions) && product.weightOptions.length > 0
        ? product.weightOptions
        : base.weightOptions?.length
          ? base.weightOptions
          : [product.weight?.trim() || base.weight || "1 kg"],
    enabled: product.enabled ?? base.enabled ?? true,
    stockKg: Number(product.stockKg ?? base.stockKg ?? 0),
    minOrderKg: Number(product.minOrderKg ?? base.minOrderKg ?? 0.3),
    rating: Number(product.rating ?? base.rating ?? 4.8),
    reviewCount: Number(product.reviewCount ?? base.reviewCount ?? 0),
  };
}

function getDefaultAdminAuth(): AdminAuthState {
  return {
    sessions: [],
  };
}

function getDefaultAuditLog(): AuditLogEntry[] {
  return [];
}

export function getDefaultAppData(): AppDataState {
  return {
    products: DEFAULT_PRODUCTS.map(withDefaults),
    pickupPoints: DEFAULT_PICKUP_POINTS,
    customers: [],
    orders: [],
    reviews: [],
    broadcasts: [],
    notifications: [],
    auditLog: getDefaultAuditLog(),
    adminAuth: getDefaultAdminAuth(),
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
  const products = (state?.products?.length ? state.products : defaults.products).map((product) =>
    normalizeProduct(product, defaults.products),
  );

  return {
    products,
    pickupPoints: state?.pickupPoints?.length ? state.pickupPoints : defaults.pickupPoints,
    customers: state?.customers ?? [],
    orders: state?.orders ?? [],
    reviews: state?.reviews ?? [],
    broadcasts: (state?.broadcasts ?? []).map((message) => ({
      ...message,
      audience: message.audience ?? "all",
    })),
    notifications: (state?.notifications ?? [])
      .filter((notification): notification is CustomerNotification => Boolean(notification?.telegramUserId))
      .map((notification) => ({
        ...notification,
        kind: notification.kind ?? "system",
      }))
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, 500),
    auditLog: state?.auditLog ?? [],
    adminAuth: {
      loginCode: state?.adminAuth?.loginCode,
      loginCodeExpiresAt: state?.adminAuth?.loginCodeExpiresAt,
      sessions: (state?.adminAuth?.sessions ?? []).filter((session) => {
        return Date.parse(session.expiresAt) > Date.now();
      }).map((session) => ({
        ...session,
        role: session.role ?? "owner",
      })),
    },
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

export function nextAuditId() {
  return createId("audit");
}

export function nextNotificationId() {
  return createId("notification");
}

export function appendAuditLog(
  auditLog: AuditLogEntry[],
  entry: Omit<AuditLogEntry, "id" | "createdAt">,
) {
  return [
    {
      id: nextAuditId(),
      createdAt: new Date().toISOString(),
      ...entry,
    },
    ...auditLog,
  ].slice(0, 250);
}

export function appendNotifications(
  notifications: CustomerNotification[],
  entries: Array<Omit<CustomerNotification, "id" | "createdAt">>,
) {
  if (!entries.length) {
    return notifications;
  }

  const nextEntries = entries.map((entry) => ({
    id: nextNotificationId(),
    createdAt: new Date().toISOString(),
    ...entry,
  }));

  return [...nextEntries, ...notifications]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 500);
}

export function markNotificationsRead(
  notifications: CustomerNotification[],
  telegramUserId: number,
  notificationIds?: string[],
) {
  const notificationSet = notificationIds?.length ? new Set(notificationIds) : null;
  const readAt = new Date().toISOString();

  return notifications.map((notification) => {
    if (notification.telegramUserId !== telegramUserId || notification.readAt) {
      return notification;
    }

    if (notificationSet && !notificationSet.has(notification.id)) {
      return notification;
    }

    return {
      ...notification,
      readAt,
    };
  });
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
