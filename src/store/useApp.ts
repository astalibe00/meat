import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { PRODUCTS, type CategoryId, type Product } from "@/data/products";
import {
  getCartLineId,
  getCartPricing,
  getCartSavings,
  getCartSubtotal,
  type CartPricing,
  type PromoResult,
  validatePromoCode,
} from "@/lib/commerce";
import {
  cancelOrderRequest,
  deleteProduct,
  fetchAppState,
  fetchCatalogProducts,
  markNotificationsReadRequest,
  reverseGeocode,
  requestSupport,
  saveCustomerProfile,
  saveProduct,
  sendBroadcast,
  submitOrder,
  submitReviewRequest,
  updateOrderStatusRequest,
} from "@/lib/app-api";
import {
  getInitialOrderStatus,
  getInitialPaymentStatus,
  isOnlinePayment,
} from "@/lib/order-status";
import { getProductMaxUnits, getLineWeightKg } from "@/lib/weights";
import type { TelegramUser } from "@/lib/telegram-webapp";
import type {
  CustomerNotification,
  CustomerOrder,
  CustomerProfile,
  DeliverySlot,
  FulfillmentType,
  GeoPoint,
  ManagedProduct,
  OrderStatus,
  PaymentMethod,
  PaymentReceipt,
  PickupPoint,
  Review,
} from "@/types/app-data";

export type CatalogSort = "popular" | "price-asc" | "price-desc" | "freshest" | "value";

export type Screen =
  | { name: "home" }
  | { name: "categories"; category?: CategoryId; saleOnly?: boolean; sort?: CatalogSort }
  | { name: "search" }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "orders" }
  | { name: "support" }
  | { name: "profile" }
  | { name: "addresses" }
  | { name: "notifications" }
  | { name: "favorites" }
  | { name: "product"; id: string };

export interface CartLine {
  product: ManagedProduct;
  quantity: number;
  weightOption?: string;
}

export interface CheckoutForm {
  name: string;
  phone: string;
  address: string;
  addressLabel: string;
  notes: string;
  fulfillmentType: FulfillmentType;
  pickupPointId: string;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentReceipt?: PaymentReceipt;
  deliverySlot: DeliverySlot;
  coordinates?: GeoPoint;
}

export type Order = CustomerOrder;

interface SupportContact {
  phone: string;
  telegram: string;
}

interface AppState {
  screen: Screen;
  history: Screen[];
  cart: CartLine[];
  favorites: string[];
  recentSearches: string[];
  promoCode: string;
  checkout: CheckoutForm;
  products: ManagedProduct[];
  pickupPoints: PickupPoint[];
  orders: CustomerOrder[];
  notifications: CustomerNotification[];
  reviews: Review[];
  supportContact: SupportContact;
  telegramUser?: TelegramUser;
  isSyncing: boolean;
  syncError?: string;
  navigate: (screen: Screen) => void;
  back: () => void;
  bootstrapFromTelegram: (user?: TelegramUser) => Promise<void>;
  syncRemoteData: (telegramUserId?: number) => Promise<void>;
  addToCart: (
    product: ManagedProduct | Product,
    qty?: number,
    weightOption?: string,
  ) => { ok: boolean; message: string };
  updateQty: (lineId: string, qty: number) => void;
  removeFromCart: (lineId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  pushRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  updateCheckout: (patch: Partial<CheckoutForm>) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  selectPickupPoint: (pickupPointId: string) => void;
  saveProfile: () => Promise<boolean>;
  detectCurrentLocation: () => Promise<{ ok: boolean; error?: string }>;
  applyPromoCode: (code: string) => PromoResult;
  clearPromoCode: () => void;
  placeOrder: () => Promise<{ ok: boolean; order?: CustomerOrder; error?: string }>;
  cancelOrder: (orderId: string, reason?: string) => Promise<{ ok: boolean; error?: string }>;
  submitReview: (payload: {
    orderId: string;
    productId: string;
    rating: number;
    comment?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  requestOrderSupport: (orderId: string, message?: string) => Promise<{ ok: boolean; error?: string }>;
  saveManagedProduct: (payload: Partial<ManagedProduct>) => Promise<{ ok: boolean; error?: string }>;
  deleteManagedProduct: (productId: string) => Promise<{ ok: boolean; error?: string }>;
  broadcastMessage: (title: string, body: string) => Promise<{ ok: boolean; error?: string }>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
  ) => Promise<{ ok: boolean; error?: string }>;
  markNotificationsRead: (
    notificationIds?: string[],
  ) => Promise<{ ok: boolean; error?: string }>;
  repeatOrder: (orderId: string) => { ok: boolean; message: string };
  resetDemoData: () => void;
  cartCount: () => number;
  cartSubtotal: () => number;
  cartSavings: () => number;
  cartPricing: () => CartPricing;
  unreadNotificationsCount: () => number;
  getProductById: (productId: string) => ManagedProduct | undefined;
  getProductReviews: (productId: string) => Review[];
}

export const DEFAULT_PROFILE_NAME = "Fresh Halal mijozi";

const DEFAULT_SUPPORT_CONTACT: SupportContact = {
  phone: "+998990197548",
  telegram: "https://t.me/saidazizov_s",
};

const DEFAULT_CHECKOUT: CheckoutForm = {
  name: DEFAULT_PROFILE_NAME,
  phone: "",
  address: "",
  addressLabel: "Asosiy manzil",
  notes: "",
  fulfillmentType: "delivery",
  pickupPointId: "",
  paymentMethod: "click",
  paymentReference: "",
  paymentReceipt: undefined,
  deliverySlot: "today",
};

const DEFAULT_RECENT_SEARCHES = [
  "Mol ribay steyki",
  "Qo'y kotleti",
  "Tovuq qanotlari",
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

const SEED_PRODUCTS: ManagedProduct[] = PRODUCTS.map((product) => ({
  ...product,
  stockKg: product.weightOptions?.length ? 24 : 12,
  minOrderKg: 0.3,
  enabled: true,
  rating: 4.8,
  reviewCount: 0,
}));

function normalizeManagedProduct(product: Partial<ManagedProduct>, fallback: ManagedProduct[] = SEED_PRODUCTS) {
  const base = fallback.find((item) => item.id === product.id) ?? fallback[0];
  return {
    ...base,
    ...product,
    id: product.id?.trim() || base?.id || `product-${Date.now()}`,
    name: product.name?.trim() || base?.name || "Yangi mahsulot",
    price: Number(product.price ?? base?.price ?? 0),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : base?.oldPrice,
    weight: product.weight?.trim() || base?.weight || "1 kg",
    category: product.category ?? base?.category ?? "beef",
    image: product.image?.trim() || base?.image || "/placeholder.svg",
    tags: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags : base?.tags ?? ["Fresh"],
    description: product.description?.trim() || base?.description || "Tavsif kiritilmagan.",
    weightOptions:
      Array.isArray(product.weightOptions) && product.weightOptions.length > 0
        ? product.weightOptions
        : base?.weightOptions?.length
          ? base.weightOptions
          : [product.weight?.trim() || base?.weight || "1 kg"],
    origin: product.origin?.trim() || base?.origin,
    prepTime: product.prepTime?.trim() || base?.prepTime,
    stockKg: Number(product.stockKg ?? base?.stockKg ?? 0),
    minOrderKg: Number(product.minOrderKg ?? base?.minOrderKg ?? 0.3),
    enabled: product.enabled ?? base?.enabled ?? true,
    rating: Number(product.rating ?? base?.rating ?? 4.8),
    reviewCount: Number(product.reviewCount ?? base?.reviewCount ?? 0),
  } as ManagedProduct;
}

function isSameScreen(a: Screen, b: Screen) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeCheckout(checkout?: Partial<CheckoutForm>, pickupPoints: PickupPoint[] = []) {
  const basePickupPointId = checkout?.pickupPointId?.trim() || pickupPoints[0]?.id || "";
  const fulfillmentType = checkout?.fulfillmentType ?? "delivery";
  const deliverySlot =
    fulfillmentType === "pickup"
      ? "pickup"
      : checkout?.deliverySlot === "tomorrow"
        ? "tomorrow"
        : "today";

  return {
    ...DEFAULT_CHECKOUT,
    ...checkout,
    address: checkout?.address?.trim() ?? "",
    addressLabel: checkout?.addressLabel?.trim() || "Asosiy manzil",
    phone: checkout?.phone?.trim() ?? "",
    notes: checkout?.notes?.trimStart() ?? "",
    paymentReference: checkout?.paymentReference?.trim() ?? "",
    paymentReceipt: checkout?.paymentReceipt,
    pickupPointId: basePickupPointId,
    fulfillmentType,
    paymentMethod: checkout?.paymentMethod ?? DEFAULT_CHECKOUT.paymentMethod,
    deliverySlot,
  };
}

function mergeFavoriteSaleNotifications(
  current: CustomerNotification[],
  products: ManagedProduct[],
  favorites: string[],
  telegramUserId?: number,
) {
  if (!favorites.length) {
    return current;
  }

  const existingIds = new Set(current.map((notification) => notification.id));
  const saleFavorites = products
    .filter((product) => favorites.includes(product.id) && product.enabled !== false && product.oldPrice)
    .slice(0, 3);

  const additions = saleFavorites
    .map((product) => ({
      id: `favorite-sale-${product.id}`,
      telegramUserId: telegramUserId ?? 0,
      title: "Sevimli mahsulot aksiyada",
      body: `${product.name} hozir chegirmada. Savatga qo'shib rasmiylashtirishingiz mumkin.`,
      createdAt: new Date().toISOString(),
      kind: "broadcast" as const,
    }))
    .filter((notification) => !existingIds.has(notification.id));

  return [...additions, ...current];
}

function mergeProfileIntoCheckout(
  checkout: CheckoutForm,
  profile?: CustomerProfile | null,
  telegramUser?: TelegramUser,
  pickupPoints: PickupPoint[] = [],
) {
  const telegramName = [telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(" ").trim();

  return normalizeCheckout(
    {
      ...checkout,
      name: profile?.name?.trim() || checkout.name || telegramName || DEFAULT_PROFILE_NAME,
      phone: profile?.phone?.trim() || checkout.phone,
      address: profile?.address?.trim() || checkout.address,
      addressLabel: profile?.addressLabel?.trim() || checkout.addressLabel,
      coordinates: profile?.coordinates ?? checkout.coordinates,
      fulfillmentType: profile?.preferredFulfillment ?? checkout.fulfillmentType,
      pickupPointId: profile?.pickupPointId?.trim() || checkout.pickupPointId,
    },
    pickupPoints,
  );
}

function toManagedProduct(product: ManagedProduct | Product, currentProducts: ManagedProduct[]) {
  const matched = currentProducts.find((item) => item.id === product.id);
  if (matched) {
    return normalizeManagedProduct(matched, currentProducts);
  }

  return normalizeManagedProduct(product as Partial<ManagedProduct>, currentProducts);
}

function getOrderIndex(orders: CustomerOrder[], orderId: string) {
  return orders.findIndex((order) => order.id === orderId);
}

function replaceOrder(orders: CustomerOrder[], order: CustomerOrder) {
  const index = getOrderIndex(orders, order.id);
  if (index === -1) {
    return [order, ...orders];
  }

  const next = [...orders];
  next[index] = order;
  return next;
}

function adjustStock(products: ManagedProduct[], line: CartLine, direction: "reserve" | "release") {
  const unitKg = getLineWeightKg(line.weightOption, line.product.weight) * line.quantity;
  return products.map((product) => {
    if (product.id !== line.product.id) {
      return product;
    }

    const delta = direction === "reserve" ? -unitKg : unitKg;
    return {
      ...product,
      stockKg: Math.max(0, Number((product.stockKg + delta).toFixed(2))),
    };
  });
}

function getLineMax(line: CartLine, products: ManagedProduct[]) {
  const latest = products.find((item) => item.id === line.product.id) ?? line.product;
  return getProductMaxUnits(latest.stockKg, line.weightOption, latest.weight);
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      screen: { name: "home" },
      history: [],
      cart: [],
      favorites: [],
      recentSearches: DEFAULT_RECENT_SEARCHES,
      promoCode: "",
      checkout: normalizeCheckout(DEFAULT_CHECKOUT, DEFAULT_PICKUP_POINTS),
      products: SEED_PRODUCTS,
      pickupPoints: DEFAULT_PICKUP_POINTS,
      orders: [],
      notifications: [],
      reviews: [],
      supportContact: DEFAULT_SUPPORT_CONTACT,
      isSyncing: false,
      syncError: undefined,
      navigate: (screen) =>
        set((state) => {
          if (isSameScreen(state.screen, screen)) {
            return state;
          }

          return {
            screen,
            history: [...state.history, state.screen].slice(-24),
          };
        }),
      back: () =>
        set((state) => {
          if (state.history.length === 0) {
            return { screen: { name: "home" } };
          }

          const previous = state.history[state.history.length - 1];
          return { screen: previous, history: state.history.slice(0, -1) };
        }),
      bootstrapFromTelegram: async (telegramUser) => {
        const state = get();
        const nextCheckout = mergeProfileIntoCheckout(
          state.checkout,
          null,
          telegramUser,
          state.pickupPoints,
        );

        set({
          telegramUser,
          checkout: nextCheckout,
        });

        if (telegramUser?.id) {
          await get().syncRemoteData(telegramUser.id);
          return;
        }

        await get().syncRemoteData();
      },
      syncRemoteData: async (telegramUserId) => {
        const current = get();
        const resolvedTelegramUserId = telegramUserId ?? current.telegramUser?.id;

        set({ isSyncing: true, syncError: undefined });

        try {
          const response = await fetchAppState(resolvedTelegramUserId);
          const pickupPoints =
            response.pickupPoints && response.pickupPoints.length > 0
              ? response.pickupPoints
              : current.pickupPoints;
          const checkout = mergeProfileIntoCheckout(
            current.checkout,
            response.profile ?? null,
            current.telegramUser,
            pickupPoints,
          );

          const products =
            response.products && response.products.length > 0
              ? response.products.map((product) => normalizeManagedProduct(product, current.products))
              : current.products;
          const remoteNotifications = response.notifications ?? current.notifications;

          set({
            products,
            pickupPoints,
            orders: response.orders ?? current.orders,
            notifications: mergeFavoriteSaleNotifications(
              remoteNotifications,
              products,
              current.favorites,
              resolvedTelegramUserId,
            ),
            reviews: response.reviews ?? current.reviews,
            checkout,
            supportContact: response.support ?? current.supportContact,
            isSyncing: false,
          });
        } catch (error) {
          try {
            const fallback = await fetchCatalogProducts();
            set({
              products:
                fallback.products && fallback.products.length > 0
                  ? fallback.products.map((product) => normalizeManagedProduct(product, current.products))
                  : current.products,
              isSyncing: false,
              syncError: undefined,
            });
          } catch (fallbackError) {
            set({
              isSyncing: false,
              syncError:
                fallbackError instanceof Error
                  ? fallbackError.message
                  : error instanceof Error
                    ? error.message
                    : "Ma'lumotlar yuklanmadi",
            });
          }
        }
      },
      addToCart: (product, qty = 1, weightOption) => {
        const state = get();
        const managedProduct = toManagedProduct(product, state.products);
        const resolvedWeight = weightOption ?? managedProduct.weightOptions?.[0] ?? managedProduct.weight;
        const maxUnits = getProductMaxUnits(managedProduct.stockKg, resolvedWeight, managedProduct.weight);

        if (!managedProduct.enabled || maxUnits <= 0) {
          return { ok: false, message: "Bu mahsulot hozircha mavjud emas." };
        }

        const lineId = getCartLineId(managedProduct.id, resolvedWeight, managedProduct.weight);
        const existing = state.cart.find(
          (line) => getCartLineId(line.product.id, line.weightOption, line.product.weight) === lineId,
        );
        const nextQuantity = Math.min(maxUnits, (existing?.quantity ?? 0) + qty);

        if (nextQuantity <= (existing?.quantity ?? 0)) {
          return {
            ok: false,
            message:
              managedProduct.stockKg <= 0
                ? "Ombordagi qoldiq tugagan."
                : `Maksimal ${maxUnits} ta paket qo'shish mumkin.`,
          };
        }

        if (existing) {
          set({
            cart: state.cart.map((line) =>
              getCartLineId(line.product.id, line.weightOption, line.product.weight) === lineId
                ? { ...line, quantity: nextQuantity }
                : line,
            ),
          });
        } else {
          set({
            cart: [
              ...state.cart,
              { product: managedProduct, quantity: Math.min(qty, maxUnits), weightOption: resolvedWeight },
            ],
          });
        }

        return { ok: true, message: "Mahsulot savatga qo'shildi." };
      },
      updateQty: (lineId, qty) =>
        set((state) => {
          if (qty <= 0) {
            return {
              cart: state.cart.filter(
                (line) => getCartLineId(line.product.id, line.weightOption, line.product.weight) !== lineId,
              ),
            };
          }

          return {
            cart: state.cart.map((line) => {
              const currentId = getCartLineId(line.product.id, line.weightOption, line.product.weight);
              if (currentId !== lineId) {
                return line;
              }

              return {
                ...line,
                quantity: Math.min(qty, getLineMax(line, state.products)),
              };
            }),
          };
        }),
      removeFromCart: (lineId) =>
        set((state) => ({
          cart: state.cart.filter(
            (line) => getCartLineId(line.product.id, line.weightOption, line.product.weight) !== lineId,
          ),
        })),
      toggleFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId],
        })),
      isFavorite: (productId) => get().favorites.includes(productId),
      pushRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed) {
            return state;
          }

          const filtered = state.recentSearches.filter(
            (item) => item.toLowerCase() !== trimmed.toLowerCase(),
          );

          return {
            recentSearches: [trimmed, ...filtered].slice(0, 6),
          };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
      updateCheckout: (patch) =>
        set((state) => ({
          checkout: normalizeCheckout(
            {
              ...state.checkout,
              ...patch,
            },
            state.pickupPoints,
          ),
        })),
      setFulfillmentType: (type) =>
        set((state) => ({
          checkout: normalizeCheckout(
            {
              ...state.checkout,
              fulfillmentType: type,
            },
            state.pickupPoints,
          ),
        })),
      selectPickupPoint: (pickupPointId) =>
        set((state) => ({
          checkout: normalizeCheckout(
            {
              ...state.checkout,
              pickupPointId,
              fulfillmentType: "pickup",
            },
            state.pickupPoints,
          ),
        })),
      saveProfile: async () => {
        const state = get();
        if (!state.telegramUser?.id) {
          return false;
        }

        await saveCustomerProfile({
          telegramUserId: state.telegramUser.id,
          name: state.checkout.name.trim() || DEFAULT_PROFILE_NAME,
          username: state.telegramUser.username,
          phone: state.checkout.phone.trim(),
          address: state.checkout.address.trim(),
          addressLabel: state.checkout.addressLabel.trim(),
          coordinates: state.checkout.coordinates,
          preferredFulfillment: state.checkout.fulfillmentType,
          pickupPointId: state.checkout.pickupPointId,
        });

        return true;
      },
      detectCurrentLocation: async () => {
        if (!navigator.geolocation) {
          return { ok: false, error: "Geolokatsiya qo'llab-quvvatlanmaydi." };
        }

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 12000,
              maximumAge: 0,
            });
          });

          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const result = await reverseGeocode(lat, lon);

          set((state) => ({
            checkout: normalizeCheckout(
              {
                ...state.checkout,
                fulfillmentType: "delivery",
                address: result.address,
                coordinates: result.coordinates,
              },
              state.pickupPoints,
            ),
          }));

          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Manzil aniqlanmadi.",
          };
        }
      },
      applyPromoCode: (code) => {
        const subtotal = get().cartSubtotal();
        const result = validatePromoCode(code, subtotal);

        if (result.ok) {
          set({ promoCode: result.code });
        }

        return result;
      },
      clearPromoCode: () => set({ promoCode: "" }),
      placeOrder: async () => {
        const state = get();
        const pricing = state.cartPricing();
        const checkout = state.checkout;

        if (state.cart.length === 0) {
          return { ok: false, error: "Savat bo'sh." };
        }

        if (!checkout.name.trim()) {
          return { ok: false, error: "Ism kiritilmagan." };
        }

        if (!checkout.phone.trim()) {
          return { ok: false, error: "Telefon raqami kerak." };
        }

        if (checkout.fulfillmentType === "delivery" && !checkout.address.trim()) {
          return { ok: false, error: "Yetkazib berish manzilini tanlang." };
        }

        if (checkout.fulfillmentType === "pickup" && !checkout.pickupPointId) {
          return { ok: false, error: "Tarqatish punktini tanlang." };
        }

        if (
          isOnlinePayment(checkout.paymentMethod) &&
          !checkout.paymentReference.trim() &&
          !checkout.paymentReceipt
        ) {
          return {
            ok: false,
            error: "P2P to'lovdan keyin chek rasmi yoki oxirgi 4 raqamni kiriting.",
          };
        }

        const overLimit = state.cart.find((line) => line.quantity > getLineMax(line, state.products));
        if (overLimit) {
          return {
            ok: false,
            error: `${overLimit.product.name} uchun qoldiq yetarli emas. Katta buyurtmalar uchun +998990197548 raqamiga qo'ng'iroq qiling.`,
          };
        }

        if (state.telegramUser?.id) {
          await state.saveProfile();
        }

        try {
          const response = await submitOrder({
            telegramUserId: state.telegramUser?.id,
            username: state.telegramUser?.username,
            firstName: state.telegramUser?.first_name,
            lastName: state.telegramUser?.last_name,
            notes: checkout.notes.trim(),
            paymentMethod: checkout.paymentMethod,
            paymentReference: checkout.paymentReference.trim(),
            paymentReceipt: checkout.paymentReceipt,
            promoCode: state.promoCode,
            customer: {
              name: checkout.name.trim(),
              phone: checkout.phone.trim(),
              address: checkout.address.trim(),
              addressLabel: checkout.addressLabel.trim(),
              coordinates: checkout.coordinates,
              pickupPointId: checkout.pickupPointId,
              fulfillmentType: checkout.fulfillmentType,
              deliverySlot: checkout.deliverySlot,
            },
            items: state.cart.map((line) => ({
              productId: line.product.id,
              quantity: line.quantity,
              weightOption: line.weightOption,
            })),
          });

          const fallbackOrder: CustomerOrder | undefined = response.order
            ? undefined
            : {
                id: `MEAT-${String(Date.now()).slice(-8)}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                items: state.cart,
                subtotal: pricing.subtotal,
                savings: pricing.savings,
                promoDiscount: pricing.promoDiscount,
                delivery: pricing.delivery,
                total: pricing.total,
                promoCode: pricing.activePromoCode,
                customer: {
                  telegramUserId: state.telegramUser?.id,
                  name: checkout.name.trim(),
                  username: state.telegramUser?.username,
                  phone: checkout.phone.trim(),
                  address: checkout.address.trim(),
                  addressLabel: checkout.addressLabel.trim(),
                  coordinates: checkout.coordinates,
                  pickupPointId: checkout.pickupPointId,
                  fulfillmentType: checkout.fulfillmentType,
                  deliverySlot: checkout.deliverySlot,
                  notes: checkout.notes.trim(),
                },
                paymentMethod: checkout.paymentMethod,
                paymentCardNumber: isOnlinePayment(checkout.paymentMethod)
                  ? "9860350140942508"
                  : undefined,
                paymentReference: checkout.paymentReference.trim() || undefined,
                paymentReceipt: checkout.paymentReceipt,
                paymentStatus: getInitialPaymentStatus(checkout.paymentMethod),
                status: getInitialOrderStatus(checkout.paymentMethod),
                statusHistory: [],
              };

          const placedOrder = response.order ?? fallbackOrder;
          if (!placedOrder) {
            return { ok: false, error: "Buyurtma yaratilmadi." };
          }

          set((current) => ({
            orders: replaceOrder(current.orders, placedOrder),
            products: current.cart.reduce(
              (products, line) => adjustStock(products, line, "reserve"),
              current.products,
            ),
            cart: [],
            promoCode: "",
            checkout: normalizeCheckout(
              {
                ...current.checkout,
                notes: "",
                paymentReference: "",
                paymentReceipt: undefined,
              },
              current.pickupPoints,
            ),
            screen: { name: "orders" },
            history: [{ name: "home" }],
          }));

          return { ok: true, order: placedOrder };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Buyurtma yuborilmadi.",
          };
        }
      },
      cancelOrder: async (orderId, reason) => {
        try {
          const response = await cancelOrderRequest(orderId, reason);
          if (response.order) {
            set((state) => ({
              orders: replaceOrder(state.orders, response.order!),
            }));
          }

          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Bekor qilish bajarilmadi.",
          };
        }
      },
      submitReview: async ({ orderId, productId, rating, comment }) => {
        const state = get();

        try {
          const response = await submitReviewRequest({
            orderId,
            productId,
            rating,
            comment,
            customerName: state.checkout.name.trim() || DEFAULT_PROFILE_NAME,
          });

          set((current) => ({
            reviews: response.reviews ?? current.reviews,
            products: response.products ?? current.products,
          }));

          await state.syncRemoteData();
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Izoh saqlanmadi.",
          };
        }
      },
      requestOrderSupport: async (orderId, message) => {
        const state = get();
        const order = state.orders.find((item) => item.id === orderId);
        if (!order) {
          return { ok: false, error: "Buyurtma topilmadi." };
        }

        const body =
          message?.trim() ||
          `${order.id} buyurtmasi bo'yicha mijozga yordam kerak. Holat: ${order.status}.`;

        try {
          await requestSupport({
            topic: "Buyurtma bo'yicha yordam",
            message: body,
            latestOrderId: order.id,
            source: "mini-app-order",
            customer: {
              name: order.customer.name,
              phone: order.customer.phone,
              address: order.customer.address,
            },
            telegramUser: {
              id: state.telegramUser?.id ?? order.customer.telegramUserId,
              username: state.telegramUser?.username ?? order.customer.username,
            },
          });

          set((current) => ({
            orders: current.orders.map((item) =>
              item.id === order.id
                ? {
                    ...item,
                    supportRequests: [
                      {
                        id: `support-${Date.now()}`,
                        message: body,
                        createdAt: new Date().toISOString(),
                        status: "open",
                      },
                      ...(item.supportRequests ?? []),
                    ],
                  }
                : item,
            ),
          }));

          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Support so'rovi yuborilmadi.",
          };
        }
      },
      saveManagedProduct: async (payload) => {
        try {
          const response = await saveProduct(payload);
          set((state) => ({
            products: response.products ?? state.products,
          }));
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Mahsulot saqlanmadi.",
          };
        }
      },
      deleteManagedProduct: async (productId) => {
        try {
          const response = await deleteProduct(productId);
          set((state) => ({
            products: response.products ?? state.products.filter((item) => item.id !== productId),
          }));
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Mahsulot o'chirilmadi.",
          };
        }
      },
      broadcastMessage: async (title, body) => {
        try {
          await sendBroadcast({ title, body });
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Xabar yuborilmadi.",
          };
        }
      },
      updateOrderStatus: async (orderId, status) => {
        try {
          const response = await updateOrderStatusRequest(orderId, status);
          if (response.order) {
            set((state) => ({
              orders: replaceOrder(state.orders, response.order!),
            }));
          }

          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Status yangilanmadi.",
          };
        }
      },
      markNotificationsRead: async (notificationIds) => {
        const state = get();
        const telegramUserId = state.telegramUser?.id;
        const readAt = new Date().toISOString();

        if (!telegramUserId) {
          set((current) => ({
            notifications: current.notifications.map((notification) => {
              if (notification.readAt) {
                return notification;
              }

              if (notificationIds?.length && !notificationIds.includes(notification.id)) {
                return notification;
              }

              return {
                ...notification,
                readAt,
              };
            }),
          }));
          return { ok: true };
        }

        try {
          const response = await markNotificationsReadRequest({
            telegramUserId,
            notificationIds,
          });

          set((current) => ({
            notifications: response.notifications ?? current.notifications,
          }));

          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Xabarlar yangilanmadi.",
          };
        }
      },
      repeatOrder: (orderId) => {
        const state = get();
        const order = state.orders.find((item) => item.id === orderId);
        if (!order) {
          return { ok: false, message: "Buyurtma topilmadi." };
        }

        let lastError = "";
        for (const line of order.items) {
          const result = state.addToCart(line.product, line.quantity, line.weightOption);
          if (!result.ok) {
            lastError = result.message;
          }
        }

        set({
          screen: { name: "cart" },
          history: [...state.history, state.screen].slice(-24),
        });

        return {
          ok: !lastError,
          message: lastError || "Buyurtma savatga qayta qo'shildi.",
        };
      },
      resetDemoData: () =>
        set((state) => ({
          cart: [],
          favorites: [],
          recentSearches: [],
          promoCode: "",
          orders: [],
          notifications: [],
          reviews: [],
          checkout: normalizeCheckout(
            {
              ...DEFAULT_CHECKOUT,
              name: state.telegramUser
                ? [state.telegramUser.first_name, state.telegramUser.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || DEFAULT_PROFILE_NAME
                : DEFAULT_PROFILE_NAME,
            },
            state.pickupPoints,
          ),
          screen: { name: "home" },
          history: [],
        })),
      cartCount: () => get().cart.reduce((total, line) => total + line.quantity, 0),
      cartSubtotal: () => getCartSubtotal(get().cart),
      cartSavings: () => getCartSavings(get().cart),
      cartPricing: () => {
        const state = get();
        const pricing = getCartPricing(state.cart, state.promoCode);
        if (state.checkout.fulfillmentType === "pickup") {
          return {
            ...pricing,
            delivery: 0,
            total: Math.max(0, pricing.subtotal - pricing.promoDiscount),
            freeDeliveryUnlocked: pricing.subtotal > 0,
          };
        }

        return pricing;
      },
      unreadNotificationsCount: () =>
        get().notifications.filter((notification) => !notification.readAt).length,
      getProductById: (productId) => get().products.find((product) => product.id === productId),
      getProductReviews: (productId) =>
        get()
          .reviews.filter((review) => review.productId === productId)
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    }),
    {
      name: "fresh-halal-direct-state",
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        favorites: state.favorites,
        recentSearches: state.recentSearches,
        checkout: {
          ...state.checkout,
          paymentReceipt: undefined,
        },
        promoCode: state.promoCode,
      }),
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<AppState> & {
          checkout?: Partial<CheckoutForm>;
        };

        return {
          ...state,
          checkout: normalizeCheckout(state.checkout, DEFAULT_PICKUP_POINTS),
        };
      },
      merge: (persistedState, currentState) => {
        const state = (persistedState ?? {}) as Partial<AppState> & {
          checkout?: Partial<CheckoutForm>;
        };

        return {
          ...currentState,
          ...state,
          checkout: normalizeCheckout(
            {
              ...currentState.checkout,
              ...state.checkout,
            },
            currentState.pickupPoints,
          ),
          recentSearches:
            state.recentSearches && state.recentSearches.length > 0
              ? state.recentSearches
              : currentState.recentSearches,
        };
      },
    },
  ),
);
